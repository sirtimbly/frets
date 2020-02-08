import { createProjector } from 'maquette';
// Import * as maquette from 'maquette';
import { Path } from 'path-parser';
export function setup(modelProps, setupFn, opts) {
    var _a;
    const projector = ((_a = opts) === null || _a === void 0 ? void 0 : _a.projector) || createProjector();
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
     * provided key. You still need to call an action to update state before the UI will re-render.
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
            window.history.pushState(modelProps, '', path);
        }
        catch (error) {
            console.warn('Error routing', error);
            window.location.pathname = path;
        }
        applyRouteFunction();
    }
    const modelPresenters = {};
    function modelPresenter(proposal) {
        for (const key in modelPresenters) {
            if (Object.prototype.hasOwnProperty.call(modelPresenters, key)) {
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
        // Console.log("register route", key, path)
        routes[key] = {
            calculator: actionFn,
            spec: new Path(path)
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
    // Function registerView(renderFn: (fretsApp: IFunFrets<T>) => VNode) {
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
                modelProps.registeredFieldsState[key].dirty = true; // Latching switch
            }
            if (!skipValidation) {
                validate();
            }
        }
        function validate() {
            if (validation) {
                const val = modelProps.registeredFieldsValues[key];
                const errors = [];
                if (validation.notEmpty && (!val || val === '')) {
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
            modelProps.registeredFieldsValues[key] = initialValue || '';
            modelProps.registeredFieldValidationErrors[key] = [];
            modelProps.registeredFieldsState[key] = { dirty: false };
        }
        if (registeredFieldActions[key] === undefined) {
            registeredFieldActions[key] = handler;
        }
        return {
            clear: () => {
                modelProps.registeredFieldsValues[key] = initialValue || '';
                modelProps.registeredFieldValidationErrors[key] = [];
            },
            handler,
            isDirty: () => modelProps.registeredFieldsState[key].dirty,
            isValid: () => !(modelProps.registeredFieldValidationErrors[key].length > 0),
            key,
            validate,
            validationErrors: modelProps.registeredFieldValidationErrors[key],
            value: modelProps.registeredFieldsValues[key]
        };
    }
    /**
     * Checks to see if any of the registered routes are matched and then updates the app state using
     * the provided transformation function.
     */
    function applyRouteFunction() {
        // Console.log("routes:", routes)
        for (const key in routes) {
            if (Object.prototype.hasOwnProperty.call(routes, key)) {
                const entry = routes[key];
                // Console.log("testing", entry)
                const res = entry.spec.test(window.location.pathname);
                if (res) {
                    // Console.log("found route", res)
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
        registerView(renderFn) {
            stateRenderer = () => {
                console.log('calling renderView fn', this);
                return renderFn(this);
            };
            state = (newProps) => {
                console.log('updating state inside frets', newProps);
                this.modelProps = Object.assign(Object.assign({}, modelProps), newProps);
                projector.scheduleRender();
            };
        }
    };
    window.onpopstate = () => {
        applyRouteFunction();
    };
    setupFn(F);
    return {
        fretsApp: F,
        mountTo: (id) => {
            // eslint-disable-next-line unicorn/prefer-query-selector
            projector.replace(document.getElementById(id), stateRenderer);
        },
        present: modelPresenter,
        stateRenderer
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLGVBQWUsRUFBbUIsTUFBTSxVQUFVLENBQUM7QUFDM0Qsd0NBQXdDO0FBRXhDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFrR2pDLE1BQU0sVUFBVSxLQUFLLENBQ3BCLFVBQWEsRUFDYixPQUF5QyxFQUN6QyxJQUFvQjs7SUFFcEIsTUFBTSxTQUFTLEdBQUcsT0FBQSxJQUFJLDBDQUFFLFNBQVMsS0FBSSxlQUFlLEVBQUUsQ0FBQztJQUV2RCxNQUFNLE9BQU8sR0FFVCxFQUFFLENBQUM7SUFFUCxNQUFNLE1BQU0sR0FLUixFQUFFLENBQUM7SUFFUCxNQUFNLHNCQUFzQixHQUV4QixFQUFFLENBQUM7SUFFUDs7Ozs7T0FLRztJQUNILFNBQVMsWUFBWSxDQUFDLEdBQVcsRUFBRSxJQUFVO1FBQzVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDNUIsT0FBTyxLQUFLLENBQUM7U0FDYjtRQUVELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBRSxJQUFVO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEVBQUU7WUFDTixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDYjtJQUNGLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLFNBQVMsQ0FBQyxJQUFZO1FBQzlCLElBQUk7WUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFB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