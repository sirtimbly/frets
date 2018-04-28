import { CalculationCache, createProjector, h, Projector, VNode } from "maquette";
// import IFretsComponent from './IFretsComponent';
import * as maquette from "maquette";

/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
export class FRETS<T, U> {
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
  public registerView = (renderFn: (props: T, actions: U) => VNode) => {
    this.stateRenderer = () => h(`div#${this.rootId}`, [renderFn(this.modelProps, this.actions)]);
    }
/**
 * Regisers a function that returns a promise of a VNode - this will be called and the UI
 * will be rerendered upon the resolution of that function. This allows for lazy loading
 * of UI modules that aren't needed right away.
 * @param  {(props:T,actions:U)=>Promise<VNode>} renderFn
 */
  public registerViewAsync = async (renderFn: (props: T, actions: U) => Promise<VNode>) => {
    this.stateRenderer = () => {
      // console.log("allow async render: " + this.allowAsyncRender);
      if (this.allowAsyncRender) {
        renderFn(this.modelProps, this.actions).then((n: VNode) => {
            // at this point the lazy loading should be complete so let's invalidate the cache and render again once
            this.cache.invalidate();
            this.allowAsyncRender = false;
            // console.log("loaded view code, scheduling render");
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
      // console.log("Render: props have changed");
      props = this.validator(props, this.modelProps);
      props = this.calculator(props, this.modelProps);
      this.modelProps = props; // the one and only place where state gets mutated!
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
  public makeActionStately = (presenterFn: (props: T) => void, data: T) => {
    // this function will return functions that can be used as actions in a view
    return (actionFn: (e: Event, data: T) => T) => {
      return (e: Event) => {
        // since state has probably changed lets allow async rendering once
        this.allowAsyncRender = true;
        presenterFn(actionFn(e, data));
      };
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
   *  somewhere on the props for display.
   * @param  {T} newProps
   * @param  {T} oldProps
   */
  public validator: (newProps: T, oldProps: T) => T = (p, o) => p;

  /**
   * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
   * @param  {T} newProps
   * @param  {T} oldProps
   */
  public calculator: (newProps: T, oldProps: T) => T = (p, o) => p;
}
