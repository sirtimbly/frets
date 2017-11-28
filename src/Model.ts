/**
 * A Model is a class that holds the data object for an application as well as
 * a presenter class function which is used to call the state update method
 *
 * @export
 * @class Model
 * @template T the class that defines the shape of the data
 */
export class Model<T> {
    public props: T;
    public presenter: (props: T) => any;
    public validator: (props: T, oldProps?: T) => T;

    constructor(presenter: (props: T) => any, validationMethod: (props: T, oldProps?: T) => T) {
        this.presenter = presenter;
        this.validator = validationMethod;
    }

    public present = (newProps: T): any => {
        newProps = this.validator(newProps, this.props);
        this.props = newProps;
        this.presenter(newProps);
    }

}
