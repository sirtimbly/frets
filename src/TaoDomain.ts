import { taople } from './tao';

export interface IDomain {
  t: string;
  a: string;
  o: string;
  actions?: IDomain;
  orientations?: IDomain;
  readonly anyT: IDomain;
  readonly anyA: IDomain;
  readonly anyO: taople;
  taople(): taople;
}

export class Domain implements IDomain {
  public t: string;
  public a: string;
  public o: string;



  private wildcardCount: number = 0;

  public proposer(t?: any, a?: any, o?: any) {
    const arg = this.taople();
    const dataPayload = {};
    dataPayload[arg.t] = t;
    dataPayload[arg.a] = a;
    dataPayload[arg.o] = o;

  }

  constructor(obj?: taople) {
    if (obj) {
      this.t = obj.t || "*";
      this.a = obj.a || "*";
      this.o = obj.o || "*";
    }

  }

  public taople(): taople {
    return {
      t: this.t,
      a: this.a,
      o: this.o,
    };
  }

  public get anyT(): IDomain {
    this.t = "*";
    return this;
  }

  public get anyA(): IDomain {
    this.a = "*";
    return this;
  }

  public get anyO(): IDomain {
    this.o = "*";
    return this;
  }

}

// export type Domain = IPrototype & BasicDomain;

export function Term() {
  return function(target: Domain, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.get = () => {
      console.log(">> updating term from the getter: ", propertyKey);
      target.t = propertyKey;
      return target;
    }
  }
}

export function Action() {
  return function(target: Domain, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.get = () => {
      console.log(">> updating action  from the getter: ", propertyKey);
      target.a = propertyKey;
      return target;
    }
  }
}

export function Orientation(){
  return function(target: Domain, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.get = () => {
      console.log(">> updating orientation from the getter: ", propertyKey);
      target.o = propertyKey;
      return target;
    }
  }
}

export interface TaoConfig {
  terms: string[],
  actions: string[],
  orientations: string[],
}

export function TaoClass(config: TaoConfig) {
  return function(target: Domain) {
    // save a reference to the original constructor
    var original = target;

    // a utility function to generate instances of a class
    function construct(constructor, args) {
      var c : any = function () {
        return constructor.apply(this, args);
      }
      c.prototype = constructor.prototype;
      return new c();
    }

    // the new constructor behaviour
    var f : any = function (...args) {
      console.log("Taople: " + original.taople());
      config.terms.forEach(key => {
        if (key.charAt(0) !== '*') {
          Object.defineProperty(this, key, {
            get: () => {
              console.log(">> Got: ", key)
              target.t = key;
              return target;
            }
          });
        }
      });
      return construct(original, args);
    }

    // copy prototype so intanceof operator still works
    // f.prototype = original.prototype;

    // return new constructor (will override original)
    return f;
  }
}

export interface IPrototype { prototype: any; }
