"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const frets_1 = require("frets");
var SimpleScreens;
(function (SimpleScreens) {
    SimpleScreens[SimpleScreens["Start"] = 0] = "Start";
    SimpleScreens[SimpleScreens["End"] = 1] = "End";
    SimpleScreens[SimpleScreens["Home"] = 2] = "Home";
    SimpleScreens[SimpleScreens["About"] = 3] = "About";
})(SimpleScreens || (SimpleScreens = {}));
class SimpleProps extends frets_1.PropsWithFields {
    constructor() {
        super(...arguments);
        this.messages = [];
        this.checkValue = 0;
    }
}
ava_1.default("FRETS initializes with simple types", (t) => {
    const app = frets_1.setup(new SimpleProps(), (f) => {
        t.truthy(f.modelProps);
        t.truthy(f.modelProps.messages);
    });
    t.truthy(app.mountTo);
});
// test("renders default div", (t) => {
// });
// test("actions change state", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.actions.changeState = F.registerAction((e: Event, props: Readonly<SimpleProps>) => {
//     return {...props, messages: ["test"]};
//   });
//   F.registerView((app: main): VNode => {
//     return h("div", [
//       h("button", { onclick: app.actions.changeState }, ["Load Messages"]),
//       h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
//     ]);
//   });
//   const proj = createTestProjector(F.stateRenderer);
//   const list = proj.query("ul");
//   t.falsy(list.children.length);
//   const button = proj.query("button");
//   t.truthy(button.exists);
//   button.simulate.click();
//   t.truthy(list.children.length);
//   t.falsy(list.children[0].children);
//   t.is(list.children[0].text, "test");
// });
// test("change state but validator stops mutation", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.validator = (newProps: SimpleProps, oldProps: SimpleProps): [SimpleProps, boolean] => {
//     if (newProps.checkValue < 0) {
//       return [{...newProps, messages: ["Invalid"]}, false];
//     }
//     return [newProps, true];
//   };
//   F.actions.setValid = F.registerAction((e: Event, props: SimpleProps): SimpleProps => {
//     return {...props, checkValue: 1};
//   });
//   F.actions.setInvalid = F.registerAction((e: Event, props: SimpleProps): SimpleProps => {
//     return {...props, checkValue: -1} ;
//   });
//   F.registerView((app: main): VNode => {
//     return h("div", [
//       h("button#valid", { onclick: app.actions.setValid }, ["Set to 1"]),
//       h("button#invalid", { onclick: app.actions.setInvalid }, ["Set to -1"]),
//       h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
//     ]);
//   });
//   const proj = createTestProjector(F.stateRenderer);
//   const list = proj.query("ul");
//   t.falsy(list.children.length);
//   const button1 = proj.query("button#valid");
//   const button2 = proj.query("button#invalid");
//   button1.simulate.click();
//   t.falsy(list.children.length);
//   button2.simulate.click();
//   t.is(list.children[0].text, "Invalid");
// });
// test("state updates async", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.actions.changeState = F.registerAction((e: Event, data: Readonly<SimpleProps>): SimpleProps => {
//     setTimeout(() => {
//       F.render({
//         ...data,
//         messages: ["async"],
//       });
//     }, 50);
//     return data;
//   });
//   F.registerView((app: main): VNode => {
//     return h("div", [
//       h("button", { onclick: app.actions.changeState }, ["Load Messages"]),
//       h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
//     ]);
//   });
//   const proj = createTestProjector(F.stateRenderer);
//   const list = proj.query("ul");
//   t.falsy(list.children.length);
//   proj.query("button").simulate.click();
//   setTimeout(() => {
//     const list2 = proj.query("ul");
//     t.truthy(list2.children.length);
//     t.is(list2.children[0].text, "async");
//   }, 100);
// });
// test("registers a field", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.registerField("test", "0");
//   t.is(F.modelProps.registeredFieldsValues["test"], "0");
//   const field = F.getField("test");
//   t.is(field.value, "0");
// });
// test("registers and updates a field", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.registerField("test", "0");
//   t.is(F.modelProps.registeredFieldsValues["test"], "0");
//   F.registerView((app: main): VNode => {
//     const field = app.getField("test");
//     return h("div", [
//       h("button", { onclick: app.actions.changeState }, ["Load Messages"]),
//       h("input", {type: "text", onchange: field.handler, value: field.value.toString()}, []),
//       h("div.output", [field.value]),
//     ]);
//   });
//   const proj = createTestProjector(F.stateRenderer);
//   const input = proj.query("input");
//   t.truthy(input.exists);
//   input.simulate.change({ value: "2"});
//   t.truthy(F.getField("test").value === "2");
//   proj.initialize(F.stateRenderer);
//   t.is(proj.query(".output").textContent, "2");
// });
// test("register view async", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   async function asyncViewFunction(app: main): Promise<VNode> {
//     return new Promise<VNode>((resolve, reject) => {
//       // simulate view rendering code being loaded async like from a webpack chunk
//       setTimeout(() => {
//         resolve(h("div", [
//           h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
//         ]));
//       }, 50);
//     });
//   }
//   F.registerViewAsync(asyncViewFunction);
//   const proj = createTestProjector(F.stateRenderer);
//   const list = proj.query("ul");
//   t.truthy(list.exists);
// });
// test("registers a route and changes when navigating", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.registerView((app): VNode => {
//     return h("div", [
//       (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
//         ? h("h1", ["Home Page"])
//         : h("h1", ["About Page"]),
//     ]);
//   });
//   F.registerRoute("home", "/home", (name, params, props): SimpleProps => {
//     return {
//       ...props,
//       activeScreen: SimpleScreens.Home,
//     };
//   });
//   F.registerRoute("about", "/about", (name, params, props): SimpleProps => {
//     return {
//       ...props,
//       activeScreen: SimpleScreens.About,
//     };
//   });
//   t.is(F.getRouteLink("about"), "/about");
//   t.false(F.getRouteLink("xyz"));
//   const proj = createTestProjector(F.stateRenderer);
//   t.is(proj.query("h1").textContent, "Home Page");
//   F.navToPath("/about");
//   window.dispatchEvent(new Event("popstate"));
//   t.is(proj.query("h1").textContent, "About Page");
//   F.navToRoute("home");
//   window.dispatchEvent(new Event("popstate"));
//   t.is(proj.query("h1").textContent, "Home Page");
// });
// test("model props can only be updated through an action", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.registerView((app): VNode => {
//     // try overwriting something in modelProps
//     t.throws(() => app.modelProps.messages.push("try"));
//     return h("div", [
//       (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
//         ? h("h1", ["Home Page"])
//         : h("h1", ["About Page"]),
//       h("ul", app.modelProps.messages.map((x: string) => h("li", [x]))),
//     ]);
//   });
//   t.not(F.modelProps.messages[0], "try");
//   const proj = createTestProjector(F.stateRenderer);
//   const msgs = proj.query("ul>li");
//   t.falsy(msgs.exists());
//   t.not(F.modelProps.messages[0], "try");
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GcmV0cy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQXVCO0FBQ3ZCLGlDQUEwRjtBQUkxRixJQUFLLGFBS0o7QUFMRCxXQUFLLGFBQWE7SUFDaEIsbURBQUssQ0FBQTtJQUNMLCtDQUFHLENBQUE7SUFDSCxpREFBSSxDQUFBO0lBQ0osbURBQUssQ0FBQTtBQUNQLENBQUMsRUFMSSxhQUFhLEtBQWIsYUFBYSxRQUtqQjtBQUVELE1BQU0sV0FBWSxTQUFRLHVCQUFlO0lBQXpDOztRQUNTLGFBQVEsR0FBYSxFQUFFLENBQUM7UUFHeEIsZUFBVSxHQUFXLENBQUMsQ0FBQztJQUNoQyxDQUFDO0NBQUE7QUFJRCxhQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUMvQyxNQUFNLEdBQUcsR0FBRyxhQUFLLENBQWMsSUFBSSxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQU8sRUFBRSxFQUFFO1FBQzNELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUMsQ0FBQztJQUNILENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDO0FBRUgsdUNBQXVDO0FBRXZDLE1BQU07QUFFTix3Q0FBd0M7QUFDeEMsNkZBQTZGO0FBQzdGLDJGQUEyRjtBQUMzRiw2Q0FBNkM7QUFDN0MsUUFBUTtBQUNSLDJDQUEyQztBQUMzQyx3QkFBd0I7QUFDeEIsOEVBQThFO0FBQzlFLDhFQUE4RTtBQUM5RSxVQUFVO0FBQ1YsUUFBUTtBQUNSLHVEQUF1RDtBQUN2RCxtQ0FBbUM7QUFDbkMsbUNBQW1DO0FBQ25DLHlDQUF5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