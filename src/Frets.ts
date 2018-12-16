import { CalculationCache, createProjector, h, Projector, VNode } from "maquette";
import * as maquette from "maquette";
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
export class FRETS<T extends PropsWithFields, U extends ActionsWithFields> {

  /**
   *  Define the concrete implementation of your actions. Your actions must be assigned to event handlers inside
   *  the VNode definitions of your UI rendering functions. Then the provided action function is executed to
   *  update some properties in state. Then the app will run data changes through the one mutations method, and
   *  then it will tell Maquette to schedule a re-rendering of the UI on the next animation frame.
   * @param  {(e:Event,data:T)=>T} actionFn A function which will be called in an event handler and is expected
   *  to change the state in some way.
   */
  public registerAction: (actionFn: (e: Event, data: T) => T) => (e: Event) => any;

  public routes: IRouteRegistry<T> = {};

  private projector: Projector;
  private cache: CalculationCache<T>;
  private cachedNode: VNode = h("div#default");
  private rootId: string;
  private allowAsyncRender: boolean = true;
  private stateIsMutated: boolean = false;

  /**
   * @param  {T} modelProps A required initial instance of the application Props(Model)
   * @param  {U} actions A required instance of an actions class
   *  (which will be registered later with registerAction `App.actions.X = App.registerAction(fn)`)
   */
  constructor(public modelProps: T, public actions: U) {
    const context = this;
    this.projector = createProjector();
    this.cache = maquette.createCache<T>();
    this.registerAction = this.makeActionStately( function stateUpdater(props: T): void {
      context.render(props, false);
    }, this.modelProps);
    window.onpopstate = function(this: Window, evt: Event) {
      // console.log("PopState handler called", this.location.href);
      context.render(context.modelProps);
    };
  }
  /**
   * The function used to render VNodes for insertion into the page DOM.
   * This method should be configured by calling FRETS.registerView(...)
   * @param  {string} id?
   */
  public stateRenderer: (id?: string) => VNode = (id: string = "default") =>
    h(`div#${id}`, ["Default FRETS: assign a render method using `.registerView()`"])

  /**
   * Sets up a render function for the app
   * @param  {(props:T,actions:U)=>VNode} renderFn
   */
  public registerView = (renderFn: (app: FRETS<T, U>) => VNode) => {
      this.stateRenderer = () => h(`div#${this.rootId}`, [renderFn(this)]);
    }
/**
 * Regisers a function that returns a promise of a VNode - this will be called and the UI
 * will be rerendered upon the resolution of that function. This allows for lazy loading
 * of UI modules that aren't needed right away.
 * @param  {(props:T,actions:U)=>Promise<VNode>} renderFn
 */
  public registerViewAsync = async (renderFn: (app: FRETS<T, U>) => Promise<VNode>) => {
    this.stateRenderer = () => {
      // console.log("Async state render function executing. allow async render: " + this.allowAsyncRender);
      if (this.allowAsyncRender) {
        renderFn(this).then((n: VNode) => {
          // at this point the lazy loading should be complete so let's invalidate the cache and render again once
          this.cache.invalidate();
          this.allowAsyncRender = false;
          // console.log("loaded view code, scheduling render with new VNode");
          this.cachedNode = n;
          this.render(this.modelProps);
        });
      }
      return h(`div#${this.rootId}`, [this.cachedNode]);
    };
  }

  /**
   * The Render function is useful for when an async promise resolves (like from a network request) - and you need
   *  to update the props and re-render the app with the new data.
   * @param  {T} props
   */
  public render = (props: T, recalculate: boolean = true) => {
    // console.log("Render: checking the cache");
    this.cache.result([JSON.stringify(props)], () => {
      // console.log("Render: props have changed. ", JSON.stringify(this.modelProps));
      if (!this.stateIsMutated || recalculate) {
        this.mutate(props);
      }
      this.projector.scheduleRender();
      this.stateIsMutated = false;
      return props;
    });
  }

  /**
   * Mount the application to the DOM.
   * @param  {string} id The id of the dom element to replace
   */
  public mountTo = (id: string) => {
    // console.log("Mount To");
    this.mutate(this.modelProps);
    this.projector.merge(document.getElementById(id), this.stateRenderer);
  }
  /**
   * Returns a path when given the key of a route that was previously registered.
   * @param  {string} key
   * @param  {any} data? A route data object
   * @returns string
   */
  public getRouteLink(key: string, data?: any): string | false {
    if (!this.routes || !this.routes[key]) {
      return false;
    }
    return this.routes[key].spec.build(data || {});
  }
  /**
   * Change the browser location to match the path configured in the route with the
   * provided key. You still need to call an action to udpate state before the UI will re-render.
   * @param  {string} key
   * @param  {any} data?
   */
  public navToRoute(key: string, data?: any) {
    const r = this.getRouteLink(key, data);
    if (r) {
      this.navToPath(r);
    }
  }
  /**
   * Update the browser location with the provided raw string path.
   * @param  {string} path
   */
  public navToPath(path: string) {
    try {
      window.history.pushState(this.modelProps, "", path);
    } catch (error) {
      window.location.pathname = path;
    }
  }

