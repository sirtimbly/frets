import test from "ava";
import { ActionsWithFields, IFretsProps, IFunFrets, PropsWithFields, setup } from "frets";
import { h, VNode } from "maquette";
import { createTestProjector } from "maquette-query";

enum SimpleScreens {
  Start,
  End,
  Home,
  About,
}

class SimpleProps extends PropsWithFields implements IFretsProps<SimpleScreens>  {
  public messages: string[] = [];
  public screens: SimpleScreens[];
  public activeScreen: SimpleScreens;
  public checkValue: number = 0;
}

type main = IFunFrets<SimpleProps>;

test("FRETS initializes with simple types", (t) => {
   const app = setup<SimpleProps>(new SimpleProps(), (f: main) => {
      t.truthy(f.modelProps);
      t.truthy(f.modelProps.messages);
   });
   t.truthy(app.mountTo);
});

// test("renders default div", (t) => {

// });

test("actions change state", (t) => {
  const app = setup<SimpleProps>(new SimpleProps(), (f) => {
    f.registerModel((proposal, state) => {
      if (proposal.messages) {
        f.modelProps.messages = proposal.messages;
      }
      state(f.modelProps);
    });
    const changeState = f.registerAction("changeState", (e: Event, present) => {
      present({ messages: ["test"] });
    });
    f.registerView((fretsApp: main): VNode => {
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
  const mainApp = setup<SimpleProps>(new SimpleProps(), (f) => {
    f.registerModel((proposal, state) => {
      if (proposal.checkValue < 0) {
        f.modelProps.messages = ["Invalid"];
      }
      state(f.modelProps);
    });

    const setOne = f.registerAction("setOne", (e: Event, propose) => {
      propose({ checkValue: 1});
    });
    const setNegOne = f.registerAction("setNegOne", (e: Event, propose) => {
      propose({ checkValue: -1});
    });

    f.registerView((app: main): VNode => {
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
