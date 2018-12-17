export default function simpleDeepFreeze<T>(object: T): T {
  if (object !== undefined) {
    Object.keys(object).forEach((key) => {
      if (object[key] !== undefined) {
        Object.defineProperty(object, key, {
          ...object[key],
          set: (x) => {
            throw new Error("You cannot update the internal state this way. Use an Action.");
          },
        });
        simpleDeepFreeze(object[key]);
      }
    });
  }

  return object;
}
