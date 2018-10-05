const ev = Symbol('TAO.listeners');
const jn = "~";

export type taople = { t?: string | undefined, a?: string | undefined, o?: string | undefined};

export type TaoMap<T, U> = { [K: string]: Array<Handler<T, U>> }

export class Context<T extends taople> {
  constructor(public taople: T, public data?: {}) {

  }
}

export type Handler<T, U> = (taople: taople, data?: {}, state?: U) => Context<T> | false;

export class TAO<T extends taople, U> {
  private state: U;
  private isProposalResolved: boolean = true;
  private validatorMap: TaoMap<T, U>;
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

  constructor(props?: U, private finalListenerFn?: (U) => void) {
    this.state = Object.assign({}, props);
    this.validatorMap = {}
  }

  public getState(): U {
    return this.state;
  }

  /**
   * Submit a new context state with a TAOple key and data payload to be processed by all handlers.
   * @param  {T} taople
   * @param  {any} data?
   */
  public propose(taople: T, data?: any) {

    const listeners: Handler<T, U>[] = [];
    listeners.push(...this.validatorMap[this.getSignature(taople)]);
    const {t,a,o} = taople;
    // and now get all the handler variants with wildcards
    listeners.push(...this.validatorMap[this.getSignature({t, a})]);
    listeners.push(...this.validatorMap[this.getSignature({a, o})]);
    listeners.push(...this.validatorMap[this.getSignature({t, o})]);
    listeners.push(...this.validatorMap[this.getSignature({t})]);
    listeners.push(...this.validatorMap[this.getSignature({a})]);
    listeners.push(...this.validatorMap[this.getSignature({o})]);
    listeners.push(...this.validatorMap[this.getSignature({})]);
    if (this.isProposalResolved) {
      // console.log("-- Pushing final listener function onto stack of length: " + listeners.length);
      this.isProposalResolved = false;
      const handler: Handler<T, U> = (t: taople, d: any, s: U) => {
        // console.log("*^*^- final listener from within TAO proposal:", s);
        this.finalListenerFn(s);
        this.isProposalResolved = true;
        return false;
      };
      listeners.push(handler);

    }

    // console.log("Proposing new context, registered listeners: ", this.getSignature(taople), listeners.length);
    if (listeners && listeners.length) {
      // console.log("`` starting listener stack");
      for (let i = 0; i < listeners.length; i++) {
        // console.log("-- calling TAO listener " + (i+1) + " of " + listeners.length);
        const value = listeners[i](taople, data, this.state);
        if (value) {
          this.propose(value.taople, value.data);

        }
      }
      // console.log("// ending listener stack");

    }

  }

  /** Add a context change handler */
  addHandler(
    arg: T,
    fn?: Handler<T, U>
  ): this | Handler<T, U> {
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
