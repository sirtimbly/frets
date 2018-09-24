const ev = Symbol('TAO.listeners');
const jn = "~";

export type taople = { t?: string | undefined, a?: string | undefined, o?: string | undefined};

export type TaoMap<T> = { [K: string]: Array<Handler<T>> }

export class Context<T extends taople> {
  constructor(public taople: T, public data?: {}) {

  }
}

export type Handler<T> = (taople: taople, data?: {}) => Context<T> | false;

export class TAO<T extends taople> {

  private validatorMap: TaoMap<T>;
  private getSignature<T extends taople>(taople: T): string {
    return (taople.t || "*") + jn + (taople.a || "*") + jn + (taople.o || "*");
  }

  // private convertSignatureToTaople(sig: string): taople {
  //   const [t, a, o] = sig.split(jn);
  //   return {
  //     t,
  //     a,
  //     o,
  //   };
  // }

  constructor() {
    this.validatorMap = {}
  }

  public propose(taople: T, data?: any) {

    const listeners = this.validatorMap[this.getSignature(taople)];
    // and now get all the handler variants with wildcards
    listeners.push(...this.validatorMap[this.getSignature({t: taople.t, a: taople.a })]);
    listeners.push(...this.validatorMap[this.getSignature({a: taople.a, o: taople.o })]);
    listeners.push(...this.validatorMap[this.getSignature({t: taople.t, o: taople.o })]);
    listeners.push(...this.validatorMap[this.getSignature({t: taople.t })]);
    listeners.push(...this.validatorMap[this.getSignature({a: taople.a })]);
    listeners.push(...this.validatorMap[this.getSignature({o: taople.o })]);
    listeners.push(...this.validatorMap[this.getSignature({})]);
    // console.log("Proposing new context, registered listeners: ", this.getSignature(taople), listeners.length);
    if (listeners && listeners.length) {
      for (let i = 0; i < listeners.length; i++) {
        const value = listeners[i](taople, data);
        if (value) {
          this.propose(value.taople, value.data);
          break;
        }
      }
    }

  }

  /** Add a context change handler */
  addHandler(
    arg: T,
    fn?: Handler<T>
  ): this | Handler<T> {
    if (typeof fn == 'function') {
      this.validatorMap[this.getSignature(arg)];
      if (this.validatorMap[this.getSignature(arg)]) {
        this.validatorMap[this.getSignature(arg)].push(fn);
        // console.log("Added handler", this.getSignature(arg));
      } else {
        this.validatorMap[this.getSignature(arg)] = [fn];
        // console.log("Added first handler", this.getSignature(arg));
      }
      return this;
    }
  }
}



export interface IDomain {
  t: string;
  a: string;
  o: string;
  taople(): taople;
  actions?: IDomain;
  orientations?: IDomain;
  readonly anyT: IDomain;
  readonly anyA: IDomain;
  readonly anyO: taople;
}

export class Domain<A extends IDomain, O extends IDomain> implements IDomain {
  public t: string;
  public a: string;
  public o: string;

  public actions: A;
  public orientations: O;

  private wildcardCount: number = 0;

  constructor (taople?: taople, public actionsInstance?: A, public orientationsInstance?: O) {
    if (taople) {
      this.t = taople.t || "*";
      this.a = taople.a || "*";
      this.o = taople.o || "*";
    }
    if (actionsInstance) {
      this.actions = actionsInstance;
    }
    if (orientationsInstance) {
      this.orientations = orientationsInstance;
    }
    if (!this.orientations || !this.actions) {
      throw "You must instantiate your domain with instances of your actions and orientations classes.";
    }
  }

  public taople(): taople {
    return {
      t: this.t,
      a: this.a,
      o: this.o,
    }
  }

  public get anyT(): IDomain {
    this.t = "*";
    return this.actions;
  }

  public get anyA(): IDomain {
    this.a = "*";
    return this.orientations;
  }

  public get anyO(): taople {
    this.o = "*";
    return this.taople();
  }

}

export function Term<T extends IDomain>(target: T, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  target.t = propertyKey;
  return { get: (): IDomain => target.actions };
}

export function Action<T extends IDomain>(target: T, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  target.a = propertyKey;
  return { get: (): IDomain => target.orientations };
}

export function Orientation<T extends IDomain>(target: T, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  target.a = propertyKey;
  return { get: (): taople => target.taople() };
}

