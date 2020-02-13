# Layers of your Application

## Actions and Events

Actions are where user generated events are handled and turned into proposals to update the internal data model of a frets app. Events are typically express as "actions" and are given a specific string label when they are registered. Registering an action means that you intend to handle an event in a certain way, by submitting a certain proposal to the model.

```ts
f.registerAction('save', (evt, present) => {
    present({ name: 'bob', postToApi: true })
})
```

## Business Logic

In frets business logic is primarily organized into "acceptor" functions. These functions will be called on any and all model updates with a proposed change to the internal model state. The functions are responsible for analyzing the proposed change, updating the internal model data, and persisting those changes to any external service like a REST API or other data persistence mechanism like localStorage, or GraphQL.

```ts
f.registerAcceptor((proposal, state) => {
    if (proposal.name && proposal.postToApi) {
        // re-render the UI with  a loading indicator and an optimistic response
        state({busy: true, name: proposal.name}) 
        
        axios.post('/item', {name: proposal.name})
          .then(response => {
            // when the API call succeeds, update the internal model with what the server responds with and turn off the loading indicator
            state({ 
                ...response.body, 
                busy: false
            })
        })
          .catch(error => {
            // if something goes wrong, save the error message, hide the loading indicator, and reset the field we were trying to save
            state({
                error: error.message,
                busy: false,
                name: ''
            })
        })
        
    }
})
```

The acceptor function commits the data model changes by calling the `state` function, which is the second argument that it will be passed, and passing the new updated partial object that you want to commit. So, if there are particular rules or transformations that need to be applied to the data before you "save" it then this is the place to write that logic. For instance the model can only be in state "draft" if the "id" is null or undefined, but if the "id" exists the status must be "saved".

```ts
f.registerAcceptor((proposal, state) => {
    if (proposal.id) {
        state({ status: "saved" });
    }
})
```

An acceptor can choose to reject the proposed data change, in which case it would simply not pass the proposed data to the state function, or not call the `state` function at all. 

Every acceptor will be called on each model update proposal in the order in which they were initially registered.

## State

Before you generate the actual dom nodes that will be rendered to the screen it's useful to have an abstract way of determining which high-level state your application is in. This can be done with switch statement, long if/else chains, or nested ternary operators. But frets offers you an elegant tool for describing your application states and attaching rendering logic to them.

The state tree is a directed graph of states that the app can be in. Each node in the graph is a state which will render something different to the user based on what is in the current model data. States should be finite, meaning an app can only be in one state at at a time, and it must always be in one of the described states.

For example, the state tree is where you determine if your application is in the "unsaved item" state, the "busy saving item" state, or the "saved item" state.

```ts
f.registerStateGraph({
    name: 'unsaved',
    renderer: //function to return an empty data entry form
    edges: [
        {
            name: 'saving',
            guard: (props) => props.busy,
            renderer: //function returns a disabled form with a spinner
        },
        {
            name: 'saved',
            guard: (props) => Boolean(props.id),
            renderer: //function returns a display card with link to an edit form
        }
    ]
})

f.registerView((app) => $.div.borderGray.p2.h([
    app.modelProps.error ? $.div.textRed.h(app.modelProps.error) : '',
    app.currentStateNode.renderer(app),
]))
```

Notice this view function mixes explicit state from the stateGraph with ad-hoc state rendering using an inline ternary for showing any errors, this way you can have state rendering logic that cuts across all possible states. It's not necessary for your state graph to be completely exhaustive.

## Views

The view is a reactive representation of the current state of the application. It is how we get Virtual DOM Nodes to use for the diffing and updating of the DOM tree in the browser.

View functions will be called any time the model props change, so the state will be recalculated to display an updated UI any time any data in the model is changed. Models can only be changed by presenting changes to the acceptors, and usually only from an action handler, so it's easy to reason about why the view render method is being called and how to display the newest state to the user. The UI is always a value derived from the data via the registered view function.

The view function could in theory kick off an API call or a timeout that changes some model property, but if you stick to using the action functions to present all data changes based purely on event handlers fired by the browser then it will be easier to maintain a clean easy to reason about application structure.