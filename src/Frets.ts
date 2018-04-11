import { createProjector, h, Projector, VNode } from "maquette";

export class FRETS<T, U> {

  public registerAction: (actionFn: (e: Event, data: T) => T) => (e: Event) => any;
  private projector: Projector;

  constructor(public modelProps: T, public actions: U) {
    const context = this;
    this.projector = createProjector();
    this.registerAction = this.makeActionStately( function stateUpdater(props: T): void {
      context.render(props);
    }, this.modelProps);
  }
  // these methods should be overwritten by the User, but work with these defaults
  public validator: (newProps: T, oldProps: T) => T = (p, o) => p;
  public calculator: (newProps: T, oldProps: T) => T = (p, o) => p;
  public stateRenderer: () => VNode = () =>
    h("div", ["Default FRETS: assign a render method using `.registerView()`"])

  public registerView = (renderFn: (props: T, actions: U) => VNode) => {
      this.stateRenderer = () => renderFn(this.modelProps, this.actions);
    }

  public render = (props: T) => {
    props = this.validator(props, this.modelProps);
    props = this.calculator(props, this.modelProps);
    this.modelProps = props; // the one and only place where state gets mutated!
    this.projector.scheduleRender();
  }
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
