import { createProjector } from 'maquette';
import { Path } from 'path-parser';
/**
 * Creates a Frets application, it takes initial modelProps for your data model, and a function to be called when first run
 * @param  {T} modelProps
 * @param  {(fretsApp:FunFrets<T>)=>void} setupFn
 * @param  {SetupOptions} options?
 * @returns Mountable
 */
export function setup(modelProps, setupFn, options) {
    const projector = (options === null || options === void 0 ? void 0 : options.projector) || createProjector();
    const actions = {};
    const routes = {};
    const registeredFieldActions = {};
    const stateGraph = {};
    let currentStateNode;
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
    function resolveState(props) {
        if (!stateGraph.entry) {
            throw new Error('Cannot resolve current state.');
        }
        function validEdge(edges) {
            if (!edges)
                return undefined;
            return edges.find((x) => {
                return x.guard(props);
            });
        }
        const nestedEdges = (s) => {
            return (s && nestedEdges(validEdge(s.edges))) || s;
        };
        return nestedEdges(stateGraph.entry);
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
                const result = entry.spec.test(window.location.pathname);
                if (result) {
                    // Console.log("found route", res)
                    entry.calculator({ key, path: entry.spec.path, data: result }, modelPresenter);
                }
            }
        }
    }
    let stateRenderer;
    const fretsInstance = {
        getRouteLink,
        modelProps,
        navToPath,
        navToRoute,
        present: modelPresenter,
        projector,
        registerAcceptor,
        registerAction,
        registerField(key, initialValue, validation) {
            const handler = (evt, skipValidation) => {
                const value = typeof evt === typeof InputEvent
                    ? evt.data
                    : evt.target.value;
                this.modelProps.registeredFieldsValues[key] = value;
                if (value.length > 0) {
                    this.modelProps.registeredFieldsState[key].dirty = true; // Latching switch
                }
                if (!skipValidation) {
                    validate();
                }
            };
            const validate = () => {
                const { validation } = fretsInstance.modelProps.registeredFieldsState[key];
                if (validation) {
                    const value = fretsInstance.modelProps.registeredFieldsValues[key];
                    const errors = [];
                    if (validation.notEmpty && (!value || value === '')) {
                        errors.push(validation.notEmpty.message);
                    }
                    if (typeof value === 'string' &&
                        validation.minLength &&
                        value.length < validation.minLength.value) {
                        errors.push(validation.minLength.message);
                    }
                    if (typeof value === 'string' &&
                        validation.maxLength &&
                        value.length > validation.maxLength.value) {
                        errors.push(validation.maxLength.message);
                    }
                    this.modelProps.registeredFieldValidationErrors[key] = errors;
                }
            };
            if (this.modelProps.registeredFieldsValues[key] === undefined) {
                this.modelProps.registeredFieldsValues[key] = initialValue || '';
                this.modelProps.registeredFieldValidationErrors[key] = [];
                this.modelProps.registeredFieldsState[key] = { dirty: false };
                if (validation) {
                    this.modelProps.registeredFieldsState[key].validation = validation;
                }
            }
            if (registeredFieldActions[key] === undefined) {
                registeredFieldActions[key] = handler;
            }
            return {
                clear: () => {
                    this.modelProps.registeredFieldsValues[key] = initialValue || '';
                    this.modelProps.registeredFieldValidationErrors[key] = [];
                },
                handler,
                isDirty: () => fretsInstance.modelProps.registeredFieldsState[key].dirty,
                isValid: () => this.modelProps.registeredFieldValidationErrors[key].length === 0,
                key,
                validate,
                validationErrors: fretsInstance.modelProps.registeredFieldValidationErrors[key],
                value: fretsInstance.modelProps.registeredFieldsValues[key],
            };
        },
        registerRouteAction,
        registerStateGraph(entryState) {
            stateGraph.entry = entryState;
            this.currentStateNode = resolveState(modelProps);
        },
        currentStateNode,
        registerView(renderFn) {
            stateRenderer = () => {
                return renderFn(this);
            };
            state = (newProps) => {
                fretsInstance.modelProps = Object.assign(Object.assign({}, fretsInstance.modelProps), newProps);
                if (stateGraph === null || stateGraph === void 0 ? void 0 : stateGraph.entry) {
                    this.currentStateNode = resolveState(this.modelProps);
                }
                projector.scheduleRender();
            };
        },
    };
    window.addEventListener('popstate', () => {
        applyRouteFunction();
    });
    setupFn(fretsInstance);
    return {
        fretsApp: fretsInstance,
        mountTo(id) {
            // eslint-disable-next-line unicorn/prefer-query-selector
            projector.replace(document.getElementById(id), stateRenderer);
        },
        present: modelPresenter,
        stateRenderer,
    };
}
//# sourceMappingURL=Frets.js.map