import { Projector, VNode } from 'maquette';
import { Path } from 'path-parser';
import { PropsWithFields } from './props-field-registry';
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
declare type ActionFn<T> = (e: Event, data: Readonly<T>) => Partial<T>;
declare type RouteActionFn<T extends PropsWithFields> = (context: {
    key: string;
    path: string;
    data: any;
}, present: IPresent<T>) => void;
export interface IActionsObj<V> {
    [k: string]: ActionFn<V>;
}
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
export declare type IPresent<T extends PropsWithFields> = (proposal: Partial<T>) => void;
export declare type IActionEventHandler = (event: Event) => void;
export declare type IActionFn<T extends PropsWithFields> = (event: Event, present: IPresent<T>) => void;
export declare type IModelPresenter<T extends PropsWithFields> = (proposal: Partial<T>, state: (props: Partial<T>) => void) => void;
export declare type IRegisterFieldFn = <U>(key: string, defaultValue: U, validation?: IValidationObject) => IRegisteredField<U>;
export interface IFunFrets<T extends PropsWithFields> {
    modelProps: T;
    present: (proposal: Partial<T>) => void;
    projector: Projector;
    registerView: (renderFn: (app: IFunFrets<T>) => VNode) => void;
    registerField: IRegisterFieldFn;
    registerAction: (key: string, actionFn: IActionFn<T>) => IActionEventHandler;
    registerRouteAction: (key: string, path: string, actionFn: RouteActionFn<T>) => void;
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
export declare function setup<T extends PropsWithFields>(modelProps: T, setupFn: (fretsApp: IFunFrets<T>) => void, opts?: ISetupOptions): IMountable<T>;
export {};
