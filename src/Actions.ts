import {
    Model,
} from "./index";

export interface IActions<T> {
    model: Model<T>;
    data: T;
    renderer: (props: T) => void;
}

export class ViewActions<T> implements IActions<T> {

    public model: Model<T>;
    public deepClone: T | null;
    /**
     * New AppViewActions Class
     * @param model
     *
     */
    constructor(model: Model<T>) {
        this.model = model;
        // this.renderer = model.present;
    }

    get data(): T {
        if (!this.deepClone) {
            this.deepClone = JSON.parse(JSON.stringify(this.model.props));
        }
        return this.deepClone || {} as T;
    }

    set data(props: T) {
        this.deepClone = props;
    }

    public renderer = (props: T) => {
        // console.log("calling actions.renderer");
        this.model.present(props);
        this.deepClone = null;
    }
}
