"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ViewActions = (function () {
    /**
     * New AppViewActions Class
     * @param model
     *
     */
    function ViewActions(model) {
        var _this = this;
        this.renderer = function (props) {
            // console.log("calling actions.renderer");
            _this.model.present(props);
            _this.deepClone = null;
        };
        this.model = model;
        // this.renderer = model.present;
    }
    Object.defineProperty(ViewActions.prototype, "data", {
        get: function () {
            if (!this.deepClone) {
                this.deepClone = JSON.parse(JSON.stringify(this.model.props));
            }
            return this.deepClone || {};
        },
        set: function (props) {
            this.deepClone = props;
        },
        enumerable: true,
        configurable: true
    });
    return ViewActions;
}());
exports.ViewActions = ViewActions;
//# sourceMappingURL=Actions.js.map