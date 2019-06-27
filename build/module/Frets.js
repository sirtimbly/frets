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
            // tslint:disable-next-line:no-console
            console.log("Nav to path", path);
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
            spec: new Path(path),
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
                // tslint:disable-next-line:no-console
                console.log("Looking for Route", key, res);
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
        // state(modelProps);
    };
    return {
        fretsApp: F,
        mountTo: (id) => {
            projector.merge(document.getElementById(id), stateRenderer);
        },
        stateRenderer,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFvQixlQUFlLEVBQXVCLE1BQU0sVUFBVSxDQUFDO0FBR2xGLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQztBQTZEL0IsTUFBTSxVQUFVLEtBQUssQ0FDbkIsVUFBYSxFQUFFLE9BQXlDLEVBQUUsSUFBb0I7SUFFOUUsTUFBTSxTQUFTLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFFcEMsTUFBTSxPQUFPLEdBRVQsRUFBRyxDQUFDO0lBRVIsTUFBTSxNQUFNLEdBS1IsRUFBRSxDQUFDO0lBRVAsTUFBTSxzQkFBc0IsR0FFeEIsRUFBRSxDQUFDO0lBRVA7Ozs7O09BS0c7SUFDSCxTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQUUsSUFBVztRQUM1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDSCxTQUFTLFVBQVUsQ0FBQyxHQUFXLEVBQUUsSUFBVztRQUMxQyxNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxFQUFFO1lBQ0wsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2Q7SUFDSCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsU0FBUyxTQUFTLENBQUMsSUFBWTtRQUM3QixJQUFJO1lBQ0Ysc0NBQXNDO1lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFD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