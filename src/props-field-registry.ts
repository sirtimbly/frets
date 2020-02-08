import {IValidationObject} from './Frets';
export class PropsWithFields {
	public registeredFieldsValues: {
		[key: string]: any;
	} = {};

	public registeredFieldsState: {
		[key: string]: {dirty: boolean; validation: IValidationObject};
	} = {};

	public registeredFieldValidationErrors: {
		[key: string]: string[];
	} = {};

	constructor(data?: any) {
		Object.assign(this, data);
	}
}
