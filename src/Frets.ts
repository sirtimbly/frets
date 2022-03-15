import {createProjector, VNode} from 'maquette';
import {Path} from 'path-parser';
import {
	FunFrets,
	Mountable,
	RegisteredField,
	SetupOptions,
	ActionFn,
	RouteActionFn,
	ActionEventHandler,
	StateNode,
	Present,
	ModelPresenter,
} from './Frets.types';
// Import * as maquette from 'maquette';

import {PropsWithFields, ValidationObject} from './props-field-registry';

export function setup<T extends PropsWithFields>(
	modelProps: T,
	setupFn: (fretsApp: FunFrets<T>) => void,
	options?: SetupOptions,
): Mountable<T> {
	const projector = options?.projector || createProjector();

	const actions: Record<string, ActionFn<T>> = {};

	const routes: Record<
		string,
		{
			calculator: RouteActionFn<T>;
			spec: Path;
		}
	> = {};

	const registeredFieldActions: Record<string, ActionEventHandler> = {};

	const stateGraph: {entry?: StateNode<T>} = {};

	let currentStateNode: StateNode<T> | undefined;
	/**
	 * Returns a path when given the key of a route that was previously registered.
	 * @param  {string} key
	 * @param  {any} data? A route data object
	 * @returns string
	 */
	function getRouteLink(key: string, data?: any): string | false {
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
	function navToRoute(key: string, data?: any): void {
		const r = getRouteLink(key, data);
		if (r) {
			navToPath(r);
		}
	}

	/**
	 * Update the browser location with the provided raw string path.
	 * @param  {string} path
	 */
	function navToPath(path: string): void {
		try {
			window.history.pushState(modelProps, '', path);
		} catch (error: unknown) {
			console.warn('Error routing', error);
			window.location.pathname = path;
		}

		applyRouteFunction();
	}

	const modelPresenters: Record<string, Present<T>> = {};

	function modelPresenter(proposal: Partial<T>): void {
		for (const key in modelPresenters) {
			if (Object.prototype.hasOwnProperty.call(modelPresenters, key)) {
				const accept = modelPresenters[key];
				accept(proposal);
			}
		}
	}

	let state: (props: T) => void;

	function registerAction(
		key: string,
		actionFn: ActionFn<T>,
	): ActionEventHandler {
		if (!actions[key]) {
			actions[key] = actionFn;
		}

		return (event: Event) => {
			actionFn(event, modelPresenter);
		};
	}

	function registerRouteAction(
		key: string,
		path: string,
		actionFn: RouteActionFn<T>,
	): void {
		// Console.log("register route", key, path)
		routes[key] = {
			calculator: actionFn,
			spec: new Path(path),
		};
	}

	function registerAcceptor(presenterFn: ModelPresenter<T>): void {
		const acceptorId = presenterFn.toString().slice(0, 250);
		if (!modelPresenters[acceptorId]) {
			modelPresenters[acceptorId] = (proposal: Partial<T>) => {
				presenterFn(proposal, state);
			};
		}
	}

	function resolveState(props: T): StateNode<T> {
		if (!stateGraph.entry) {
			throw new Error('Cannot resolve current state.');
		}

		function validEdge(edges: Array<StateNode<T>>): StateNode<T> | undefined {
			if (!edges) return undefined;
			return edges.find((x) => {
				return x.guard(props);
			});
		}

		const nestedEdges = (s: StateNode<T> | undefined): StateNode<T> => {
			return (s && nestedEdges(validEdge(s.edges))) || s;
		};

		return nestedEdges(stateGraph.entry);
	}

	/**
	 * Checks to see if any of the registered routes are matched and then updates the app state using
	 * the provided transformation function.
	 */
	function applyRouteFunction(): void {
		// Console.log("routes:", routes)
		for (const key in routes) {
			if (Object.prototype.hasOwnProperty.call(routes, key)) {
				const entry = routes[key];
				// Console.log("testing", entry)
				const result = entry.spec.test(window.location.pathname);
				if (result) {
					// Console.log("found route", res)
					entry.calculator(
						{key, path: entry.spec.path, data: result},
						modelPresenter,
					);
				}
			}
		}
	}

	let stateRenderer: () => VNode;

	const fretsInstance: FunFrets<T> = {
		getRouteLink,
		modelProps,
		navToPath,
		navToRoute,
		present: modelPresenter,
		projector,
		registerAcceptor,
		registerAction,
		registerField(
			key: string,
			initialValue?: string,
			validation?: ValidationObject,
		): RegisteredField {
			const handler = (
				evt: InputEvent | Event,
				skipValidation?: boolean,
			): void => {
				const value: string | any[] =
					typeof evt === typeof InputEvent
						? (evt as InputEvent).data
						: (evt.target as HTMLInputElement).value;

				this.modelProps.registeredFieldsValues[key] = value;

				if (value.length > 0) {
					this.modelProps.registeredFieldsState[key].dirty = true; // Latching switch
				}

				if (!skipValidation) {
					validate();
				}
			};

			const validate = (): void => {
				const {validation} =
					fretsInstance.modelProps.registeredFieldsState[key];
				if (validation) {
					const value = fretsInstance.modelProps.registeredFieldsValues[key];
					const errors: string[] = [];
					if (validation.notEmpty && (!value || value === '')) {
						errors.push(validation.notEmpty.message);
					}

					if (
						typeof value === 'string' &&
						validation.minLength &&
						value.length < validation.minLength.value
					) {
						errors.push(validation.minLength.message);
					}

					if (
						typeof value === 'string' &&
						validation.maxLength &&
						value.length > validation.maxLength.value
					) {
						errors.push(validation.maxLength.message);
					}

					this.modelProps.registeredFieldValidationErrors[key] = errors;
				}
			};

			if (this.modelProps.registeredFieldsValues[key] === undefined) {
				this.modelProps.registeredFieldsValues[key] = initialValue || '';
				this.modelProps.registeredFieldValidationErrors[key] = [];
				this.modelProps.registeredFieldsState[key] = {dirty: false};
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
				isDirty: () =>
					fretsInstance.modelProps.registeredFieldsState[key].dirty,
				isValid: () =>
					this.modelProps.registeredFieldValidationErrors[key].length === 0,
				key,
				validate,
				validationErrors:
					fretsInstance.modelProps.registeredFieldValidationErrors[key],
				value: fretsInstance.modelProps.registeredFieldsValues[key],
			};
		},
		registerRouteAction,
		registerStateGraph(entryState: StateNode<T>): void {
			stateGraph.entry = entryState;

			this.currentStateNode = resolveState(modelProps);
		},
		currentStateNode,
		registerView(renderFn: (fretsApp: FunFrets<T>) => VNode) {
			stateRenderer = () => {
				return renderFn(this);
			};

			state = (newProps: Partial<T>): void => {
				fretsInstance.modelProps = {
					...fretsInstance.modelProps,
					...newProps,
				};
				if (stateGraph?.entry) {
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
		mountTo(id: string) {
			// eslint-disable-next-line unicorn/prefer-query-selector
			projector.replace(document.getElementById(id), stateRenderer);
		},
		present: modelPresenter,
		stateRenderer,
	};
}
