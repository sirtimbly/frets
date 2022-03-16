import { Path } from 'path-parser';
import { Projector, VNode } from 'maquette';
import { PropsWithFields, ValidationConfiguration } from './props-field-registry';
export declare type HandlerFn = (evt: Event, skipValidation?: boolean) => void;
export interface RegisteredField {
    handler: HandlerFn;
    validate: () => void;
    validationErrors: string[];
    isValid: () => boolean;
    isDirty: () => boolean;
    value: string;
    clear: () => void;
    key: string;
}
export declare type RouteRegistry<T> = Record<string, {
    calculator: (routeName: string, routeParameters: any, props: Readonly<T>) => T;
    spec: Path;
}>;
export declare type RouteActionFn<T extends PropsWithFields> = (context: {
    key: string;
    path: string;
    data: any;
}, present: Present<T>) => void;
export declare type ActionsObject<V extends PropsWithFields> = Record<string, ActionFn<V>>;
export declare type Present<T extends PropsWithFields> = (proposal: Partial<T>) => void;
export declare type ActionEventHandler = (event: Event) => void;
export declare type ActionFn<T extends PropsWithFields> = (event: Event, present: Present<T>) => void;
export declare type ModelPresenter<T extends PropsWithFields> = (proposal: Partial<T>, state: (props: Partial<T>) => void) => void;
export declare type RegisterFieldFn = (key: string, defaultValue?: string, validation?: ValidationConfiguration) => RegisteredField;
/**
 * Primary controlling object for registering your app logic and interacting with routing.
 * This is returned by the `setup()` function
 */
export interface FunFrets<T extends PropsWithFields> {
    modelProps: T;
    present: (proposal: Partial<T>) => void;
    projector: Projector;
    registerView: (renderFn: (app: FunFrets<T>) => VNode) => void;
    registerField: RegisterFieldFn;
    registerAction: (key: string, actionFn: ActionFn<T>) => ActionEventHandler;
    registerRouteAction: (key: string, path: string, actionFn: RouteActionFn<T>) => void;
    registerAcceptor: (presenterFn: ModelPresenter<T>) => void;
    registerStateGraph: (entryState: StateNode<T>) => void;
    currentStateNode: StateNode<T>;
    getRouteLink: (key: string, data?: any) => string | false;
    navToRoute: (key: string, data?: any) => void;
    navToPath: (key: string, data?: any) => void;
}
export interface Mountable<T extends PropsWithFields> {
    fretsApp: FunFrets<T>;
    mountTo: (id: string) => void;
    stateRenderer: () => VNode;
    present: (proposal: Partial<T>) => void;
}
export interface SetupOptions {
    projector: Projector;
}
export interface StateNode<T extends PropsWithFields> {
    name: string;
    guard?: (modelProps: T) => boolean;
    edges?: Array<StateNode<T>>;
    renderer: (app: FunFrets<T>) => VNode;
}
