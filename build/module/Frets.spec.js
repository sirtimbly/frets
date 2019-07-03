import test from "ava";
import { PropsWithFields, setup } from "frets";
import { h } from "maquette";
import { createTestProjector } from "maquette-query";
var SimpleScreens;
(function (SimpleScreens) {
    SimpleScreens[SimpleScreens["Start"] = 0] = "Start";
    SimpleScreens[SimpleScreens["End"] = 1] = "End";
    SimpleScreens[SimpleScreens["Home"] = 2] = "Home";
    SimpleScreens[SimpleScreens["About"] = 3] = "About";
})(SimpleScreens || (SimpleScreens = {}));
class SimpleProps extends PropsWithFields {
    constructor() {
        super(...arguments);
        this.messages = [];
        this.checkValue = 0;
    }
}
test("FRETS initializes with simple types", (t) => {
    const app = setup(new SimpleProps(), (f) => {
        t.truthy(f.modelProps);
        t.truthy(f.modelProps.messages);
    });
    t.truthy(app.mountTo);
});
// test("renders default div", (t) => {
// });
test("actions change state", (t) => {
    const app = setup(new SimpleProps(), (f) => {
        f.registerModel((proposal, state) => {
            if (proposal.messages) {
                f.modelProps.messages = proposal.messages;
            }
            state(f.modelProps);
        });
        const changeState = f.registerAction("changeState", (e, present) => {
            present({ messages: ["test"] });
        });
        f.registerView((fretsApp) => {
            return h("div", [
                h("button", { onclick: changeState }, ["Load Messages"]),
                h("ul", fretsApp.modelProps.messages.map((x) => h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = createTestProjector(app.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    const button = proj.query("button");
    t.truthy(button.exists);
    button.simulate.click();
    t.truthy(list.children.length);
    t.falsy(list.children[0].children);
    t.is(list.children[0].text, "test");
});
test("change state but validator stops mutation", (t) => {
    const mainApp = setup(new SimpleProps(), (f) => {
        f.registerModel((proposal, state) => {
            if (proposal.checkValue < 0) {
                f.modelProps.messages = ["Invalid"];
            }
            state(f.modelProps);
        });
        const setOne = f.registerAction("setOne", (e, propose) => {
            propose({ checkValue: 1 });
        });
        const setNegOne = f.registerAction("setNegOne", (e, propose) => {
            propose({ checkValue: -1 });
        });
        f.registerView((app) => {
            return h("div", [
                h("button#valid", { onclick: setOne }, ["Set to 1"]),
                h("button#invalid", { onclick: setNegOne }, ["Set to -1"]),
                h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = createTestProjector(mainApp.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    const button1 = proj.query("button#valid");
    const button2 = proj.query("button#invalid");
    button1.simulate.click();
    t.falsy(list.children.length);
    button2.simulate.click();
    t.is(list.children[0].text, "Invalid");
});
test("state updates async", (t) => {
    const mainApp = setup(new SimpleProps(), (f) => {
        f.registerModel((proposal, state) => {
            state(f.modelProps);
        });
        const timeoutdone = f.registerAction("timeoutdone", (e, present) => {
            setTimeout(() => {
                present({
                    messages: ["async"],
                });
            }, 50);
        });
        f.registerView((app) => {
            return h("div", [
                h("button", { onclick: timeoutdone }, ["Load Messages"]),
                h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = createTestProjector(mainApp.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    proj.query("button").simulate.click();
    setTimeout(() => {
        const list2 = proj.query("ul");
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, "async");
    }, 100);
});
test("state updates async model", (t) => {
    const mainApp = setup(new SimpleProps(), (f) => {
        f.registerModel((proposal, state) => {
            if (proposal && proposal.messages.length) {
                f.modelProps.messages = proposal.messages;
                state(f.modelProps);
            }
            setTimeout(() => {
                f.modelProps.messages = ["done"];
                state(Object.assign({}, f.modelProps));
            }, 50);
        });
        const timeoutdone = f.registerAction("timeoutdone", (e, present) => {
            present({ messages: ["loading"] });
        });
        f.registerView((app) => {
            return h("div", [
                h("button", { onclick: timeoutdone }, ["Load Messages"]),
                h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = createTestProjector(mainApp.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    proj.query("button").simulate.click();
    t.truthy(list.children.length);
    t.is(list.children[0].text, "loading");
    setTimeout(() => {
        const list2 = proj.query("ul");
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, "done");
    }, 100);
});
test("registers a field", (t) => {
    const mainApp = setup(new SimpleProps(), (f) => {
        const field = f.registerField("test", "0");
        t.is(f.modelProps.registeredFieldsValues["test"], "0");
        t.is(field.value, "0");
    });
});
// test("registers and updates a field", (t) => {
//   const mainApp = setup<SimpleProps>(new SimpleProps(), (f) => {
//     const field = f.registerField("test", "0");
//     t.is(field.value, "0");
//     f.registerView((app: main): VNode => {
//       return h("div", [
//         h("button", ["Load Messages"]),
//         h("input", {type: "text", onchange: field.handler, value: field.value.toString()}, []),
//         h("div.output", [field.value]),
//       ]);
//     });
//   });
//   const proj = createTestProjector(mainApp.stateRenderer);
//   const input = proj.query("input");
//   t.truthy(input.exists);
//   input.simulate.change({ value: "2"});
//   proj.initialize(mainApp.stateRenderer);
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
test("registers a route and changes when navigating", (t) => {
    const mainApp = setup(new SimpleProps(), (f) => {
        f.registerModel((proposal, state) => {
            if (proposal.activeScreen) {
                f.modelProps.activeScreen = proposal.activeScreen;
                state(f.modelProps);
            }
        });
        f.registerRouteAction("home", "/home", (context, propose) => {
            propose({
                activeScreen: SimpleScreens.Home,
            });
        });
        f.registerRouteAction("about", "/about", (context, propose) => {
            propose({
                activeScreen: SimpleScreens.About,
            });
        });
        f.registerView((app) => {
            return h("div", [
                (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
                    ? h("h1", ["Home Page"])
                    : h("h1", ["About Page"]),
            ]);
        });
    });
    t.is(mainApp.fretsApp.getRouteLink("about"), "/about");
    t.false(mainApp.fretsApp.getRouteLink("xyz"));
    const proj = createTestProjector(mainApp.stateRenderer);
    t.is(proj.query("h1").textContent, "Home Page");
    mainApp.fretsApp.navToPath("/about");
    window.dispatchEvent(new Event("popstate"));
    t.is(proj.query("h1").textContent, "About Page");
    mainApp.fretsApp.navToRoute("home");
    window.dispatchEvent(new Event("popstate"));
    t.is(proj.query("h1").textContent, "Home Page");
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GcmV0cy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBSSxNQUFNLEtBQUssQ0FBQztBQUN2QixPQUFPLEVBQTZDLGVBQWUsRUFBRSxLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDMUYsT0FBTyxFQUFFLENBQUMsRUFBUyxNQUFNLFVBQVUsQ0FBQztBQUNwQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyRCxJQUFLLGFBS0o7QUFMRCxXQUFLLGFBQWE7SUFDaEIsbURBQUssQ0FBQTtJQUNMLCtDQUFHLENBQUE7SUFDSCxpREFBSSxDQUFBO0lBQ0osbURBQUssQ0FBQTtBQUNQLENBQUMsRUFMSSxhQUFhLEtBQWIsYUFBYSxRQUtqQjtBQUVELE1BQU0sV0FBWSxTQUFRLGVBQWU7SUFBekM7O1FBQ1MsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUd4QixlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FBQTtBQUlELElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQy9DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBTyxFQUFFLEVBQUU7UUFDM0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQyxDQUFDO0lBQ0gsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUM7QUFFSCx1Q0FBdUM7QUFFdkMsTUFBTTtBQUVOLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsRUFBRSxF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