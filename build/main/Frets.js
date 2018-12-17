"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const maquette_1 = require("maquette");
const maquette = require("maquette");
const path_parser_1 = require("path-parser");
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
class FRETS {
    /**
     * @param  {T} modelProps A required initial instance of the application Props(Model)
     * @param  {U} actions A required instance of an actions class
     *  (which will be registered later with registerAction `App.actions.X = App.registerAction(fn)`)
     */
    constructor(modelProps, actions) {
        this.actions = actions;
        this.routes = {};
        this.cachedNode = maquette_1.h("div#default");
        this.allowAsyncRender = true;
        this.stateIsMutated = false;
        /**
         * The function used to render VNodes for insertion into the page DOM.
         * This method should be configured by calling FRETS.registerView(...)
         * @param  {string} id?
         */
        this.stateRenderer = (id = "default") => maquette_1.h(`div#${id}`, ["Default FRETS: assign a render method using `.registerView()`"]);
        /**
         * Sets up a render function for the app
         * @param  {(props:T,actions:U)=>VNode} renderFn
         */
        this.registerView = (renderFn) => {
            this.stateRenderer = () => maquette_1.h(`div#${this.rootId}`, [renderFn(this)]);
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
                return maquette_1.h(`div#${this.rootId}`, [this.cachedNode]);
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
        this.projector = maquette_1.createProjector();
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
            spec: new path_parser_1.default(path),
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
exports.FRETS = FRETS;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHVDQUFrRjtBQUNsRixxQ0FBcUM7QUFDckMsNkNBQStCO0FBa0IvQjs7O0dBR0c7QUFDSCxNQUFhLEtBQUs7SUFzQmhCOzs7O09BSUc7SUFDSCxZQUFZLFVBQWEsRUFBUyxPQUFVO1FBQVYsWUFBTyxHQUFQLE9BQU8sQ0FBRztRQWZyQyxXQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUs5QixlQUFVLEdBQVUsWUFBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXJDLHFCQUFnQixHQUFZLElBQUksQ0FBQztRQUNqQyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQWlDeEM7Ozs7V0FJRztRQUNJLGtCQUFhLEdBQTJCLENBQUMsS0FBYSxTQUFTLEVBQUUsRUFBRSxDQUN4RSxZQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLCtEQUErRCxDQUFDLENBQUMsQ0FBQTtRQUVuRjs7O1dBR0c7UUFDSSxpQkFBWSxHQUFHLENBQUMsUUFBcUMsRUFBRSxFQUFFO1lBQzVELElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxFQUFFLENBQUMsWUFBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDLENBQUE7UUFDTDs7Ozs7V0FLRztRQUNNLHNCQUFpQixHQUFHLENBQU8sUUFBOEMsRUFBRSxFQUFFO1lBQ2xGLElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxFQUFFO2dCQUN4QixzR0FBc0c7Z0JBQ3RHLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO29CQUN6QixRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUU7d0JBQy9CLHdHQUF3Rzt3QkFDeEcsSUFBSSxD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