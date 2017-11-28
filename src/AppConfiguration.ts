import { IActions, ViewActions } from "./Actions";

import { Model } from "./Model";
import { IViewCollection } from "./View";

export class AppConfiguration<T, U extends IViewCollection<T>> {
    public state: {
        calculate: (props: T) => T;
        views: (a: IActions<T>) => U;
    };
    public action: (m: Model<T>) => ViewActions<T>;
    public model: {
        validate: (props: T, oldProps?: T) => T;
    };
}
