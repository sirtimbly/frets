import { IValidationObject } from './Frets';
export declare class PropsWithFields {
    registeredFieldsValues: {
        [key: string]: any;
    };
    registeredFieldsState: {
        [key: string]: {
            dirty: boolean;
            validation: IValidationObject;
        };
    };
    registeredFieldValidationErrors: {
        [key: string]: string[];
    };
    constructor(data?: any);
}
