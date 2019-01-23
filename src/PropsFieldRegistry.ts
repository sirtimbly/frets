
export class PropsWithFields {
  public registeredFieldsValues: {
    [key: string]: any;
  } = {};

  public registeredFieldValidationErrors: {
    [key: string]: string[];
   } = {};
}
