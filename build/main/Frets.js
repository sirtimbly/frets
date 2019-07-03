"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maquette_1 = require("maquette");
const path_parser_1 = require("path-parser");
function setup(modelProps, setupFn, opts) {
    const projector = maquette_1.createProjector();
    const actions = {};
    const routes = {};
    const registeredFieldActions = {};
    /**
     * Returns a path when given the key of a route that was previously registered.
     * @param  {string} key
     * @param  {any} data? A route data object
     * @returns string
     */
    function getRouteLink(key, data) {
        if (!routes || !routes[key]) {
            return false;
        }
        return routes[key].spec.build(data || {});
    }
    /**
     * Change the browser location to match the path configured in the route with the
     * provided key. You still need to call an action to udpate state before the UI will re-render.
     * @param  {string} key
     * @param  {any} data?
     */
    function navToRoute(key, data) {
        const r = getRouteLink(key, data);
        if (r) {
            navToPath(r);
        }
    }
    /**
     * Update the browser location with the provided raw string path.
     * @param  {string} path
     */
    function navToPath(path) {
        try {
            window.history.pushState(modelProps, "", path);
        }
        catch (error) {
            window.location.pathname = path;
        }
    }
    let modelPresenter;
    let state;
    function registerAction(key, actionFn) {
        if (!actions[key]) {
            actions[key] = actionFn;
        }
        return (event) => {
            actionFn(event, modelPresenter);
        };
    }
    function registerRouteAction(key, path, actionFn) {
        routes[key] = {
            calculator: actionFn,
            spec: new path_parser_1.default(path),
        };
    }
    function registerModel(presenterFn) {
        modelPresenter = (proposal) => {
            presenterFn(proposal, state);
        };
    }
    function registerView(renderFn) {
        stateRenderer = () => renderFn(F);
        state = (newProps) => {
            modelProps = newProps;
            projector.scheduleRender();
        };
    }
    function registerField(key, initialValue, validation) {
        function handler(evt) {
            const val = evt.target.value;
            modelProps.registeredFieldsValues[key] = val;
            if (validation) {
                let errors = [];
                if (validation.notEmpty === true && (!val || val === "")) {
                    errors = ["Should not be empty"];
                }
                modelProps.registeredFieldValidationErrors[key] = errors;
            }
        }
        if (modelProps.registeredFieldsValues[key] === undefined) {
            modelProps.registeredFieldsValues[key] = initialValue || "";
            modelProps.registeredFieldValidationErrors[key] = [];
        }
        if (registeredFieldActions[key] === undefined) {
            registeredFieldActions[key] = handler;
        }
        return {
            clear: () => {
                modelProps.registeredFieldsValues[key] = initialValue || "";
                modelProps.registeredFieldValidationErrors[key] = [];
            },
            handler,
            key,
            validationErrors: modelProps.registeredFieldValidationErrors[key],
            value: modelProps.registeredFieldsValues[key],
        };
    }
    /**
     * Checks to see if any of the registerd routes are matched and then updates the app state using
     * the provided transformation function.
     * @param  {Readonly<T>} props
     * @returns T
     */
    function applyRouteFunction(props) {
        for (const key in routes) {
            if (routes.hasOwnProperty(key)) {
                const entry = routes[key];
                const res = entry.spec.test(window.location.pathname);
                if (res) {
                    entry.calculator({ key, path: entry.spec.path, data: res }, modelPresenter);
                }
            }
        }
    }
    let stateRenderer;
    const F = {
        getRouteLink,
        modelProps,
        navToPath,
        navToRoute,
        registerAction,
        registerField,
        registerModel,
        registerRouteAction,
        registerView,
    };
    setupFn(F);
    window.onpopstate = function (evt) {
        applyRouteFunction(modelProps);
    };
    return {
        fretsApp: F,
        mountTo: (id) => {
            projector.merge(document.getElementById(id), stateRenderer);
        },
        stateRenderer,
    };
}
exports.setup = setup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBa0Y7QUFHbEYsNkNBQStCO0FBNkQvQixTQUFnQixLQUFLLENBQ25CLFVBQWEsRUFBRSxPQUF5QyxFQUFFLElBQW9CO0lBRTlFLE1BQU0sU0FBUyxHQUFHLDBCQUFlLEVBQUUsQ0FBQztJQUVwQyxNQUFNLE9BQU8sR0FFVCxFQUFHLENBQUM7SUFFUixNQUFNLE1BQU0sR0FLUixFQUFFLENBQUM7SUFFUCxNQUFNLHNCQUFzQixHQUV4QixFQUFFLENBQUM7SUFFUDs7Ozs7T0FLRztJQUNILFNBQVMsWUFBWSxDQUFDLEdBQVcsRUFBRSxJQUFXO1FBQzVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRDs7Ozs7T0FLRztJQUNILFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBRSxJQUFXO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEVBQUU7WUFDTCxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDZDtJQUNILENBQUM7SUFDRDs7O09BR0c7SUFDSCxTQUFTLFNBQVMsQ0FBQyxJQUFZO1FBQzdCLElBQUk7WUFDRixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDakM7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