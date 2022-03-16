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
export class PropsWithFields {
	public registeredFieldsValues: Record<string, string | undefined> = {};

	public registeredFieldsState: Record<
		string,
		{dirty: boolean; validation: ValidationConfiguration}
	> = {};

	public registeredFieldValidationErrors: Record<string, string[]> = {};

	constructor(data?: any) {
		Object.assign(this, data);
	}
}
