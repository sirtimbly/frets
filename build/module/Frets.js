import { createProjector } from "maquette";
import Path from "path-parser";
export function setup(modelProps, setupFn, opts) {
    const projector = createProjector();
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
            console.log("no route found", key);
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
        console.log("nav to path - pushState", path);
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
        console.log("register route", key, path);
        routes[key] = {
            calculator: actionFn,
            spec: new Path(path),
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
        console.log("routes:", routes);
        for (const key in routes) {
            if (routes.hasOwnProperty(key)) {
                const entry = routes[key];
                console.log("testing", entry);
                const res = entry.spec.test(window.location.pathname);
                if (res) {
                    console.log("found route", res);
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
        registerAcceptor,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFvQixlQUFlLEVBQXVCLE1BQU0sVUFBVSxDQUFDO0FBR2xGLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQztBQStFL0IsTUFBTSxVQUFVLEtBQUssQ0FDbkIsVUFBYSxFQUFFLE9BQXlDLEVBQUUsSUFBb0I7SUFFOUUsTUFBTSxTQUFTLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFFcEMsTUFBTSxPQUFPLEdBRVQsRUFBRyxDQUFDO0lBRVIsTUFBTSxNQUFNLEdBS1IsRUFBRSxDQUFDO0lBRVAsTUFBTSxzQkFBc0IsR0FFeEIsRUFBRSxDQUFDO0lBRVA7Ozs7O09BS0c7SUFDSCxTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQUUsSUFBVztRQUM1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDbEMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRDs7Ozs7T0FLRztJQUNILFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBRSxJQUFXO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEVBQUU7WUFDTCxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDZDtJQUNILENBQUM7SUFDRDs7O09BR0c7SUFDSCxTQUFTLFNBQVMsQ0FBQyxJQUFZO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFD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