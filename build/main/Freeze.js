"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function simpleDeepFreeze(object) {
    if (object !== undefined) {
        Object.keys(object).forEach((key) => {
            if (object[key] !== undefined) {
                Object.defineProperty(object, key, Object.assign({}, object[key], { set: (x) => {
                        throw new Error("You cannot update the internal state this way. Use an Action.");
                    } }));
                simpleDeepFreeze(object[key]);
            }
        });
    }
    return object;
}
exports.default = simpleDeepFreeze;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJlZXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0ZyZWV6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLFNBQXdCLGdCQUFnQixDQUFJLE1BQVM7SUFDbkQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxFQUFFO2dCQUM3QixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxHQUFHLG9CQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDLElBQ2QsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDO29CQUNuRixDQUFDLElBQ0QsQ0FBQztnQkFDSCxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUMvQjtRQUNILENBQUMsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBaEJELG1DQWdCQyJ9