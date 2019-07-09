# FRETS (Functional, Reactive, entirely TypeScript)
## An Ultralight Composable Frontend TypeScript Web Framework
<p style="text-align: center">
  <img src="https://travis-ci.org/sirtimbly/frets.svg?branch=master" alt="build:">
  <a href="https://www.npmjs.com/package/frets"><img src="https://badge.fury.io/js/frets.svg" alt="npm version" height="20"></a>
  <a href="https://david-dm.org/sirtimbly/frets">
    <img src="https://david-dm.org/sirtimbly/frets/status.svg" alt="dependencies status">
  </a>
  <a href="https://codecov.io/gh/sirtimbly/frets">
    <img src="https://codecov.io/gh/sirtimbly/frets/branch/master/graph/badge.svg" />
  </a>
  <a href="https://bundlephobia.com/result?p=frets">
    <img src="https://badgen.net/bundlephobia/minzip/frets">
  </a>
  <a href="https://packagephobia.now.sh/result?p=frets">
    <img id="" src="https://packagephobia.now.sh/badge?p=frets" alt="install size" class="">
  </a>
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Fsirtimbly%2Ffrets?ref=badge_small" alt="FOSSA Status"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsirtimbly%2Ffrets.svg?type=small"/></a>
  <a href="https://github.com/semantic-release/semantic-release"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg"></a>

</p>

