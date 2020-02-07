import { createProjector } from "maquette";
import Path from "path-parser";
export function setup(modelProps, setupFn, opts) {
    const projector = opts && opts.projector || createProjector();
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
                const accept = modelPresenters[key];
                accept(proposal);
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
            spec: new Path(path),
        };
    }
    function registerAcceptor(presenterFn) {
        const acceptorId = presenterFn.toString().slice(0, 250);
        if (!modelPresenters[acceptorId]) {
            modelPresenters[acceptorId] = (proposal) => {
                presenterFn(proposal, state);
            };
        }
    }
    // function registerView(renderFn: (fretsApp: IFunFrets<T>) => VNode) {
    //   stateRenderer = () => {
    //     console.log("calling renderView fn", F)
    //     return renderFn(F);
    //   }
    //   state = (newProps: Partial<T>) => {
    //     console.log('updating state inside frets', newProps)
    //     modelProps = {
    //       ...modelProps,
    //       ...newProps
    //     }
    //     projector.scheduleRender();
    //   };
    // }
    function registerField(key, initialValue, validation) {
        function handler(evt, skipValidation) {
            let val;
            if (typeof evt === typeof InputEvent) {
                val = evt.data;
            }
            else {
                val = evt.target.value;
            }
            modelProps.registeredFieldsValues[key] = val;
            if (val.length > 0) {
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
        present: modelPresenter,
        projector,
        registerAcceptor,
        registerAction,
        registerField,
        registerRouteAction,
        registerView: function (renderFn) {
            const fretsContext = this;
            stateRenderer = () => {
                console.log("calling renderView fn", fretsContext);
                return renderFn(fretsContext);
            };
            state = function (newProps) {
                console.log('updating state inside frets', newProps);
                fretsContext.modelProps = Object.assign(Object.assign({}, modelProps), newProps);
                projector.scheduleRender();
            };
        },
    };
    window.onpopstate = function (evt) {
        applyRouteFunction(modelProps);
    };
    setupFn(F);
    return {
        fretsApp: F,
        mountTo: (id) => {
            projector.replace(document.getElementById(id), stateRenderer);
        },
        present: modelPresenter,
        stateRenderer,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFvQixlQUFlLEVBQXVCLE1BQU0sVUFBVSxDQUFDO0FBR2xGLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQztBQWtGL0IsTUFBTSxVQUFVLEtBQUssQ0FDbkIsVUFBYSxFQUFFLE9BQXlDLEVBQUUsSUFBb0I7SUFHOUUsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7SUFFOUQsTUFBTSxPQUFPLEdBRVQsRUFBRSxDQUFDO0lBRVAsTUFBTSxNQUFNLEdBS1IsRUFBRSxDQUFDO0lBRVAsTUFBTSxzQkFBc0IsR0FFeEIsRUFBRSxDQUFDO0lBRVA7Ozs7O09BS0c7SUFDSCxTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQUUsSUFBVTtRQUMzQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDSCxTQUFTLFVBQVUsQ0FBQyxHQUFXLEVBQUUsSUFBVTtRQUN6QyxNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxFQUFFO1lBQ0wsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2Q7SUFDSCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsU0FBUyxTQUFTLENBQUMsSUFBWTtRQUM3QixJQUFJO1lBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FB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