
import { create as createMicrostate } from "microstates";
import deepFreeze from "./Freeze";
class Microstate<T> {

  constructor(public microstate: any) {}

  public get state(): Readonly<T> {
    return this.microstate.state as Readonly<T>;
  }

  public set(v: T): Microstate<T> {
    // this.externalProps = deepFreeze(v);
    return this.microstate.set(v);
  }
}

class BooleanMicrostate extends Microstate<boolean> {
  constructor(public microstate: any) {
    super(microstate);
  }

  public toggle(): Microstate<boolean> {
    return this.set(!this.microstate.state);
  }
}

interface IMicroState<T> {
  state: any;
  set: (v: any) => any;
}

type StateValue<T> = T extends string ? Microstate<string> :
                     T extends number ? Microstate<number> :
                     T extends boolean ? Microstate<boolean> :
                     T extends object ? Microstate<object> :
                     T extends T[] ? Microstate<T[]> : Microstate<any>;

type T0 = StateValue<string>;

type CreateType<T> = T extends {new (...args: any[]): infer R} ? Microstate<R> : any;

const stateFactory = function create<T>(classRef: { new (...args: any[]): T; }, initial: {}): StateValue<T> {
  const instance = createMicrostate(classRef, initial);

  if (typeof classRef === "boolean") {
    // return new BooleanMicrostate(instance);
  }

  return new Microstate<T>(instance);
}
