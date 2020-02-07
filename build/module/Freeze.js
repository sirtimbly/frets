// copied from https://github.com/remix/simple-deep-freeze
export default function deepFreeze(object) {
    if (Object.isFrozen(object)) {
        return object;
    }
    Object.freeze(object);
    // tslint:disable-next-line:only-arrow-functions
    Object.getOwnPropertyNames(object).forEach(function (prop) {
        if (object.hasOwnProperty(prop)
            && object[prop] !== null
            && (typeof object[prop] === "object" || typeof object[prop] === "function")
            && !Object.isFrozen(object[prop])) {
            deepFreeze(object[prop]);
        }
    });
    return object;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJlZXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0ZyZWV6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwREFBMEQ7QUFFMUQsTUFBTSxDQUFDLE9BQU8sVUFBVSxVQUFVLENBQUksTUFBUztJQUU3QyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDM0IsT0FBTyxNQUFNLENBQUM7S0FDZjtJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsZ0RBQWdEO0lBQ2hELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJO1FBQ3RELElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7ZUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUk7ZUFDckIsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssVUFBVSxDQUFDO2VBQ3hFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNqQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDMUI7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMifQ==