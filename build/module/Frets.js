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
                        this.render(this.mutableProps);
                    });
                }
                return h(`div#${this.rootId}`, [this.cachedNode]);
            };
        });
        /**
         * The Render function is useful for when an async promise resolves (like from a network request) - and you need
         *  to update the props and re-render the app with the new data.
         * @param  {T} props
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
            this.mutate(this.mutableProps);
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
                    const box = Object.assign({}, this.mutableProps); // make a new copy of model data (is this needed?)
                    const newData = actionFn(e, box);
                    this.mutate(newData);
                    presenterFn(this.mutableProps);
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
         * @param  {T} newProps
         * @param  {T} oldProps
         */
        this.validator = (p, o) => [p, true];
        /**
         * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
         * Please make this function idempotent. Overwrite this with your own specific implementation.
         * @param  {T} newProps
         * @param  {T} oldProps
         */
        this.calculator = (p, o) => p;
        const context = this;
        this.mutableProps = modelProps;
        this.projector = createProjector();
        this.cache = maquette.createCache();
        this.registerAction = this.makeActionStately(function stateUpdater(props) {
            context.render(props, false);
        }, this.mutableProps);
        window.onpopstate = function (evt) {
            // console.log("PopState handler called", this.location.href);
            context.render(context.mutableProps);
        };
    }
    /**
     * Get a deep copy of the current state. Not a reference to the actual internal state.
     * @returns T
     */
    get modelProps() {
        return JSON.parse(JSON.stringify(this.deepCopyOfModelProps));
    }
    set modelProps(v) {
        throw new Error("You cannot update the internal state this way. Use an Action.");
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
            window.history.pushState(this.mutableProps, "", path);
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
        if (!this.mutableProps.registeredFieldsValues[key]) {
            const props = this.mutableProps;
            props.registeredFieldsValues[key] = initialValue || "";
            props.registeredFieldValidationErrors[key] = [];
            this.mutableProps = props;
        }
        if (!this.actions.registeredFieldActions[key]) {
            this.actions.registeredFieldActions[key] = this.registerAction((evt, data) => {
                data.registeredFieldsValues[key] = evt.target.value;
                return data;
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
            validationErrors: this.mutableProps.registeredFieldValidationErrors[key],
            value: this.mutableProps.registeredFieldsValues[key],
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
    get mutableProps() {
        return this.internalModelProps;
    }
    set mutableProps(v) {
        // console.log("Setting mutable props", v);
        this.internalModelProps = v;
        this.deepCopyOfModelProps = v;
    }
    /**
     * The one and only place that this application model state is updated, first it runs the validation method,
     * then it runs any route functions, and finally runs the real state calculation method.
     * @param  {T} props
     */
    mutate(props) {
        let isValid = true;
        let data = props;
        this.stateIsMutated = true;
        [data, isValid] = this.validator(data, this.mutableProps);
        if (!isValid) {
            this.mutableProps = data;
            return;
        }
        data = this.applyRouteFunction(data);
        data = this.calculator(data, this.mutableProps);
        this.mutableProps = data;
    }
    /**
     * Checks to see if any of the registerd routes are matched and then updates the app state using
     * the provided transformation function.
     * @param  {T} props
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxPQUFPLEVBQW9CLGVBQWUsRUFBRSxDQUFDLEVBQW9CLE1BQU0sVUFBVSxDQUFDO0FBQ2xGLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQztBQWtCL0I7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLEtBQUs7SUFzQmhCOzs7O09BSUc7SUFDSCxZQUFZLFVBQWEsRUFBUyxPQUFVO1FBQVYsWUFBTyxHQUFQLE9BQU8sQ0FBRztRQWZyQyxXQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUs5QixlQUFVLEdBQVUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXJDLHFCQUFnQixHQUFZLElBQUksQ0FBQztRQUNqQyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQWlDeEM7Ozs7V0FJRztRQUNJLGtCQUFhLEdBQTJCLENBQUMsS0FBYSxTQUFTLEVBQUUsRUFBRSxDQUN4RSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLCtEQUErRCxDQUFDLENBQUMsQ0FBQTtRQUVuRjs7O1dBR0c7UUFDSSxpQkFBWSxHQUFHLENBQUMsUUFBcUMsRUFBRSxFQUFFO1lBQzVELElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDLENBQUE7UUFDTDs7Ozs7V0FLRztRQUNNLHNCQUFpQixHQUFHLENBQU8sUUFBOEMsRUFBRSxFQUFFO1lBQ2xGLElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxFQUFFO2dCQUN4QixzR0FBc0c7Z0JBQ3RHLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO29CQUN6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