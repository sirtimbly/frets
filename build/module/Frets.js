var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createProjector, h } from "maquette";
import * as maquette from "maquette";
import Path from "path-parser";
import deepFreeze from "./Freeze";
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
export class FRETS {
    /**
     * @param  {T} modelProps A required initial instance of the application Props(Model)
     * @param  {U} actions A required instance of an actions class
     *  (which will be registered later with registerAction `App.actions.X = App.registerAction(fn)`)
     */
    constructor(modelProps, actions) {
        this.actions = actions;
        this.routes = {};
        this.cachedNode = h("div#default");
        this.allowAsyncRender = true;
        this.stateIsMutated = false;
        /**
         * The function used to render VNodes for insertion into the page DOM.
         * This method should be configured by calling FRETS.registerView(...)
         * @param  {string} id?
         */
        this.stateRenderer = (id = "default") => h(`div#${id}`, ["Default FRETS: assign a render method using `.registerView()`"]);
        /**
         * Sets up a render function for the app
         * @param  {(props:T,actions:U)=>VNode} renderFn
         */
        this.registerView = (renderFn) => {
            this.stateRenderer = () => h(`div#${this.rootId}`, [renderFn(this)]);
        };
        /**
         * Regisers a function that returns a promise of a VNode - this will be called and the UI
         * will be rerendered upon the resolution of that function. This allows for lazy loading
         * of UI modules that aren't needed right away.
         * @param  {(props:T,actions:U)=>Promise<VNode>} renderFn
         */
        this.registerViewAsync = (renderFn) => __awaiter(this, void 0, void 0, function* () {
            this.stateRenderer = () => {
                // console.log("Async state render function executing. allow async render: " + this.allowAsyncRender);
                if (this.allowAsyncRender) {
                    renderFn(this).then((n) => {
                        // at this point the lazy loading should be complete so let's invalidate the cache and render again once
                        this.cache.invalidate();
                        this.allowAsyncRender = false;
                        // console.log("loaded view code, scheduling render with new VNode");
                        this.cachedNode = n;
                        this.render(this.modelProps);
                    });
                }
                return h(`div#${this.rootId}`, [this.cachedNode]);
            };
        });
        /**
         * The Render function is useful for when an async promise resolves (like from a network request) - and you need
         *  to update the props and re-render the app with the new data.
         * @param  {Readonly<T>} props
         */
        this.render = (props, recalculate = true) => {
            // console.log("Render: checking the cache");
            this.cache.result([JSON.stringify(props)], () => {
                // console.log("Render: props have changed. ", JSON.stringify(this.mutableProps));
                if (!this.stateIsMutated || recalculate) {
                    this.mutate(props);
                }
                this.projector.scheduleRender();
                this.stateIsMutated = false;
                return props;
            });
        };
        /**
         * Mount the application to the DOM.
         * @param  {string} id The id of the dom element to replace
         */
        this.mountTo = (id) => {
            // console.log("Mount To");
            this.mutate(this.modelProps);
            this.projector.merge(document.getElementById(id), this.stateRenderer);
        };
        /**
         * Returns a function that accepts an action function, Wraps the action with our necessary hooks, and returns a
         * funtion compatible with the standard Maquette event handler signature.
         * @param  {(props:T)=>void} presenterFn A reference to the main FRETS render function for this instance.
         * @param  {T} data
         */
        this.makeActionStately = (presenterFn, data) => {
            // this function will return functions that can be used as actions in a view
            return (actionFn) => {
                return (e) => {
                    // since state has probably changed lets allow async rendering once
                    // console.log("event handled: action " + actionFn.name + " event.target = " + (e.target as HTMLElement).id);
                    this.allowAsyncRender = true;
                    const newData = actionFn(e, this.modelProps);
                    this.mutate(newData);
                    presenterFn(this.modelProps);
                };
            };
        };
        // the following methods should be overwritten by the Dev during setup, but its ok to work with these defaults
        /**
         * Check for any properties that are invalid or out of bounds and either reset them or add validation/warning messages
         *  somewhere on the props for display. Please make this function idempotent. Overwrite this with your own specifc
         *  implementation. It can return an updated state object containing validation error messages as well as returning
         *  false in the tuple to make mutation stop early and show errors to the user. The calculate method and route methods
         * will not be called when your validate method returns false in the second parameter of the return tuple.
         * @param  {Readonly<T>} newProps
         * @param  {Readonly<T>} oldProps
         */
        this.validator = (p, o) => [p, true];
        /**
         * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
         * Please make this function idempotent. Overwrite this with your own specific implementation.
         * @param  {Readonly<T>} newProps
         * @param  {Readonly<T>} oldProps
         */
        this.calculator = (p, o) => p;
        const context = this;
        this.mutateProps(modelProps);
        this.projector = createProjector();
        this.cache = maquette.createCache();
        this.registerAction = this.makeActionStately(function stateUpdater(props) {
            context.render(props, false);
        }, this.modelProps);
        window.onpopstate = function (evt) {
            // console.log("PopState handler called", this.location.href);
            context.render(context.modelProps);
        };
    }
    /**
     * Get a deep-frozen copy of the current state. For immutability it's not a reference to the actual internal state.
     * @returns T
     */
    get modelProps() {
        return this.externalModelProps;
    }
    /**
     * Returns a path when given the key of a route that was previously registered.
     * @param  {string} key
     * @param  {any} data? A route data object
     * @returns string
     */
    getRouteLink(key, data) {
        if (!this.routes || !this.routes[key]) {
            return false;
        }
        return this.routes[key].spec.build(data || {});
    }
    /**
     * Change the browser location to match the path configured in the route with the
     * provided key. You still need to call an action to udpate state before the UI will re-render.
     * @param  {string} key
     * @param  {any} data?
     */
    navToRoute(key, data) {
        const r = this.getRouteLink(key, data);
        if (r) {
            this.navToPath(r);
        }
    }
    /**
     * Update the browser location with the provided raw string path.
     * @param  {string} path
     */
    navToPath(path) {
        try {
            window.history.pushState(this.modelProps, "", path);
        }
        catch (error) {
            window.location.pathname = path;
        }
    }
    /**
     * Registers simple form fields on the property model, and on the actions to update it. If the field key hasn't been
     * registered yet, it initializes that value on the properties with the value passed in. This makes it so that UI
     * functions can register themselves on the props and the actions without the root app needing to know about it.
     * @param  {string} key
     * @param  {S} initialValue?
     * @returns IRegisteredField
     */
    registerField(key, initialValue) {
        if (!this.modelProps.registeredFieldsValues[key]) {
            const props = Object.assign({}, this.modelProps, { registeredFieldValidationErrors: Object.assign({
                    [key]: [],
                }, this.modelProps.registeredFieldValidationErrors), registeredFieldsValues: Object.assign({
                    [key]: initialValue || "",
                }, this.modelProps.registeredFieldsValues) });
            this.mutateProps(props);
        }
        if (!this.actions.registeredFieldActions[key]) {
            this.actions.registeredFieldActions[key] = this.registerAction((evt, data) => {
                const props = Object.assign({}, data, { registeredFieldsValues: Object.assign({}, data.registeredFieldsValues) });
                props.registeredFieldsValues[key] = evt.target.value;
                return props;
            });
        }
        return this.getField(key);
    }
    /**
     * Returns the field object that was previously registered with the given key.
     * Including an event handler that will update the field. Any validation errors on the field,
     * and whatever the current value is.
     * @param  {string} key
     * @returns IRegisteredField
     */
    getField(key) {
        return {
            handler: this.actions.registeredFieldActions[key],
            validationErrors: this.modelProps.registeredFieldValidationErrors[key],
            value: this.modelProps.registeredFieldsValues[key],
        };
    }
    /**
     * Register a new route that will execute the given function whenever the provided path
     *  is matched during the model mutation step. This function should update the app state
     * properties to reflect the status that is indicated by the given route. The keys are useful for
     * navigation methods that need to refer to a route programmatically later.
     * (see path-parser documentation at https://github.com/troch/path-parser).
     * @param  {string} routeName
     * @param  {string} path
     * @param  {(routeName:string,routeParams:any,props:T)=>T} fn
     */
    registerRoute(routeName, path, fn) {
        this.routes[routeName] = {
            calculator: fn,
            spec: new Path(path),
        };
    }
    // private get mutableProps(): T {
    //   return this.internalModelProps;
    // }
    mutateProps(v) {
        // console.log("Setting mutable props", v);
        // this.internalModelProps = JSON.parse(JSON.stringify(v));
        this.externalModelProps = deepFreeze(v);
    }
    /**
     * The one and only place that this application model state is updated, first it runs the validation method,
     * then it runs any route functions, and finally runs the real state calculation method.
     * @param  {Readonly<T>} props
     */
    mutate(props) {
        let isValid = true;
        let data = props;
        this.stateIsMutated = true;
        [data, isValid] = this.validator(data, this.modelProps);
        if (!isValid) {
            this.mutateProps(data);
            return;
        }
        data = this.applyRouteFunction(data);
        data = this.calculator(data, this.modelProps);
        this.mutateProps(data);
    }
    /**
     * Checks to see if any of the registerd routes are matched and then updates the app state using
     * the provided transformation function.
     * @param  {Readonly<T>} props
     * @returns T
     */
    applyRouteFunction(props) {
        let data = Object.assign({}, props); // is this necessary?
        for (const key in this.routes) {
            if (this.routes.hasOwnProperty(key)) {
                const entry = this.routes[key];
                const res = entry.spec.test(window.location.pathname);
                // console.log("Looking for Route", key, res);
                if (res) {
                    data = entry.calculator(key, res, data);
                    return data; // only apply the first route that matches for now
                }
            }
        }
        return data; // fall through to default
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxPQUFPLEVBQW9CLGVBQWUsRUFBRSxDQUFDLEVBQW9CLE1BQU0sVUFBVSxDQUFDO0FBQ2xGLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQztBQUUvQixPQUFPLFVBQVUsTUFBTSxVQUFVLENBQUM7QUFnQmxDOzs7R0FHRztBQUNILE1BQU0sT0FBTyxLQUFLO0lBc0JoQjs7OztPQUlHO0lBQ0gsWUFBWSxVQUFhLEVBQVMsT0FBVTtRQUFWLFlBQU8sR0FBUCxPQUFPLENBQUc7UUFmckMsV0FBTSxHQUFzQixFQUFFLENBQUM7UUFLOUIsZUFBVSxHQUFVLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUVyQyxxQkFBZ0IsR0FBWSxJQUFJLENBQUM7UUFDakMsbUJBQWMsR0FBWSxLQUFLLENBQUM7UUE2QnhDOzs7O1dBSUc7UUFDSSxrQkFBYSxHQUEyQixDQUFDLEtBQWEsU0FBUyxFQUFFLEVBQUUsQ0FDeEUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQywrREFBK0QsQ0FBQyxDQUFDLENBQUE7UUFFbkY7OztXQUdHO1FBQ0ksaUJBQVksR0FBRyxDQUFDLFFBQXFDLEVBQUUsRUFBRTtZQUM1RCxJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFBO1FBQ0w7Ozs7O1dBS0c7UUFDTSxzQkFBaUIsR0FBRyxDQUFPLFFBQThDLEVBQUUsRUFBRTtZQUNsRixJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsRUFBRTtnQkFDeEIsc0dBQXNHO2dCQUN0RyxJ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