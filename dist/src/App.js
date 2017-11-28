"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var maquette = require("../node_modules/maquette/src/maquette");
// import {cssTransitions} from "maquette/dist/css-transitions";
var index_1 = require("./index");
/**
 * App Class Will set up everything you need and then allow you to initialize the dom
 *
 * @export
 * @class App
 * @template T A Properties Model Type
 * @template U A View Components Class Type
 */
var App = (function () {
    /**
     * Creates an instance of App.
     *
     */
    function App(config, initialData, components) {
        var _this = this;
        this.updateFunction = function () { _this.projector.scheduleRender(); };
        /**
         * Init your app in the dom.
         * Calling this Function  actually replaces dom nodes in the page with maquette render functions
         *
         * @param {ComponentMap[]} components
         */
        this.init = function (components) {
            components.forEach(function (item) {
                _this.projector.replace(item.el, function () { return item.comp(_this.model.props, _this.views); });
            });
        };
        this.projector = maquette.createProjector();
        this.state = new index_1.AppState(function () { return _this.projector.scheduleRender(); }, config.state.calculate);
        this.model = new index_1.Model(this.state.render, config.model.validate);
        this.model.props = config.state.calculate(initialData);
        this.actions = config.action(this.model);
        this.views = config.state.views(this.actions);
        if (components) {
            this.init(components);
        }
    }
    return App;
}());
exports.App = App;
//# sourceMappingURL=App.js.map