# SAMWise
## An Ultralight Composable Frontend TypeScript Web Framework

SAMWise is a set of classes and interfaces to make it easy for you to write code that complies (mostly) with the SAM pattern. You can get all the reassurance of reliable code completion and type checking while still writing "pure" functional code. I think classes made up of functions are a perfectly valid way of giving developers the convenience of automatic code completion, and the other advantages of the Typescript tooling world. Making a developer remember all the variable names or massive copy-pasting is the enemy of clean bug-free code.

To explain the framework, Let me work backwards through the SAM application pattern starting from the UI rendering in the browser.

## Views

In SAM every piece of your UI should be a pure function that updates the DOM in some way. Reusability comes from classic refactoring and composition of functions, without learning any new ceremony of a component object structure. Your view rendering code should be modular and composable, these aspects tend to emerge as the developer starts programming and sees the need to refactor continuously.

I originally was playing around with [Mithril](https://mithril.js.org/) and attempting to integrate it as a VirtualDom rendering implementation of the SAM pattern. But Mithril was not very TypeScript friendly, and a little searching revealed [Maquette](https://maquettejs.org/), a smaller and lighter TypeScript implementation of the hyperscript rendering interface that Mithril (and react) give us. It might even be more performant, depending on how you measure. It's not perfect, but it is under active development and I think the value of a solidly implemented hyperscript rendering library, decoupled from the big projects, that we can build upon is of significant value.

Why no JSX? Why no templating? ... This is an experiment, and in the past I have always been a believer in working with real HTML. I thougt staying close to the final implementation language was the smartest way proceed compared to things like ASP.Net WebForms or HAML. Every developer is familiar with HTML which is why Vue and JSX are so easy to learn, they have a declarative syntax that looks mostly just like HTML. But I wondered, can I avoid some of the pain of the syntactic restrictions of HTML? (let's be honest, it is _super_ verbose and repetetive). In the Mithril hyper script code I saw [DOM rendering functions let you specify a CSS selector string](https://mithril.js.org/hyperscript.html#css-selectors) — think of how you use the [Emmet](https://emmet.io/) tool in your IDE to generate HTML. These methods take that selector string and an attributes object to generate an html element with all the appropriate class names, attributes, etc. I like it. It's weird but it works. And as a developer I don't have to do as much mode switching between HTML and JavaScript syntax.

What data does your view function render? Well, it's just a plain old JavaScript object, or preferable a generic subset of that object if you've refactored your UI into smaller decoupled functions. Of course, since this is TypeScript our IDE will know that we've already specified the shape and types of the properties on that object, so we get code completion and type warnings everywhere we work with it reducing errors and making it easier to reason about your higher level code when you're down in the rendering functions. Ideally you will have one big parent Class object for your entire application state making it easy to know what you're passing around and looking for.

In Samwise you keep all your high level view functions that accept that global state data object in one class to make refactoring easy and painless.

## State 

State is a simple class that is responsible for calling those "View" render methods. You instantiate a new Samwise state object specifying the render function you want (with a default assumption that you're using the Maquette projector for updating the dom). This state representer function will also recieve a preRender function to do any special calculations or logic for deriving transient properties in the application state from the values of the data properties object that it is passed. Things like warning messages, loading indicators, visibility switching, and in-app navigation or routing.

## Model

The state was called by a function on your Model class called "present". Generally there is one *Present()* function on a model, and it is tied to the one *Render()* function on you State class. This present function first executes any data validation logic that the model was configured with when we gave it a *validate()* function at instatiation. So the Model handles consistency, and this is also where you would specify data synchronization logic for communicating with a remote API.

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

built with typescript-starter
is a set of classes and interfaces to make it easy for you to write code that complies (mostly) with the SAM pattern. You can get all the reassurance of reliable code completion and type checking while still writing "pure" functional code. I think classes made up of functions are a perfectly valid way of giving developers the convenience of automatic code completion, and the other advantages of the Typescript tooling world. Making a developer remember all the variable names or massive copy-pasting is the enemy of clean bug-free code.

To explain the framework, Let me work backwards through the SAM application pattern starting from the UI rendering in the browser.

## Views

In SAM every piece of your UI should be a pure function that updates the DOM in some way. Reusability comes from classic refactoring and composition of functions, without learning any new ceremony of a component object structure. Your view rendering code should be modular and composable, these aspects tend to emerge as the developer starts programming and sees the need to refactor continuously.

I originally was playing around with [Mithril](https://mithril.js.org/) and attempting to integrate it as a VirtualDom rendering implementation of the SAM pattern. But Mithril was not very TypeScript friendly, and a little searching revealed [Maquette](https://maquettejs.org/), a smaller and lighter TypeScript implementation of the hyperscript rendering interface that Mithril (and react) give us. It might even be more performant, depending on how you measure. It's not perfect, but it is under active development and I think the value of a solidly implemented hyperscript rendering library, decoupled from the big projects, that we can build upon is of significant value.

Why no JSX? Why no templating? ... This is an experiment, and in the past I have always been a believer in working with real HTML. I thougt staying close to the final implementation language was the smartest way proceed compared to things like ASP.Net WebForms or HAML. Every developer is familiar with HTML which is why Vue and JSX are so easy to learn, they have a declarative syntax that looks mostly just like HTML. But I wondered, can I avoid some of the pain of the syntactic restrictions of HTML? (let's be honest, it is _super_ verbose and repetetive). In the Mithril hyper script code I saw [DOM rendering functions let you specify a CSS selector string](https://mithril.js.org/hyperscript.html#css-selectors) — think of how you use the [Emmet](https://emmet.io/) tool in your IDE to generate HTML. These methods take that selector string and an attributes object to generate an html element with all the appropriate class names, attributes, etc. I like it. It's weird but it works. And as a developer I don't have to do as much mode switching between HTML and JavaScript syntax.

What data does your view function render? Well, it's just a plain old JavaScript object, or preferable a generic subset of that object if you've refactored your UI into smaller decoupled functions. Of course, since this is TypeScript our IDE will know that we've already specified the shape and types of the properties on that object, so we get code completion and type warnings everywhere we work with it reducing errors and making it easier to reason about your higher level code when you're down in the rendering functions. Ideally you will have one big parent Class object for your entire application state making it easy to know what you're passing around and looking for.

In Samwise you keep all your high level view functions that accept that global state data object in one class to make refactoring easy and painless.

## State 

State is a simple class that is responsible for calling those "View" render methods. You instantiate a new Samwise state object specifying the render function you want (with a default assumption that you're using the Maquette projector for updating the dom). This state representer function will also recieve a preRender function to do any special calculations or logic for deriving transient properties in the application state from the values of the data properties object that it is passed. Things like warning messages, loading indicators, visibility switching, and in-app navigation or routing.

## Model

The state was called by a function on your Model class called "present". Generally there is one *Present()* function on a model, and it is tied to the one *Render()* function on you State class. This present function first executes any data validation logic that the model was configured with when we gave it a *validate()* function at instatiation. So the Model handles consistency, and this is also where you would specify data synchronization logic for communicating with a remote API.

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


### Using the Bass.css to TS class generator - COMING SOON


### TODO

[ ] figure out what sorcery does and why it's resolving paths from the working dir root instead of file location