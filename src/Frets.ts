import { createProjector, h, Projector, VNode } from "maquette";

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

  /**
   * @param  {T} modelProps A required initial instance of the application Props(Model)
   * @param  {U} actions A required instance of an actions class (which will be registered later with registerAction)
   */
  constructor(public modelProps: T, public actions: U) {
    const context = this;
    this.projector = createProjector();
    this.registerAction = this.makeActionStately( function stateUpdater(props: T): void {
      context.render(props);
    }, this.modelProps);
  }

  // these methods should be overwritten by the User, but work with these defaults

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
  public stateRenderer: () => VNode = () =>
    h("div", ["Default FRETS: assign a render method using `.registerView()`"])

  public registerView = (renderFn: (props: T, actions: U) => VNode) => {
      this.stateRenderer = () => renderFn(this.modelProps, this.actions);
    }
  /**
   * The Render function is useful for when an async promise resolves (like from a network request) - and you need
   *  to update the props and re-render the app with the new data.
   * @param  {T} props
   */
  public render = (props: T) => {
    props = this.validator(props, this.modelProps);
    props = this.calculator(props, this.modelProps);
    this.modelProps = props; // the one and only place where state gets mutated!
    this.projector.scheduleRender();
  }

  /**
   * Mount the application to the DOM.
   * @param  {string} id The id of the dom element to replace
   */
  public mountTo = (id: string) => {
      this.projector.replace(document.getElementById(id), this.stateRenderer);
  }
  public makeActionStately = (presenterFn: (props: T) => void, data: T) => {
    // this function will return functions that can be used as actions in a view
    return (actionFn: (e: Event, data: T) => T) => {
      return (e: Event) => {
        presenterFn(actionFn(e, data));
      };
    };
  }
}
