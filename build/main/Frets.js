"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maquette_1 = require("maquette");
// Import * as maquette from 'maquette';
const path_parser_1 = require("path-parser");
function setup(modelProps, setupFn, opts) {
    var _a;
    const projector = ((_a = opts) === null || _a === void 0 ? void 0 : _a.projector) || maquette_1.createProjector();
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
                // Console.log('--> sending proposal', proposal);
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
            spec: new path_parser_1.Path(path)
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
    function resolveState(props) {
        if (!stateGraph.entry) {
            throw new Error('Cannot resolve current state.');
        }
        function validEdge(edges) {
            // Console.log('checking all guards', props);
            return edges.find(x => {
                // Console.log('guard', x.guard(props));
                return x.guard(props);
            });
        }
        const nestedEdges = (s) => {
            // Console.log('eval node', s.name);
            if (s.edges && s.edges.length !== 0) {
                const v = validEdge(s.edges);
                // Console.log('found valid edge', v);
                if (v) {
                    return nestedEdges(v);
                }
            }
            return s;
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
        registerField(key, initialValue, validation) {
            const handler = (evt, skipValidation) => {
                let val;
                if (typeof evt === typeof InputEvent) {
                    val = evt.data;
                }
                else {
                    val = evt.target.value;
                }
                this.modelProps.registeredFieldsValues[key] = val;
                if (val.length > 0) {
                    this.modelProps.registeredFieldsState[key].dirty = true; // Latching switch
                }
                if (!skipValidation) {
                    validate();
                }
                // Console.log('field event handler finished', this.modelProps);
            };
            const validate = () => {
                const v = this.modelProps.registeredFieldsState[key].validation;
                if (v) {
                    // Console.log('validating', v);
                    const val = this.modelProps.registeredFieldsValues[key];
                    const errors = [];
                    if (v.notEmpty && (!val || val === '')) {
                        errors.push(v.notEmpty.message);
                    }
                    if (v.minLength && val.length < v.minLength.value) {
                        errors.push(v.minLength.message);
                    }
                    if (v.maxLength && val.length > v.maxLength.value) {
                        errors.push(v.maxLength.message);
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
                isDirty: () => this.modelProps.registeredFieldsState[key].dirty,
                isValid: () => !(this.modelProps.registeredFieldValidationErrors[key].length > 0),
                key,
                validate,
                validationErrors: this.modelProps.registeredFieldValidationErrors[key],
                value: this.modelProps.registeredFieldsValues[key]
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
                var _a;
                this.modelProps = Object.assign(Object.assign({}, this.modelProps), newProps);
                if ((_a = stateGraph) === null || _a === void 0 ? void 0 : _a.entry) {
                    this.currentStateNode = resolveState(this.modelProps);
                }
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
exports.setup = setup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBMkQ7QUFDM0Qsd0NBQXdDO0FBRXhDLDZDQUFpQztBQTJHakMsU0FBZ0IsS0FBSyxDQUNwQixVQUFhLEVBQ2IsT0FBeUMsRUFDekMsSUFBb0I7O0lBRXBCLE1BQU0sU0FBUyxHQUFHLE9BQUEsSUFBSSwwQ0FBRSxTQUFTLEtBQUksMEJBQWUsRUFBRSxDQUFDO0lBRXZELE1BQU0sT0FBTyxHQUVULEVBQUUsQ0FBQztJQUVQLE1BQU0sTUFBTSxHQUtSLEVBQUUsQ0FBQztJQUVQLE1BQU0sc0JBQXNCLEdBRXhCLEVBQUUsQ0FBQztJQUVQLE1BQU0sVUFBVSxHQUE0QixFQUFFLENBQUM7SUFFL0MsSUFBSSxnQkFBMkMsQ0FBQztJQUNoRDs7Ozs7T0FLRztJQUNILFNBQVMsWUFBWSxDQUFDLEdBQVcsRUFBRSxJQUFVO1FBQzVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDNUIsT0FBTyxLQUFLLENBQUM7U0FDYjtRQUVELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBRSxJQUFVO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEVBQUU7WUFDTixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDYjtJQUNGLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLFNBQVMsQ0FBQyxJQUFZO1FBQzlCLElBQUk7WUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxF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