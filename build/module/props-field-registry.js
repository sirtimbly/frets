export class PropsWithFields {
    constructor(data) {
        this.registeredFieldsValues = {};
        this.registeredFieldsState = {};
        this.registeredFieldValidationErrors = {};
        Object.assign(this, data);
    }
}
//# sourceMappingURL=props-field-registry.js.map