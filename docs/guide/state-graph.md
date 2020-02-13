# Using a State Graph

When you're rendering a component it's helpful to model it as a finite state machine. Frets helps you specify a graph of different states. These states will be selected based on the `guard` logic you set, and then you can use the node that is resolved to render parts of your UI with declarative logic.

```ts
{
  name: "loggedOut",
  edges: [
    {
      name: "loading",
      guard: props => props.loading,
      renderer: app =>
        PassiveText.h([
          `Logging ${app.modelProps.logout ? "Out" : "In"}...`
        ])
    },
    {
      name: "loggedIn",
      guard: props => Boolean(props.accountId),
      renderer: app =>
        LoggedIn({ accountId: app.modelProps.accountId, logoutAction })
    }
  ],
  renderer: app =>
    TextFieldForm({
      textFields: [
        app.registerField("Username"),
        app.registerField("Password")
      ],
      loginAction,
      loginLabel: "Log In"
    })
}
```

