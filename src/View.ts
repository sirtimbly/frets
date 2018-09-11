import { IActions } from "frets";

export type IView = (model: any) => void;

export interface IViewCollection<T> {
    actions: IActions<T>;
}
