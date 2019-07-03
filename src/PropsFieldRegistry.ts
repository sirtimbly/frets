
export class PropsWithFields {
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