  /**
   * Returns a function that accepts an action function, Wraps the action with our necessary hooks, and returns a
   * funtion compatible with the standard Maquette event handler signature.
   * @param  {(props:T)=>void} presenterFn A reference to the main FRETS render function for this instance.
   * @param  {T} data
   */
  public makeActionStately = (presenterFn: (props: T) => void, data: T) => {
    // this function will return functions that can be used as actions in a view
    return (actionFn: (e: Event, data: T) => T) => {
      return (e: Event) => {
        // since state has probably changed lets allow async rendering once
        // console.log("event handled: action " + actionFn.name + " event.target = " + (e.target as HTMLElement).id);
        this.allowAsyncRender = true;
        const box = Object.assign({}, this.modelProps); // make a new copy of model data
        const newData = actionFn(e, box);
        this.mutate(newData);
        presenterFn(this.modelProps);
      };
    };
  }
  /**
   * Registers simple form fields on the property model, and on the actions to update it. If the field key hasn't been
   * registered yet, it initializes that value on the properties with the value passed in. This makes it so that UI
   * functions can register themselves on the props and the actions without the root app needing to know about it.
   * @param  {string} key
   * @param  {S} initialValue?
   * @returns IRegisteredField
   */
  public registerField<S>(key: string, initialValue?: S): IRegisteredField<S> {
    if (!this.modelProps.registeredFieldsValues[key]) {
      this.modelProps.registeredFieldsValues[key] = initialValue || "";
      this.modelProps.registeredFieldValidationErrors[key] = [];
    }
    if (!this.actions.registeredFieldActions[key]) {
      this.actions.registeredFieldActions[key] = this.registerAction((evt: Event, data: T) => {
        data.registeredFieldsValues[key] = (evt.target as HTMLInputElement).value;
        return data;
      });
    }

    return this.getField(key);
  }

  /**
   * Returns the field object that was previously registered with the given key.
   * Including an event handler that will update the field. Any validation errors on the field,
   * and whatever the current value is.
   * @param  {string} key
   * @returns IRegisteredField
   */
  public getField<S>(key: string): IRegisteredField<S> {
    return {
      handler: this.actions.registeredFieldActions[key],
      validationErrors: this.modelProps.registeredFieldValidationErrors[key],
      value: this.modelProps.registeredFieldsValues[key],
    };
  }
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
  public registerRoute(routeName: string, path: string, fn: (routeName: string, routeParams: any, props: T) => T) {
    this.routes[routeName] = {
      calculator: fn,
      spec: new Path(path),
    };
  }

  // the following methods should be overwritten by the Dev during setup, but its ok to work with these defaults

  /**
   * Check for any properties that are invalid or out of bounds and either reset them or add validation/warning messages
   *  somewhere on the props for display. Please make this function idempotent. Overwrite this with your own specifc
   *  implementation. It can return an updated state object containing validation error messages as well as returning
   *  false in the tuple to make mutation stop early and show errors to the user. The calculate method and route methods
   * will not be called when your validate method returns false in the second parameter of the return tuple.
   * @param  {T} newProps
   * @param  {T} oldProps
   */
  public validator: (newProps: T, oldProps: T) => [T, boolean] = (p, o) => [p, true];

  /**
   * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
   * Please make this function idempotent. Overwrite this with your own specific implementation.
   * @param  {T} newProps
   * @param  {T} oldProps
   */
  public calculator: (newProps: T, oldProps: T) => T = (p, o) => p;

  /**
   * The one and only place that this application model state is updated, first it runs the validation method,
   * then it runs any route functions, and finally runs the real state calculation method.
   * @param  {T} props
   */
  private mutate(props: T) {
    let isValid = true;
    let data = Object.assign({}, props);
    this.stateIsMutated = true;
    [data, isValid] = this.validator(data, this.modelProps);
    if (!isValid) {
      this.modelProps = data;
      return;
    }
    data = this.applyRouteFunction(data);
    data = this.calculator(data, this.modelProps);
    this.modelProps = data;
  }
  /**
   * Checks to see if any of the registerd routes are matched and then updates the app state using
   * the provided transformation function.
   * @param  {T} props
   * @returns T
   */
  private applyRouteFunction(props: T): T {
    let data = Object.assign({}, props);
    for (const key in this.routes) {
      if (this.routes.hasOwnProperty(key)) {
        const entry = this.routes[key];
        const res = entry.spec.test(window.location.pathname);
        // console.log("Looking for Route", key, res);
        if (res) {
          data = entry.calculator(key, res, data);
          return data; // only apply the first route that matches for now
        }
      }
    }
    return data; // fall through to default
  }
}
