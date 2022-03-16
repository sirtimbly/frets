export interface ValidationConfiguration {
    notEmpty?: {
        value: boolean;
        message: string;
    };
    minLength?: {
        value: number;
        message: string;
    };
    maxLength?: {
        value: number;
        message: string;
    };
}
export declare class PropsWithFields {
    registeredFieldsValues: Record<string, string | undefined>;
    registeredFieldsState: Record<string, {
        dirty: boolean;
        validation: ValidationConfiguration;
    }>;
    registeredFieldValidationErrors: Record<string, string[]>;
    constructor(data?: any);
}
