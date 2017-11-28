"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A Model is a class that holds the data object for an application as well as
 * a presenter class function which is used to call the state update method
 *
 * @export
 * @class Model
 * @template T the class that defines the shape of the data
 */
var Model = (function () {
    function Model(presenter, validationMethod) {
        var _this = this;
        this.present = function (newProps) {
            newProps = _this.validator(newProps, _this.props);
            _this.props = newProps;
            _this.presenter(newProps);
        };
        this.presenter = presenter;
        this.validator = validationMethod;
    }
    return Model;
}());
exports.Model = Model;
//# sourceMappingURL=Model.js.map