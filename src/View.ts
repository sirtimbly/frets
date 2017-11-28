import { IActions } from "./index";

export type IView = (model: any) => void;

export interface IViewCollection<T> {
    actions: IActions<T>;
}
