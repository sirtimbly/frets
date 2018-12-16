import test from "ava";
import { ActionsWithFields, FRETS, IFretsProps, PropsWithFields } from "frets";
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

type main = FRETS<SimpleProps, SimpleActions>;

// tslint:disable-next-line:max-classes-per-file
class SimpleActions extends ActionsWithFields {
  public changeState: (e: Event) => boolean;
  public setValid: (e: Event) => boolean;
  public setInvalid: (e: Event) => boolean;
}

test("FRETS initializes with simple types", (t) => {
   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
   t.truthy(F.render);
});

test("renders default div", (t) => {
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  const proj = createTestProjector(F.stateRenderer);
  t.true(proj.query("div#default").exists());
});

test("actions change state", (t) => {
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  F.actions.changeState = F.registerAction((e: Event, props: SimpleProps) => {
    props.messages = ["test"];
    return props;
  });
  F.registerView((app: main): VNode => {
    return h("div", [
      h("button", { onclick: app.actions.changeState }, ["Load Messages"]),
      h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
    ]);
  });
  const proj = createTestProjector(F.stateRenderer);
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
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  F.validator = (newProps: SimpleProps, oldProps: SimpleProps): [SimpleProps, boolean] => {
    if (newProps.checkValue < 0) {
      return [{...newProps, messages: ["Invalid"]}, false];
    }
    return [newProps, true];
  };
  F.actions.setValid = F.registerAction((e: Event, props: SimpleProps) => {
    props.checkValue = 1;
    return props;
  });
  F.actions.setInvalid = F.registerAction((e: Event, props: SimpleProps) => {
    props.checkValue = -1;
    return props;
  });
  F.registerView((app: main): VNode => {
    return h("div", [
      h("button#valid", { onclick: app.actions.setValid }, ["Set to 1"]),
      h("button#invalid", { onclick: app.actions.setInvalid }, ["Set to -1"]),
      h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
    ]);
  });
  const proj = createTestProjector(F.stateRenderer);
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
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());

  F.registerView((app: main): VNode => {
    setTimeout(() => {
      const p = Object.assign({}, app.modelProps);
      p.messages = ["async"];
      F.render(p);
      const proj2 = createTestProjector(F.stateRenderer);
      const list2 = proj2.query("ul");
      t.truthy(list2.children.length);
      t.is(list2.children[0].text, "async");
    }, 50);
    return h("div", [
      h("button", { onclick: app.actions.changeState }, ["Load Messages"]),
      h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
    ]);
  });

  const proj = createTestProjector(F.stateRenderer);
  const list = proj.query("ul");
  t.falsy(list.children.length);
});

test("registers a field", (t) => {
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  F.registerField("test", "0");
  t.is(F.modelProps.registeredFieldsValues["test"], "0");
  const field = F.getField("test");
  t.is(field.value, "0");
});

test("registers and updates a field", (t) => {
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  F.registerField("test", "0");
  t.is(F.modelProps.registeredFieldsValues["test"], "0");

  F.registerView((app: main): VNode => {
    const field = app.getField("test");
    return h("div", [
      h("button", { onclick: app.actions.changeState }, ["Load Messages"]),
      h("input", {type: "text", onchange: field.handler, value: field.value.toString()}, []),
      h("div.output", [field.value]),
    ]);
  });
  const proj = createTestProjector(F.stateRenderer);
  const input = proj.query("input");
  t.truthy(input.exists);
  input.simulate.change({ value: "2"});
  t.truthy(F.getField("test").value === "2");
  proj.initialize(F.stateRenderer);
  t.is(proj.query(".output").textContent, "2");
});

test("register view async", (t) => {
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  async function asyncViewFunction(app: main): Promise<VNode> {
    return new Promise<VNode>((resolve, reject) => {
      // simulate view rendering code being loaded async like from a webpack chunk
      setTimeout(() => {
        resolve(h("div", [
          h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
        ]));
      }, 50);
    });
  }

  F.registerViewAsync(asyncViewFunction);
  const proj = createTestProjector(F.stateRenderer);
  const list = proj.query("ul");
  t.truthy(list.exists);
});

test("registers a route and changes when navigating", (t) => {
  const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
  F.registerView((app): VNode => {
    return h("div", [
      (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
        ? h("h1", ["Home Page"])
        : h("h1", ["About Page"]),
    ]);
  });
  F.registerRoute("home", "/home", (name, params, props): SimpleProps => {
    return {
      ...props,
      activeScreen: SimpleScreens.Home,
    };
  });
  F.registerRoute("about", "/about", (name, params, props): SimpleProps => {
    return {
      ...props,
      activeScreen: SimpleScreens.About,
    };
  });
  t.is(F.getRouteLink("about"), "/about");
  t.false(F.getRouteLink("xyz"));
  const proj = createTestProjector(F.stateRenderer);
  t.is(proj.query("h1").textContent, "Home Page");
  F.navToPath("/about");
  window.dispatchEvent(new Event("popstate"));
  t.is(proj.query("h1").textContent, "About Page");
  F.navToRoute("home");
  window.dispatchEvent(new Event("popstate"));
  t.is(proj.query("h1").textContent, "Home Page");
});
