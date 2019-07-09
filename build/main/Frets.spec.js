"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const frets_1 = require("frets");
const maquette_1 = require("maquette");
const maquette_query_1 = require("maquette-query");
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
ava_1.default("actions change state", (t) => {
    const app = frets_1.setup(new SimpleProps(), (f) => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.messages) {
                f.modelProps.messages = proposal.messages;
            }
            state(f.modelProps);
        });
        const changeState = f.registerAction("changeState", (e, present) => {
            present({ messages: ["test"] });
        });
        f.registerView((fretsApp) => {
            return maquette_1.h("div", [
                maquette_1.h("button", { onclick: changeState }, ["Load Messages"]),
                maquette_1.h("ul", fretsApp.modelProps.messages.map((x) => maquette_1.h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(app.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    const button = proj.query("button");
    t.truthy(button.exists);
    button.simulate.click();
    t.truthy(list.children.length);
    t.falsy(list.children[0].children);
    t.is(list.children[0].text, "test");
});
ava_1.default("change state but validator stops mutation", (t) => {
    const mainApp = frets_1.setup(new SimpleProps(), (f) => {
        f.registerAcceptor((proposal, state) => {
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
            return maquette_1.h("div", [
                maquette_1.h("button#valid", { onclick: setOne }, ["Set to 1"]),
                maquette_1.h("button#invalid", { onclick: setNegOne }, ["Set to -1"]),
                maquette_1.h("ul", app.modelProps.messages.map((x) => maquette_1.h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    const button1 = proj.query("button#valid");
    const button2 = proj.query("button#invalid");
    button1.simulate.click();
    t.falsy(list.children.length);
    button2.simulate.click();
    t.is(list.children[0].text, "Invalid");
});
ava_1.default("state updates async", (t) => {
    const mainApp = frets_1.setup(new SimpleProps(), (f) => {
        f.registerAcceptor((proposal, state) => {
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
            return maquette_1.h("div", [
                maquette_1.h("button", { onclick: timeoutdone }, ["Load Messages"]),
                maquette_1.h("ul", app.modelProps.messages.map((x) => maquette_1.h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    const list = proj.query("ul");
    t.falsy(list.children.length);
    proj.query("button").simulate.click();
    setTimeout(() => {
        const list2 = proj.query("ul");
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, "async");
    }, 100);
});
ava_1.default("state updates async model", (t) => {
    const mainApp = frets_1.setup(new SimpleProps(), (f) => {
        f.registerAcceptor((proposal, state) => {
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
            return maquette_1.h("div", [
                maquette_1.h("button", { onclick: timeoutdone }, ["Load Messages"]),
                maquette_1.h("ul", app.modelProps.messages.map((x) => maquette_1.h("li", [x.toString()]))),
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
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
ava_1.default("registers a field", (t) => {
    const mainApp = frets_1.setup(new SimpleProps(), (f) => {
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
ava_1.default("registers a route and changes when navigating", (t) => {
    const mainApp = frets_1.setup(new SimpleProps(), (f) => {
        f.registerAcceptor((proposal, state) => {
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
            return maquette_1.h("div", [
                (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
                    ? maquette_1.h("h1", ["Home Page"])
                    : maquette_1.h("h1", ["About Page"]),
            ]);
        });
    });
    t.is(mainApp.fretsApp.getRouteLink("about"), "/about");
    t.false(mainApp.fretsApp.getRouteLink("xyz"));
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GcmV0cy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQXVCO0FBQ3ZCLGlDQUEwRjtBQUMxRix1Q0FBb0M7QUFDcEMsbURBQXFEO0FBRXJELElBQUssYUFLSjtBQUxELFdBQUssYUFBYTtJQUNoQixtREFBSyxDQUFBO0lBQ0wsK0NBQUcsQ0FBQTtJQUNILGlEQUFJLENBQUE7SUFDSixtREFBSyxDQUFBO0FBQ1AsQ0FBQyxFQUxJLGFBQWEsS0FBYixhQUFhLFFBS2pCO0FBRUQsTUFBTSxXQUFZLFNBQVEsdUJBQWU7SUFBekM7O1FBQ1MsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUd4QixlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FBQTtBQUlELGFBQUksQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQy9DLE1BQU0sR0FBRyxHQUFHLGFBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBTyxFQUFFLEVBQUU7UUFDM0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQyxDQUFDO0lBQ0gsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUM7QUFFSCx1Q0FBdUM7QUFFdkMsTUFBTTtBQUVOLGFBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ2pDLE1BQU0sR0FBRyxHQUFHLGFBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDdEQsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxF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