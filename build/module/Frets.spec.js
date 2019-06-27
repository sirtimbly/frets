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
test("registers a route and changes when navigating", (t) => {
    const mainApp = setup(new SimpleProps(), (f) => {
        f.registerModel((proposal, state) => {
            if (proposal.activeScreen) {
                // tslint:disable-next-line:no-console
                console.log("setting active screen to", proposal.activeScreen);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GcmV0cy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBSSxNQUFNLEtBQUssQ0FBQztBQUN2QixPQUFPLEVBQTZDLGVBQWUsRUFBRSxLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDMUYsT0FBTyxFQUFFLENBQUMsRUFBUyxNQUFNLFVBQVUsQ0FBQztBQUNwQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyRCxJQUFLLGFBS0o7QUFMRCxXQUFLLGFBQWE7SUFDaEIsbURBQUssQ0FBQTtJQUNMLCtDQUFHLENBQUE7SUFDSCxpREFBSSxDQUFBO0lBQ0osbURBQUssQ0FBQTtBQUNQLENBQUMsRUFMSSxhQUFhLEtBQWIsYUFBYSxRQUtqQjtBQUVELE1BQU0sV0FBWSxTQUFRLGVBQWU7SUFBekM7O1FBQ1MsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUd4QixlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FBQTtBQUlELElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQy9DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBTyxFQUFFLEVBQUU7UUFDM0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQyxDQUFDO0lBQ0gsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUM7QUFFSCx1Q0FBdUM7QUFFdkMsTUFBTTtBQUVOLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ2pDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDdEQsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNsQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3JCLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7YUFDM0M7WUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDeEUsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLFFBQWMsRUFBUyxFQUFFO1lBQ3ZDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRTtnQkFDZCxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3hELENBQUMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzFFLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDcEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNwQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUV0QyxDQUFDLENBQUMsQ0FBQztBQUVILElBQUksQ0FBQywyQ0FBMkMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ3RELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDMUQsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNsQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFO2dCQUMzQixDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3JDO1lBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBUSxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzlELE9BQU8sQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDcEUsT0FBTyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFTLEVBQVMsRUFBRTtZQUNsQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2QsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDMUQsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckUsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sSUFBSSxHQUFHLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN4RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM3QyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QixPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3pCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUM7QUFFSCx1Q0FBdUM7QUFDdkMsNkZBQTZGO0FBQzdGLHVHQUF1RztBQUN2Ryx5QkFBeUI7QUFDekIsbUJBQW1CO0FBQ25CLG1CQUFtQjtBQUNuQiwrQkFBK0I7QUFDL0IsWUFBWTtBQUNaLGNBQWM7QUFDZCxtQkFBbUI7QUFDbkIsUUFBUTtBQUNSLDJDQUEyQztBQUMzQyx3QkFBd0I7QUFDeEIsOEVBQThFO0FBQzlFLDhFQUE4RTtBQUM5RSxVQUFVO0FBQ1YsUUFBUTtBQUVSLHVEQUF1RDtBQUN2RCxtQ0FBbUM7QUFDbkMsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQyx1QkFBdUI7QUFDdkIsc0NBQXNDO0FBQ3RDLHVDQUF1QztBQUN2Qyw2Q0FBNkM7QUFDN0MsYUFBYTtBQUNiLE1BQU07QUFFTixxQ0FBcUM7QUFDckMsNkZBQTZGO0FBQzdGLGtDQUFrQztBQUNsQyw0REFBNEQ7QUFDNUQsc0NBQXNDO0FBQ3RDLDRCQUE0QjtBQUM1QixNQUFNO0FBRU4saURBQWlEO0FBQ2pELDZGQUE2RjtBQUM3RixrQ0FBa0M7QUFDbEMsNERBQTREO0FBRTVELDJDQUEyQztBQUMzQywwQ0FBMEM7QUFDMUMsd0JBQXdCO0FBQ3hCLDhFQUE4RTtBQUM5RSxnR0FBZ0c7QUFDaEcsd0NBQXdDO0FBQ3hDLFVBQVU7QUFDVixRQUFRO0FBQ1IsdURBQXVEO0FBQ3ZELHVDQUF1QztBQUN2Qyw0QkFBNEI7QUFDNUIsMENBQTBDO0FBQzFDLGdEQUFnRDtBQUNoRCxzQ0FBc0M7QUFDdEMsa0RBQWtEO0FBQ2xELE1BQU07QUFFTix1Q0FBdUM7QUFDdkMsNkZBQTZGO0FBQzdGLGtFQUFrRTtBQUNsRSx1REFBdUQ7QUFDdkQscUZBQXFGO0FBQ3JGLDJCQUEyQjtBQUMzQiw2QkFBNkI7QUFDN0Isa0ZBQWtGO0FBQ2xGLGVBQWU7QUFDZixnQkFBZ0I7QUFDaEIsVUFBVTtBQUNWLE1BQU07QUFFTiw0Q0FBNEM7QUFDNUMsdURBQXVEO0FBQ3ZELG1DQUFtQztBQUNuQywyQkFBMkI7QUFDM0IsTUFBTTtBQUVOLElBQUksQ0FBQywrQ0FBK0MsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQzFELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBYyxJQUFJLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDMUQsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNsQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEVBQUU7Z0JBQ3pCLHNDQUFzQztnQkFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQy9ELENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7Z0JBQ2xELEtBQUssQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDckI7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzFELE9BQU8sQ0FBQztnQkFDTixZQUFZLEVBQUUsYUFBYSxDQUFDLElBQUk7YUFDakMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUM1RCxPQUFPLENBQUM7Z0JBQ04sWUFBWSxFQUFFLGFBQWEsQ0FBQyxLQUFLO2FBQ2xDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsRUFBUyxFQUFFO1lBQzVCLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRTtnQkFDZCxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEtBQUssYUFBYSxDQUFDLElBQUksQ0FBQztvQkFDbEYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUM1QixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN2RCxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDOUMsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDaEQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDckMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDakQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDbEQsQ0FBQyxDQUFDLENBQUM7QUFFSCxxRUFBcUU7QUFDckUsNkZBQTZGO0FBQzdGLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsMkRBQTJEO0FBRTNELHdCQUF3QjtBQUN4Qiw2RkFBNkY7QUFDN0YsbUNBQW1DO0FBQ25DLHFDQUFxQztBQUNyQywyRUFBMkU7QUFDM0UsVUFBVTtBQUNWLFFBQVE7QUFDUiw0Q0FBNEM7QUFDNUMsdURBQXVEO0FBQ3ZELHNDQUFzQztBQUN0Qyw0QkFBNEI7QUFDNUIsNENBQTRDO0FBQzVDLE1BQU0ifQ==