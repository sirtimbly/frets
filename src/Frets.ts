import { CalculationCache, createProjector, h, Projector, VNode } from "maquette";
import * as maquette from "maquette";

import Path from "path-parser";
import { ActionsWithFields } from "./ActionsFieldRegistry";
import deepFreeze from "./Freeze";
import { PropsWithFields } from "./PropsFieldRegistry";

export interface IValidationObject {
  notEmpty?: {
    value: boolean,
    message: string;
  };
  minLength?: {
    value: number,
    message: string;
  };
  maxLength?: {
    value: number,
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
    key: string,
    path: string,
    data: any,
  },
  present: IPresent<T>,
) => void;

export interface IActionsObj<V> { [k: string]: ActionFn<V>; }
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */

export type IPresent<T extends PropsWithFields> = (proposal: Partial<T>) => void;
export type IActionEventHandler = (event: Event) => void;
export type IActionFn<T extends PropsWithFields> = (event: Event, present: IPresent<T>) => void;
export type IModelPresenter<T extends PropsWithFields> = (proposal: Partial<T>, state: (props: T) => void) => void;

export interface IFunFrets<T extends PropsWithFields> {
  modelProps: T;
  registerView: (renderFn: (app: IFunFrets<T>) => VNode) => void;
  registerField: (key: string, defaultValue: any, validation?: IValidationObject) => IRegisteredField<any>;
  registerAction: (key: string, actionFn: IActionFn<T> ) => IActionEventHandler;
  registerRouteAction: (key: string, path: string, actionFn: RouteActionFn<T> ) => void;
  registerModel: (presenterFn: IModelPresenter<T>) => void;
  getRouteLink: (key: string, data?: any) => string | false;
  navToRoute: (key: string, data?: any) => void;
  navToPath: (key: string, data?: any) => void;
}

export interface IMountable<T extends PropsWithFields> {
  fretsApp: IFunFrets<T>;
  mountTo: (id: string) => void;
  stateRenderer: () => VNode;
}
export interface ISetupOptions {
  projector: Projector;
}

export function setup<T extends PropsWithFields>(
  modelProps: T, setupFn: (fretsApp: IFunFrets<T>) => void, opts?: ISetupOptions): IMountable<T> {

  const projector = createProjector();

  const actions: {
    [key: string]: IActionFn<T>;
  } = { };

  const routes: {
    [key: string]: {
      calculator: RouteActionFn<T>,
      spec: Path,
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
  function getRouteLink(key: string, data ?: any): string | false {
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
  function navToRoute(key: string, data ?: any) {
    const r = getRouteLink(key, data);
    if (r) {
      navToPath(r);
    }
  }
  /**
   * Update the browser location with the provided raw string path.
   * @param  {string} path
   */
  function navToPath(path: string) {
    try {
      window.history.pushState(modelProps, "", path);
    } catch (error) {
      window.location.pathname = path;
    }
  }

  let modelPresenter: IPresent<T>;
  let state: (props: T) => void;

  function registerAction(key: string, actionFn: IActionFn<T>): IActionEventHandler {
    if (!actions[key]) {
      actions[key] = actionFn;
    }
    return (event: Event) => {
      actionFn(event, modelPresenter);
    };
  }

  function registerRouteAction(key: string, path: string, actionFn: RouteActionFn<T>): void {
    routes[key] = {
      calculator: actionFn,
      spec: new Path(path),
    };
  }

  function registerModel(presenterFn: IModelPresenter<T>) {
    modelPresenter = (proposal: Partial<T>) => {
      presenterFn(proposal, state);
    };
  }

  function registerView(renderFn: (fretsApp: IFunFrets<T>) => VNode) {
    stateRenderer = () => renderFn(F);
    state = (newProps: T) => {
      modelProps = newProps;

      projector.scheduleRender();
    };
  }

  function registerField<S>(key: string, initialValue?: S, validation?: IValidationObject): IRegisteredField<S> {
    function handler(evt: Event, skipValidation?: boolean) {
      modelProps.registeredFieldsValues[key] = (evt.target as HTMLInputElement).value;
      if ((evt.target as HTMLInputElement).value.length > 0) {
        modelProps.registeredFieldsState[key].dirty = true; // latching switch
      }
      if (!skipValidation) {
        validate();
      }
    }

    function validate() {
      if (validation) {
        const val = modelProps.registeredFieldsValues[key];
        const errors: string[] = [];
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
  function applyRouteFunction(props: Readonly<T>) {
    for (const key in routes) {
      if (routes.hasOwnProperty(key)) {
        const entry = routes[key];
        const res = entry.spec.test(window.location.pathname);
        if (res) {
          entry.calculator({ key, path: entry.spec.path, data: res}, modelPresenter);
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
    registerAction,
    registerField,
    registerModel,
    registerRouteAction,
    registerView,
  };

  setupFn(F);
  window.onpopstate = function(this: Window, evt: Event) {
    applyRouteFunction(modelProps);
  };
  return {
    fretsApp: F,
    mountTo: (id: string) => {
      projector.merge(document.getElementById(id), stateRenderer);
    },
    stateRenderer,
  };
}
