/**
 * ComponentMap allows you to prepare a list of dom elements and the render functions that will replace them
 *
 * @export
 * @class ComponentMap
 */
export class ComponentMap {
    public comp: (model: any, views: any) => any;
    public el: HTMLElement;
}
