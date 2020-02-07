export declare class PropsWithFields {
    constructor(data?: any);
    registeredFieldsValues: {
        [key: string]: any;
    };
    registeredFieldsState: {
        [key: string]: {
            dirty: boolean;
        };
    };
    registeredFieldValidationErrors: {
        [key: string]: string[];
    };
}
