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
        applyRouteFunction(modelProps);
    }
    const modelPresenters = {};
    function modelPresenter(proposal) {
        for (const key in modelPresenters) {
            if (modelPresenters.hasOwnProperty(key)) {
                const element = modelPresenters[key];
                element(proposal);
            }
        }
    }
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
        // console.log("register route", key, path)
        routes[key] = {
            calculator: actionFn,
            spec: new path_parser_1.default(path),
        };
    }
    function registerAcceptor(presenterFn) {
        const loc = presenterFn.toString().slice(0, 250);
        if (!modelPresenters[loc]) {
            modelPresenters[loc] = (proposal) => {
                presenterFn(proposal, state);
            };
        }
    }
    function registerView(renderFn) {
        stateRenderer = () => renderFn(F);
        state = (newProps) => {
            modelProps = newProps;
            projector.scheduleRender();
        };
    }
    function registerField(key, initialValue, validation) {
        function handler(evt, skipValidation) {
            modelProps.registeredFieldsValues[key] = evt.target.value;
            if (evt.target.value.length > 0) {
                modelProps.registeredFieldsState[key].dirty = true; // latching switch
            }
            if (!skipValidation) {
                validate();
            }
        }
        function validate() {
            if (validation) {
                const val = modelProps.registeredFieldsValues[key];
                const errors = [];
                if (validation.notEmpty && (!val || val === "")) {
                    errors.push(validation.notEmpty.message);
                }
                if (validation.minLength && val.length < validation.minLength.value) {
                    errors.push(validation.minLength.message);
                }
                if (validation.maxLength && val.length > validation.maxLength.value) {
                    errors.push(validation.maxLength.message);
                }
                modelProps.registeredFieldValidationErrors[key] = errors;
            }
        }
        if (modelProps.registeredFieldsValues[key] === undefined) {
            modelProps.registeredFieldsValues[key] = initialValue || "";
            modelProps.registeredFieldValidationErrors[key] = [];
            modelProps.registeredFieldsState[key] = { dirty: false };
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
            isDirty: () => modelProps.registeredFieldsState[key].dirty,
            isValid: () => !(modelProps.registeredFieldValidationErrors[key].length > 0),
            key,
            validate,
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
        // console.log("routes:", routes)
        for (const key in routes) {
            if (routes.hasOwnProperty(key)) {
                const entry = routes[key];
                // console.log("testing", entry)
                const res = entry.spec.test(window.location.pathname);
                if (res) {
                    // console.log("found route", res)
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
        registerAcceptor,
        registerAction,
        registerField,
        registerRouteAction,
        registerView,
    };
    window.onpopstate = function (evt) {
        applyRouteFunction(modelProps);
    };
    setupFn(F);
    return {
        fretsApp: F,
        mountTo: (id) => {
            projector.merge(document.getElementById(id), stateRenderer);
        },
        stateRenderer,
    };
}
exports.setup = setup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBa0Y7QUFHbEYsNkNBQStCO0FBK0UvQixTQUFnQixLQUFLLENBQ25CLFVBQWEsRUFBRSxPQUF5QyxFQUFFLElBQW9CO0lBRTlFLE1BQU0sU0FBUyxHQUFHLDBCQUFlLEVBQUUsQ0FBQztJQUVwQyxNQUFNLE9BQU8sR0FFVCxFQUFHLENBQUM7SUFFUixNQUFNLE1BQU0sR0FLUixFQUFFLENBQUM7SUFFUCxNQUFNLHNCQUFzQixHQUV4QixFQUFFLENBQUM7SUFFUDs7Ozs7T0FLRztJQUNILFNBQVMsWUFBWSxDQUFDLEdBQVcsRUFBRSxJQUFXO1FBQzVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRDs7Ozs7T0FLRztJQUNILFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBRSxJQUFXO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEVBQUU7WUFDTCxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDZDtJQUNILENBQUM7SUFDRDs7O09BR0c7SUFDSCxTQUFTLFNBQVMsQ0FBQyxJQUFZO1FBQzdCLElBQUk7WUFDRixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDakM7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