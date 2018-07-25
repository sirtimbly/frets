
export class PropsWithFields {
  public registeredFieldsValues: {
    [key: string]: string;
  } = {};

  public registeredFieldValidationErrors: {
    [key: string]: string[];
   } = {};
}
