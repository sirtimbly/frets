import { VNode } from "maquette";
import Path from "path-parser";
import { ActionsWithFields } from "./ActionsFieldRegistry";
import { PropsWithFields } from "./PropsFieldRegistry";
export interface IRegisteredField<T> {
    handler: (evt: Event) => void | boolean;
    validationErrors: string[];
    value: T;
}
export interface IRouteRegistry<T> {
    [key: string]: {
        calculator: (routeName: string, routeParams: any, props: T) => T;
        spec: Path;
    };
}
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
export declare class FRETS<T extends PropsWithFields, U extends ActionsWithFields> {
    modelProps: T;
    actions: U;
    /**
     *  Define the concrete implementation of your actions. Your actions must be assigned to event handlers inside
     *  the VNode definitions of your UI rendering functions. Then the provided action function is executed to
     *  update some properties in state. Then the app will run data changes through the one mutations method, and
     *  then it will tell Maquette to schedule a re-rendering of the UI on the next animation frame.
     * @param  {(e:Event,data:T)=>T} actionFn A function which will be called in an event handler and is expected
     *  to change the state in some way.
     */
    registerAction: (actionFn: (e: Event, data: T) => T) => (e: Event) => any;
    routes: IRouteRegistry<T>;
    private projector;
    private cache;
    private cachedNode;
    private rootId;
    private allowAsyncRender;
    private stateIsMutated;
    /**
     * @param  {T} modelProps A required initial instance of the application Props(Model)
     * @param  {U} actions A required instance of an actions class
     *  (which will be registered later with registerAction `App.actions.X = App.registerAction(fn)`)
     */
    constructor(modelProps: T, actions: U);
    /**
     * The function used to render VNodes for insertion into the page DOM.
     * This method should be configured by calling FRETS.registerView(...)
     * @param  {string} id?
     */
    stateRenderer: (id?: string) => VNode;
    /**
     * Sets up a render function for the app
     * @param  {(props:T,actions:U)=>VNode} renderFn
     */
    registerView: (renderFn: (app: FRETS<T, U>) => VNode) => void;
    /**
     * Regisers a function that returns a promise of a VNode - this will be called and the UI
     * will be rerendered upon the resolution of that function. This allows for lazy loading
     * of UI modules that aren't needed right away.
     * @param  {(props:T,actions:U)=>Promise<VNode>} renderFn
     */
    registerViewAsync: (renderFn: (props: T, actions: U) => Promise<VNode>) => Promise<void>;
    /**
     * The Render function is useful for when an async promise resolves (like from a network request) - and you need
     *  to update the props and re-render the app with the new data.
     * @param  {T} props
     */
    render: (props: T, recalculate?: boolean) => void;
    /**
     * Mount the application to the DOM.
     * @param  {string} id The id of the dom element to replace
     */
    mountTo: (id: string) => void;
    /**
     * Returns a path when given the key of a route that was previously registered.
     * @param  {string} key
     * @param  {any} data? A route data object
     * @returns string
     */
    getRouteLink(key: string, data?: any): string | false;
    /**
     * Change the browser location to match the path configured in the route with the
     * provided key. You still need to call an action to udpate state before the UI will re-render.
     * @param  {string} key
     * @param  {any} data?
     */
    navToRoute(key: string, data?: any): void;
    /**
     * Update the browser location with the provided raw string path.
     * @param  {string} path
     */
    navToPath(path: string): void;
    /**
     * Returns a function that accepts an action function, Wraps the action with our necessary hooks, and returns a
     * funtion compatible with the standard Maquette event handler signature.
     * @param  {(props:T)=>void} presenterFn A reference to the main FRETS render function for this instance.
     * @param  {T} data
     */
    makeActionStately: (presenterFn: (props: T) => void, data: T) => (actionFn: (e: Event, data: T) => T) => (e: Event) => void;
    /**
     * Registers simple form fields on the property model, and on the actions to update it. If the field key hasn't been
     * registered yet, it initializes that value on the properties with the value passed in. This makes it so that UI
     * functions can register themselves on the props and the actions without the root app needing to know about it.
     * @param  {string} key
     * @param  {S} initialValue?
     * @returns IRegisteredField
     */
    registerField<S>(key: string, initialValue?: S): IRegisteredField<S>;
    /**
     * Returns the field object that was previously registered with the given key.
     * Including an event handler that will update the field. Any validation errors on the field,
     * and whatever the current value is.
     * @param  {string} key
     * @returns IRegisteredField
     */
    getField<S>(key: string): IRegisteredField<S>;
    /**
     * Register a new route that will execute the given function whenever the provided path
     *  is matched during the model mutation step. This function should update the app state
     * properties to reflect the status that is indicated by the given route. The keys are useful for
     * navigation methods that need to refer to a route programmatically later.
     * (see path-parser documentation at https://github.com/troch/path-parser).
     * @param  {string} routeName
     * @param  {string} path
     * @param  {(routeName:string,routeParams:any,props:T)=>T} fn
     */
    registerRoute(routeName: string, path: string, fn: (routeName: string, routeParams: any, props: T) => T): void;
    /**
     * Check for any properties that are invalid or out of bounds and either reset them or add validation/warning messages
     *  somewhere on the props for display. Please make this function idempotent. Overwrite this with your own specifc
     *  implementation. It can return an updated state object containing validation error messages as well as returning
     *  false in the tuple to make mutation stop early and show errors to the user. The calculate method and route methods
     * will not be called when your validate method returns false in the second parameter of the return tuple.
     * @param  {T} newProps
     * @param  {T} oldProps
     */
    validator: (newProps: T, oldProps: T) => [T, boolean];
    /**
     * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
     * Please make this function idempotent. Overwrite this with your own specific implementation.
     * @param  {T} newProps
     * @param  {T} oldProps
     */
    calculator: (newProps: T, oldProps: T) => T;
    /**
     * The one and only place that this application model state is updated, first it runs the validation method,
     * then it runs any route functions, and finally runs the real state calculation method.
     * @param  {T} props
     */
    private mutate;
    /**
     * Checks to see if any of the registerd routes are matched and then updates the app state using
     * the provided transformation function.
     * @param  {T} props
     * @returns T
     */
    private applyRouteFunction;
}
