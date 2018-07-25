import { CalculationCache, createProjector, h, Projector, VNode } from "maquette";
// import IFretsComponent from './IFretsComponent';
import * as maquette from "maquette";
import { ActionsWithFields } from "./ActionsFieldRegistry";
import { PropsWithFields } from "./PropsFieldRegistry";

export interface IRegisteredField<T> {
  handler: (evt: Event) => void | boolean;
  validationErrors: string[];
  value: T;
}

/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
export class FRETS<T extends PropsWithFields, U extends ActionsWithFields> {
  /**
   * @param  {(e:Event,data:T)=>T} actionFn A function which will be called in an event handler and is expected
   *  to change the state in some way.
   */
  public registerAction: (actionFn: (e: Event, data: T) => T) => (e: Event) => any;

  private projector: Projector;
  // private componentRegistry = new Map<string, IFretsComponent>();
  private cache: CalculationCache<T>;
  private cachedNode: VNode = h("div#default");
  private rootId: string;
  private allowAsyncRender: boolean = true;

  /**
   * @param  {T} modelProps A required initial instance of the application Props(Model)
   * @param  {U} actions A required instance of an actions class (which will be registered later with registerAction)
   */
  constructor(public modelProps: T, public actions: U) {
    const context = this;
    this.projector = createProjector();
    this.cache = maquette.createCache<T>();
    this.registerAction = this.makeActionStately( function stateUpdater(props: T): void {
      context.render(props);
    }, this.modelProps);
  }

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
  public registerViewAsync = async (renderFn: (props: T, actions: U) => Promise<VNode>) => {
    this.stateRenderer = () => {
      // console.log("Async state render function executing. allow async render: " + this.allowAsyncRender);
      if (this.allowAsyncRender) {
        renderFn(this.modelProps, this.actions).then((n: VNode) => {
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
  public render = (props: T) => {
    // console.log("Render: checking the cache");
    this.cache.result([props], () => {
      props = this.validator(props, this.modelProps);
      props = this.calculator(props, this.modelProps);
      this.modelProps = props; // the one and only place where state gets mutated!
      // console.log("Render: props have changed. ", JSON.stringify(this.modelProps));
      this.projector.scheduleRender();
      return props;
    });
  }

  /**
   * Mount the application to the DOM.
   * @param  {string} id The id of the dom element to replace
   */
  public mountTo = (id: string) => {
      this.projector.merge(document.getElementById(id), this.stateRenderer);
  }

  /**
   * Returns a function that accepts an action function, Wraps the action with our necessary hooks, and returns a
   * funtion compatible with the standard Maquette event handler signature
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
        let newData = actionFn(e, data);
        newData = this.validator(newData, this.modelProps);
        newData = this.calculator(newData, this.modelProps);
        presenterFn(newData);
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

  public getField<S>(key: string): IRegisteredField<S> {
    return {
      handler: this.actions.registeredFieldActions[key],
      validationErrors: this.modelProps.registeredFieldValidationErrors[key],
      value: this.modelProps.registeredFieldsValues[key],
    };
  }

  // public registerComponent = (name: string, cmp: IFretsComponent) => {
  //   this.componentRegistry.set(name, cmp);
  //   const definedActions = Object.getOwnPropertyNames(cmp.actions);
  //   definedActions.map((x: string) => {
  //     this.registerAction(cmp.actions[x]);
  //   });
  // }

  // the following methods should be overwritten by the Dev during setup, but its ok to work with these defaults

  /**
   * Check for any properties that are invalid or out of bounds and either reset them or add validation/warning messages
   *  somewhere on the props for display. Please make this function idempotent.
   * @param  {T} newProps
   * @param  {T} oldProps
   */
  public validator: (newProps: T, oldProps: T) => T = (p, o) => p;

  /**
   * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
   * Please make this function idempotent.
   * @param  {T} newProps
   * @param  {T} oldProps
   */
  public calculator: (newProps: T, oldProps: T) => T = (p, o) => p;
}
