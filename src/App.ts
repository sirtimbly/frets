import * as maquette from "maquette";
// import {cssTransitions} from "maquette/dist/css-transitions";
import {
    AppConfiguration,
    AppState,
    ComponentMap,
    IActions,
    IViewCollection,
    Model,
} from "./index";

/**
 * App Class Will set up everything you need and then allow you to initialize the dom
 *
 * @export
 * @class App
 * @template T A Properties Model Type
 * @template U A View Components Class Type
 */
export class App<T, U extends IViewCollection<T>> {

    public state: AppState<T>;
    public actions: IActions<T>;
    public model: Model<T>;
    public projector: maquette.Projector;
    public views?: U;
    public viewModels?: any;

    /**
     * Creates an instance of App.
     *
     */
    constructor(config: AppConfiguration<T, U>, initialData: T, components?: ComponentMap[]) {
        this.projector = maquette.createProjector();
        this.state = new AppState<T>(() => this.projector.scheduleRender(), config.state.calculate);
        this.model = new Model<T>(this.state.render, config.model.validate);
        this.model.props = config.state.calculate(initialData);
        this.actions = config.action(this.model);
        this.views = config.state.views(this.actions);
        if (components) {
           this.init(components);
        }
    }

    public updateFunction = () => { this.projector.scheduleRender(); };

    /**
     * Init your app in the dom.
     * Calling this Function  actually replaces dom nodes in the page with maquette render functions
     *
     * @param {ComponentMap[]} components
     */
    public init = (components: ComponentMap[]) => {
        components.forEach((item) => {
            this.projector.replace(item.el, () => item.comp(this.model.props, this.views));
        });
    }
}
