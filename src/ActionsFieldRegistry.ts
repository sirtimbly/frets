export class ActionsWithFields {
  public registeredFieldActions: {
    [key: string]: (evt: Event) => void | boolean;
  } = {};
}
