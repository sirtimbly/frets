export declare class PropsWithFields {
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
    constructor(data?: any);
}
