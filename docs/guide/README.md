---
sidebarDepth: 2
---

# Getting Started with FRETS

## Philosophical Rules


1. Optimize for Developer Ergonomics
2. No Magic Strings (Unless it is Text Displayed to the User)
3. No Configuration Objects (Use TS Classes)
4. Encourage Functional Programming Models

### Optimize for Developer Ergonomics

This means that we use TypeScript throughout. It's right there in the name. TypeScript provides a superior development experience over raw JS. This power is fully unleashed when the developer uses a fully configured IDE that makes use of the TypeScript language server (like VS Code). When you get that intellisense autocompletion menu every time you hit `.` on a typed property and see it's sub properties you save mental effort and time. Every time the IDE stops you from misspelling something you save time. Whenever the compiler stops you from passing the wrong type of argument or an incomplete argument object to a method it saves you time.

The API design is not perfect but whenever a choice had to be made it was made towards providing a developer with clear types and hints of what to do next and how to accomplish something.

Developers tend to spend a lot of time discussing code style and syntax optimizations. These are essentially just opinions and it's important to codify your projects opinions in a TSLint file. This tells other developers if they are making syntax "mistakes" and will speed up code reviews.


### No Magic Strings

A "Magic" string is a string literal that is simple placed in your code and is important to the functionality of the code but doesn't come from a configuration source. The only string literals that should appear in your UI codebase should be:

- Text that the user can read (and this could be abstracted through i18n)
- URLs for assets, external links, or APIs. (and ideally these should be provided through some sort of content management or code generation system)


### No Configuration Objects (Use TS Classes)

The developer shouldn't have to worry about building huge configuration objects. FRETS has no configuration objects. Every configuration change is done through a function with a couple arguments. Sometimes a more purely functional approach would have hampered TypeScript's ability to guide and correct a developer as they use the library, in those cases the more functional but syntactically obscure way of doing things was avoided in favor or providing the best developer experience.


### Encourage Functional Programming Models

Pure functions should be used to set up all the logic of your application. No side effects should be allowed.

Currently FRETS enforces that the state of your application is immutable when you are reading it, and can only be updated when a "Action" is called. Actions are a pure function that receice a Readonly copy of the current state and then return simple proposed updates to that state.

The other building blocks of the framework are the Validator and the Calculator, those are deisgned to be pure functions also.

The tiny built-in router is set up by registering functions that get called to update state when a specific url route pattern is matched.

The FRETS class is not "functional" it's an class object. And the object is not entirely immutable. But the developer ergonomics are improved through the use of Generic Types on these classes. The actions and your state model are specified by writing a class with members that make code completion and type checking possible.

