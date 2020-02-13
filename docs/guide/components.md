# Organizing with Components

Frets can help you organize your application by focusing on small reusable functions that render portions of your user interface. These functions should be portable and limit their side effects, therefore your code will become less tightly coupled as you build the various reusable rendering functions which represent the current state of the application to the user.

But, if you want to isolate and group certain parts of the application state objects, business logic and event handlers together with rendering functions that use them then frets will support the creation of components by letting you pass in two important dependencies from a parent frets app to a child frests app. 

```ts
const parentApp = setup(new GlobalData(), (f) => {
    const globalPresenter = f.present;
    const childApp = setup(new ComponentData(), (f1) => {
        // component specifc models, events, etc
    }, f.projector);

    //global models, events, etc

    f.registerView((app) => $.div.h([
        // wrapper layout with embedded component rendered here
        childApp.stateRenderer(),
    ]));


}).mountTo("main");
```

