import { CalculationCache, createProjector, h, Projector, VNode } from "maquette";
import * as maquette from "maquette";

import Path from "path-parser";
import { ActionsWithFields } from "./ActionsFieldRegistry";
import deepFreeze from "./Freeze";
import { PropsWithFields } from "./PropsFieldRegistry";

export interface IRegisteredField<T> {
  handler: (evt: Event) => void | boolean;
  validationErrors: string[];
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

export interface IActionsObj<V> { [k: string]: ActionFn<V>; }
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */

export type IPresent<T extends PropsWithFields> = (proposal: Partial<T>) => void;
export type IActionEventHandler = (event: Event) => void;
export type IActionFn<T extends PropsWithFields> = (event: Event, present: IPresent<T>) => void;
export type IModelPresenter<T extends PropsWithFields> = (proposal, state: (props: T) => void) => void;

export interface IFunFrets<T extends PropsWithFields> {
  modelProps: T;
  registerView: (renderFn: (app: IFunFrets<T>) => VNode) => void;
  registerField: (key: string, defaultValue: any, validation?: {notEmpty?: boolean}) => IRegisteredField<any>;
  registerAction: (key: string, actionFn: IActionFn<T> ) => IActionEventHandler;
  registerRouteAction: (key: string, path: string, actionFn: IActionFn<T> ) => void;
  registerModel: (presenterFn: IModelPresenter<T>) => void;
}

export interface IMountable { mountTo: (id: string) => void; }
export interface ISetupOptions {
  projector: Projector;
}

export function setup<T extends PropsWithFields>(
  modelProps: T, setupFn: (fretsApp: IFunFrets<T>) => void, opts?: ISetupOptions): IMountable {

  const projector = createProjector();

  const actions: {
    [key: string]: IActionFn<T>;
  } = { };

  const routes: {
    [key: string]: {
      calculator: IActionFn<T>,
      spec: Path,
    };
  } = {};

  const registeredFieldActions: {
    [key: string]: IActionEventHandler;
  } = {};

  let modelPresenter: IPresent<T>;
  let state: (props: T) => void;
  const F: IFunFrets<T> = {
    modelProps,
    registerAction,
    registerField,
    registerModel,
    registerRouteAction,
    registerView,
  };

  function registerAction(key: string, actionFn: IActionFn<T>): IActionEventHandler {
    if (!actions[key]) {
      actions[key] = actionFn;
    }
    return (event: Event) => {
      actionFn(event, modelPresenter);
    };
  }

  function registerRouteAction(key: string, path: string, actionFn: IActionFn<T>): void {
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
      // projector.scheduleRender();
    };
  }

  function registerField<S>(key: string, initialValue?: S, validation?: { notEmpty?: boolean}): IRegisteredField<S> {
    function handler(evt: Event) {
      const val = (evt.target as HTMLInputElement).value;
      modelProps.registeredFieldsValues[key] = val;
      if (validation) {
        let errors: string[] = [];
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

  let stateRenderer: () => VNode;

  setupFn(F);
  return {
    mountTo: (id: string) => {
      projector.merge(document.getElementById(id), stateRenderer);
    },
  };
}
