import test from "ava";
import { ActionsWithFields, FRETS, IFretsProps, PropsWithFields } from "frets";
import { h, VNode } from "maquette";
import { createTestProjector } from "maquette-query";

enum SimpleScreens {
  Start,
  End,
}

class SimpleProps extends PropsWithFields implements IFretsProps<SimpleScreens>  {
  public messages: string[] = [];
  public screens: SimpleScreens[];
  public activeScreen: SimpleScreens;
}

type main = FRETS<SimpleProps, SimpleActions>;

// tslint:disable-next-line:max-classes-per-file
class SimpleActions extends ActionsWithFields {
  public changeState: (e: Event) => boolean;
}

test("FRETS initializes with simple types", (t) => {
   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
   t.truthy(F.render);
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
    }, 250);
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
