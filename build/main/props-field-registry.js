"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropsWithFields = void 0;
class PropsWithFields {
    constructor(data) {
        this.registeredFieldsValues = {};
        this.registeredFieldsState = {};
        this.registeredFieldValidationErrors = {};
        Object.assign(this, data);
    }
}
exports.PropsWithFields = PropsWithFields;
//# sourceMappingURL=props-field-registry.js.map