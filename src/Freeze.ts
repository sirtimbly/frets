// copied from https://github.com/remix/simple-deep-freeze

export default function deepFreeze<T>(object: T): T {

  if (Object.isFrozen(object)) {
    return object;
  }

  Object.freeze(object);
  // tslint:disable-next-line:only-arrow-functions
  Object.getOwnPropertyNames(object).forEach(function(prop) {
    if (object.hasOwnProperty(prop)
    && object[prop] !== null
    && (typeof object[prop] === "object" || typeof object[prop] === "function")
    && !Object.isFrozen(object[prop])) {
      deepFreeze(object[prop]);
    }
  });

  return object;
}
