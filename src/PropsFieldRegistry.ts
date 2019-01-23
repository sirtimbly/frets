
export class PropsWithFields {

  public registeredFieldsValues: {
    [key: string]: any;
  } = {};

  public registeredFieldValidationErrors: {
    [key: string]: string[];
   } = {};

   constructor(init?: Partial<PropsWithFields>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}
