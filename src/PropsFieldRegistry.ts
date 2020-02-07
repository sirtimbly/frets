export class PropsWithFields {
  constructor(data?: any) {
    Object.assign(this, data);
  }
  public registeredFieldsValues: {
    [key: string]: any;
  } = {};

  public registeredFieldsState: {
    [key: string]: { dirty: boolean };
  } = {};

  public registeredFieldValidationErrors: {
    [key: string]: string[];
   } = {};
}
