
export interface IState {
    preRender: (model: any) => any;
    render(model: any, nextAction?: (m: any) => any): void;
}

/**
 * AppState class is used when the model updates, examine it and determine how to update the UI
 *
 * @export
 * @class AppState
 * @template T
 */
export class AppState<T> {

    public preRender: (model: T) => T;
    public update: () => any;

    constructor(update: () => any, prerender?: (props: T) => T) {
        this.update = update;
        if (prerender) {
            this.preRender = prerender;
        }
    }

    public render = (model: T, nextAction?: (model: T) => any) => {

        if (this.preRender) {
            model = this.preRender(model);
        }
        this.update();
        if (nextAction) {
            nextAction(model);
        }
    }
}