![FRETS logo](http://uploads.timbendt.com.s3.amazonaws.com/dropzone/fretslogo4@1x.png)

A chainable API of programmer-friendly abstractions for building User Interfaces without HTML Templates or JSX. Enjoy the safety and productivity of TypeScript in your UI code.

## Getting Started

`npm install --save frets`

Use [the Starter Project](https://github.com/sirtimbly/frets-starter) to get going quickly.

Read the [API docs](https://sirtimbly.github.io/frets/)

The basic SAM (State Action Model) app lifecycle:
Action (event) -> Model (update) -> State (calculate) -> View (render) -> [wait for client events that call an Action()]

Note:
> I based this project on what I read on [sam.js.org](https://sam.js.org) but I modified it slightly.


## Philosophical Rules

1. Optimize for Developer Ergonomics (chainable APIs)
2. No Magic Strings
3. No Configuration Objects
4. Encourage Some Functional Programming

## Quick Setup

Create a class for your data model properties.

```ts

export class TodoListProps extends PropsWithFields {
  public name: string;
  public email: string;
  public todos: string[];
  public complete: string[];

  constructor() {
    // set some defaults or fetch some data from a server
  }

  // other data helper functions, getter, setters, etc

```

You now can run the frets `setup` function which contains all the view rendering and action handling logic. This should only be run once after page load.

```ts
import {setup} from "frets";
setup(new TodoListProps(), (f) => {
  // add model
  f.registerModel((proposal: Partial<RealWorldProps>, state) => {
		if (proposal.username !== undefined && proposal.username.length > 3) {
			F.modelProps.username = proposal.username;
		}

		if (proposal.logout === true) {
			F.modelProps.username = '';
		}

		state(F.modelProps);
	});

  // register the View rendering function
  F.registerView((app: App): VNode => {
    const usernameField = app.registerField('fieldName', app.modelProps.username, {notEmpty: {
      value: true, message: 'Cant be empty.'
    });
    const passField = app.registerField('fieldPass', '');

    const loginAction = app.registerAction('login', (evt, present) => {
      evt.preventDefault();
      present({
        username: usernameField.value
      });
      usernameField.clear();
      passField.clear();
    });

    const logoutAction = app.registerAction('logout', (evt, present) => {
      evt.preventDefault();
      present({
        logout: true
      });
    });
  );

}).mountTo("mainapp");
```

To create a render view you need a plain function that accepts as parameters an instance of the `IFunFrets<TodoListProps>` object. And it has to return a VNode (specifically a Maquette VNode).

That atomic CSS fluent dom syntax is pretty powerful - it comes from [https://gitlab.com/FRETS/frets-styles-generator](https://gitlab.com/FRETS/frets-styles-generator), but you still need to be able to specify your actions and your state calculation method.

```ts
// Register an action function (overwriting an existing property you defined on your Actions class)
F.actions.changeName = F.registerAction((e: Event, data: TodoListProps) => {
  data.name = (e.target as HTMLInputElement).value;
  // add action specific business logic here, but not validation
  // also you can add 3rd party API calls here
  return data;
});

// Register the state calculation function
F.calculator = (newProps: TodoListProps, oldProps: TodoListProps): TodoListProps => {
  // add your derived state business logic here
  return newProps
};

```

And, that's the short version. You can call `F.mountTo("some_id")` and after a build your app should be fully reactive. I recommend configuring webpack with hot-reloading. It's super helpful. There's no special webpack plugins required for FRETS development - just `tsloader` for typescript support.

## Registry: Simple Form Fields on the State

When you are creating an app in FRETS normally, for every single piece of data you have to create a property on your model class and an updater action on your actions class. This can become tedius when you are simply storing and displaying strings from a form input. To overcome this FRETS now offers a method called `registerField()` which takes a string as it's key. This adds values storage, validation storage, and updater actions to the props and actions inside the FRETS app. These are then accessible through the `getField()` method or directly on the `props.registeredFields` object. The updater action expects to receive a change event with a target of type `HTMLInputElement`. Though this approach sort of breaks "Rule 2: No Magic Strings", it greatly reduces boilerplate code and enables greater opportunities for recursive or dynamic UI generation.

So for a registered Input field the example UI render function above would look like this.

```ts

const renderRootView = (app: FRETS<TodoListProps, TodoListActions>): VNode => {
  const field = app.registerField("quick_name"); // hold onto the return object
  return $$().div.flex.flexColumn.justifyAround.h([
    $$().h2.h([`hello ${field.value}`]),
    $$().input.h({
      onchange: field.handler,
      value: field.value,
    }),
    $$().button.btn.h(["Save"]),
  ]);

```

The function takes care of inserting itself into the app and reading it's own values. Validation would still need to happen in the app methods. The addition of the string keyed registry pattern creates opportunities for an app to extend itself at run time, so that the initial state class doesn't need to know about everything up front.


## What and Why?

FRETS is a set of classes and interfaces to make it easy for you to write code that complies (mostly) with the SAM pattern. You can get all the reassurance of reliable code completion and type checking while still writing "pure" render functions. I think classes made up of functions are a perfectly valid way of giving developers the convenience of automatic code completion, and the other advantages of the Typescript tooling world. Making a developer remember all the variable names or massive copy-pasting is the enemy of clean bug-free code.

To explain the framework, Let me work backwards through the SAM application pattern starting from the UI rendering in the browser.

## Views

In SAM every piece of your UI should be a pure function that generates a new DOM tree in some way. Reusability comes from classic refactoring and composition of functions, without learning any new ceremony of a component object structure. Your view rendering code should be modular and composable, these aspects tend to emerge as the developer starts programming and sees the need to refactor continuously.

I originally was playing around with [Mithril](https://mithril.js.org/) and attempting to integrate it as a VirtualDom rendering implementation of the SAM pattern. But Mithril was not very TypeScript friendly, and a little searching revealed [Maquette](https://maquettejs.org/), a smaller and lighter TypeScript implementation of the hyperscript rendering interface that Mithril (and react) give us. It might even be more performant, depending on how you measure. It's not perfect, but it is under active development and I think the value of a solidly implemented hyperscript rendering library, decoupled from the big projects, that we can build upon is of significant value.

Why no JSX? Why no templating? ... This is an experiment, and in the past I have always been a believer in working with real HTML. I thougt staying close to the final implementation language was the smartest way proceed compared to things like ASP.Net WebForms or HAML. Every developer is familiar with HTML which is why Vue and JSX are so easy to learn, they have a declarative syntax that looks mostly just like HTML. But I wondered, can I avoid some of the pain of the syntactic restrictions of HTML? (let's be honest, it is _super_ verbose and repetetive). In the Mithril hyper script code I saw [DOM rendering functions let you specify a CSS selector string](https://mithril.js.org/hyperscript.html#css-selectors) — think of how you use the [Emmet](https://emmet.io/) tool in your IDE to generate HTML.

```js
  h("div.customHeader.someClass", [...childNodes]);
```

These methods take that selector string and an attributes object to generate an html element with all the appropriate class names, attributes, etc. I like it. It's weird but it works. Especially if you use a functional CSS library like BaseCSS or Tachyons. Read more about this in the section [Functional Rendering with TypeScript Helper Classes](#functional-rendering-with-typescript-helper-classes).

```ts
  $.div.p2.m1.border.rounded.h([..childNodes]);
```

So, you could be building a web app without writing any new HTML or CSS code. 😳 🤯

## To Boil It Down, The Job of an SPA is to Render Data in Response to Events

What data does your view function render? Well, it's just a plain old JavaScript object, or preferably a generic subset of that object if you've refactored your UI into smaller decoupled functions. Of course, since this is TypeScript our IDE will know that we've already specified the shape and types of the properties on that object, so we get code completion and type warnings everywhere we work. The development time tools like VS Code and TSLint reduce errors and make it easier to reason about your higher level code when you're deep down in the rendering functions. Ideally you will have one big parent strongly-typed class object for your entire application state making it easy to know what you're passing around and looking for. FRETS doesn't make any affordances for keeping your object immutable. That's up to you.

In FRETS there is no particular recommendation for how to organize and break up the code for your rendering functions. One function per file or many, it all works - but breaking into multiple files gives you the chance to do async chunk loading through webpack to cut down on initial payload size.

## State

State is a simple class that is responsible for calling those "View" render methods. You instantiate a new Samwise state object specifying the render function you want (with a default assumption that you're using the Maquette projector for updating the dom). This state representer function will also recieve a preRender function to do any special calculations or logic for deriving transient properties in the application state from the values of the data properties object that it is passed. Things like warning messages, loading indicators, visibility switching, and in-app navigation or routing.

## Model

The state was called by a function on your Model class called "present". Generally there is one *`Present()`* function on a model, and it is tied to the one *`Render()`* function on you State class. This present function first executes any data validation logic that the model was configured with when we gave it a *`validate()`* function at instatiation. So the Model handles consistency, and this is also where you would specify data synchronization logic for communicating with a remote API.

## Action

The Model was asked to update itself by a function on your Action class. This action class should be a new class that you wrote for this application which extends the Samwise ViewActions class. Your custom actions class will contain all the functions that your application might call to ever change data or state. These functions will have been bound to the event handlers on the dom, or timers or other reactive events. This practice makes sure you know exactly where to look for any change that was made to your application state, and you get code completion in your Views for this class because of the power of Generic Types.

## Diving back down

Let's follow the logic back down then.

Assuming we're talking about yet another Todo list implementation: when your view function renders a button you will specify it's `onclick` handler as the function `this.actions.createNewTask` which you already new about and stubbed in or wrote previously on that custom ViewActions Class.

When this function is called it will add a new task string to the array of tasks in a copy of the model properties. And then call the `present()` function with those updated props. The present method runs your validation logic and either saves the errors in the data or saves it to a server, but either way it calls the `render()` method on the State object with the new data properties object.

The render method checks for the existance of errors to display to the user, and it sets a couple derived properties on that object that the model doesn't need to deal with, that will be used for changing what is finally rendered back out the user. At the end of it's calculation work it will call your view rendering functions. But in the case of Maquette it's actually just going to tell it's own main Maquette `Projector` to schedule a re-render on the next animation frame of the browser. Using Maquette in this way allows you to move certain really performance hindering calculations out to the view rendering functions if you want them to only ever be called once per render (every ~16ms) so we don't bog down the browser. But I wouldn't start doing this until you spot performance problems because this adds another place to look where state logic is happening.

The view method is doing the rendering of the list

```ts
TodoList: (props: TodoListProps) => {
    return h("ul.all-todos", props.list.map((item: string) => {
            return h("input.todo", {
                    type: "checkbox",
                    value: item.id,
                    checked: item.done,
                    classes: { 'strikethrough': item.done },
                    onchange: this.actions.changeTodoItem,
                });
        }));
}
```


## Functional Rendering with TypeScript Helper Classes

Rendering with a plain hyperscript function - like the `h()` function [provided by maquette](https://maquettejs.org/typedoc/index.html#h) is powerful - but most develoers aren't sadists - so they replace it with TSX, JSX or another template compiler. I usually wouldn't bet against HTML, but JSX has always just felt kinda annoying to me. It differs from HTML in a few important ways. And HTML isn't really that great for developers to begin with.

As a web developer I would recommend against any abstractions that pull us too far away from HTML/CSS. I've seen the pain of ASP.Net WebForms and Adobe Flex. Yet, here I am recommending developers use an abstraction that breaks fundamental rules about applying HTML and CSS to your site.

I created the [FRETS-Styles-Generator](https://gitlab.com/FRETS/frets-styles-generator) tool to read a CSS file and turn it into a TS class that proxies the functionality of the maquette `h()` function. Normally you would pass your classnames to it like so `h("div.card.content-area", ["my content"])`. The css selector is a big glaring ugly magic string, it's not refactorable or type checked. So with the generated class now you can express the above function like this `$.div.card.contentArea.h(["my content"])`. If you choose to run the generator against one of the [several "atomic css" libraries out there](https://css-tricks.com/lets-define-exactly-atomic-css/) then you get a whole bunch of __composable__ classes that let you specify your your UI looks, what it's nested structure is, and encourages thorough refactoring within your TypeScript. Bonus, the generator runs everything through PostCSS so you can split up your stylesheets in to modules that you can `@import` and make use of new CSS variable.

Bigger bonus, if you go into your stylesheets and start removing classes, the generator will rebuild the TypeScript class and your TS project will give you *build errors* if any of your CSS is now missing! That could make maintenance of app stylesheets a lot easier.

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsirtimbly%2Ffrets.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsirtimbly%2Ffrets?ref=badge_large)
