"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * AppState class is used when the model updates, examine it and determine how to update the UI
 *
 * @export
 * @class AppState
 * @template T
 */
var AppState = (function () {
    function AppState(update, prerender) {
        var _this = this;
        this.render = function (model, nextAction) {
            if (_this.preRender) {
                model = _this.preRender(model);
            }
            _this.update();
            if (nextAction) {
                nextAction(model);
            }
        };
        this.update = update;
        if (prerender) {
            this.preRender = prerender;
        }
    }
    return AppState;
}());
exports.AppState = AppState;
//# sourceMappingURL=State.js.map