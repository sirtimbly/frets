import {createProjector, Projector, VNode} from 'maquette';
// Import * as maquette from 'maquette';

import {Path} from 'path-parser';
import {PropsWithFields} from './props-field-registry';

export interface IValidationObject {
	notEmpty?: {
		value: boolean;
		message: string;
	};
	minLength?: {
		value: number;
		message: string;
	};
	maxLength?: {
		value: number;
		message: string;
	};
}

export interface IRegisteredField<T> {
	handler: (evt: Event, skipValidation?: boolean) => void | boolean;
	validate: () => void;
	validationErrors: string[];
	isValid: () => boolean;
	isDirty: () => boolean;
	value: T;
	clear: () => void;
	key: string;
}

export interface IRouteRegistry<T> {
	[key: string]: {
		calculator: (routeName: string, routeParams: any, props: Readonly<T>) => T;
		spec: Path;
	};
}
type ActionFn<T> = (e: Event, data: Readonly<T>) => Partial<T>;
type RouteActionFn<T extends PropsWithFields> = (
	context: {
		key: string;
		path: string;
		data: any;
	},
	present: IPresent<T>
) => void;

export interface IActionsObj<V> {
	[k: string]: ActionFn<V>;
}
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */

export type IPresent<T extends PropsWithFields> = (
	proposal: Partial<T>
) => void;
export type IActionEventHandler = (event: Event) => void;
export type IActionFn<T extends PropsWithFields> = (
	event: Event,
	present: IPresent<T>
) => void;
export type IModelPresenter<T extends PropsWithFields> = (
	proposal: Partial<T>,
	state: (props: Partial<T>) => void
) => void;
export type IRegisterFieldFn = <U>(
	key: string,
	defaultValue: U,
	validation?: IValidationObject
) => IRegisteredField<U>;
export interface IFunFrets<T extends PropsWithFields> {
	modelProps: T;
	present: (proposal: Partial<T>) => void;
	projector: Projector;
	registerView: (renderFn: (app: IFunFrets<T>) => VNode) => void;
	registerField: IRegisterFieldFn;
	registerAction: (key: string, actionFn: IActionFn<T>) => IActionEventHandler;
	registerRouteAction: (
		key: string,
		path: string,
		actionFn: RouteActionFn<T>
	) => void;
	registerAcceptor: (presenterFn: IModelPresenter<T>) => void;
	getRouteLink: (key: string, data?: any) => string | false;
	navToRoute: (key: string, data?: any) => void;
	navToPath: (key: string, data?: any) => void;
}

export interface IMountable<T extends PropsWithFields> {
	fretsApp: IFunFrets<T>;
	mountTo: (id: string) => void;
	stateRenderer: () => VNode;
	present: (proposal: Partial<T>) => void;
}
export interface ISetupOptions {
	projector: Projector;
}

export function setup<T extends PropsWithFields>(
	modelProps: T,
	setupFn: (fretsApp: IFunFrets<T>) => void,
	opts?: ISetupOptions
): IMountable<T> {
	const projector = opts?.projector || createProjector();

	const actions: {
		[key: string]: IActionFn<T>;
	} = {};

	const routes: {
		[key: string]: {
			calculator: RouteActionFn<T>;
			spec: Path;
		};
	} = {};

	const registeredFieldActions: {
		[key: string]: IActionEventHandler;
	} = {};

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
		} catch (error) {
			console.warn('Error routing', error);
			window.location.pathname = path;
		}

		applyRouteFunction();
	}

	const modelPresenters: {[k: string]: IPresent<T>} = {};

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
		actionFn: IActionFn<T>
	): IActionEventHandler {
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
		actionFn: RouteActionFn<T>
	): void {
		// Console.log("register route", key, path)
		routes[key] = {
			calculator: actionFn,
			spec: new Path(path)
		};
	}

	function registerAcceptor(presenterFn: IModelPresenter<T>): void {
		const acceptorId = presenterFn.toString().slice(0, 250);
		if (!modelPresenters[acceptorId]) {
			modelPresenters[acceptorId] = (proposal: Partial<T>) => {
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

	function registerField<S>(
		key: string,
		initialValue: S,
		validation?: IValidationObject
	): IRegisteredField<S> {
		function handler(evt: InputEvent | Event, skipValidation?: boolean): void {
			let val;
			if (typeof evt === typeof InputEvent) {
				val = (evt as InputEvent).data;
			} else {
				val = (evt.target as HTMLInputElement).value;
			}

			modelProps.registeredFieldsValues[key] = val;
			if (val.length > 0) {
				modelProps.registeredFieldsState[key].dirty = true; // Latching switch
			}

			if (!skipValidation) {
				validate();
			}
		}

		function validate(): void {
			if (validation) {
				const val = modelProps.registeredFieldsValues[key];
				const errors: string[] = [];
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
			modelProps.registeredFieldsState[key] = {dirty: false};
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
			isValid: () =>
				!(modelProps.registeredFieldValidationErrors[key].length > 0),
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
	function applyRouteFunction(): void {
		// Console.log("routes:", routes)
		for (const key in routes) {
			if (Object.prototype.hasOwnProperty.call(routes, key)) {
				const entry = routes[key];
				// Console.log("testing", entry)
				const res = entry.spec.test(window.location.pathname);
				if (res) {
					// Console.log("found route", res)
					entry.calculator(
						{key, path: entry.spec.path, data: res},
						modelPresenter
					);
				}
			}
		}
	}

	let stateRenderer: () => VNode;

	const F: IFunFrets<T> = {
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
		registerView(renderFn: (fretsApp: IFunFrets<T>) => VNode) {
			stateRenderer = () => {
				console.log('calling renderView fn', this);
				return renderFn(this);
			};

			state = (newProps: Partial<T>): void => {
				console.log('updating state inside frets', newProps);
				this.modelProps = {
					...modelProps,
					...newProps
				};
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
		mountTo: (id: string) => {
			// eslint-disable-next-line unicorn/prefer-query-selector
			projector.replace(document.getElementById(id), stateRenderer);
		},
		present: modelPresenter,
		stateRenderer
	};
}
