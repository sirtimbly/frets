# Creating a Basic FRETS App

## Use the Starter Project

We have a convenient [parcel starter project](https://github.com/sirtimbly/boilerplate-frets-tailwindcss) that demonstrates how to structure and run your frets application - with opinionated defaults like Parcel bundler, Tailwind CSS and XO linting presets.

This other starter project is slightly older and uses BassCSS, TSLint and Webpack - [webpack starter project](https://github.com/sirtimbly/frets-starter)


```sh
git clone git@github.com:sirtimbly/frets-starter.git
cd frets-starter
npm install
npm start
```

# Custom Setup

The easiest way to incorporate FRETS into an existing javascript project is to install it with npm and then import it in the main entrypoint of your application.

First we need to create a new project directory somewhere and run `npm init` to get the project ready with a `package.json` file.

## Install Dependencies

Install the prod dependencies. (FRETS brings in 3 dependecies: maquette, path-parser and tslib)

```sh
npm install frets --save
```

Since we recommend writing FRETS apps using TypeScript, and compiling to plain JavaScript for the browser, you will either need to run `tsc` (the typescript compiler) or use a bundler that compiles TypeScript for you.


Install the dev dependencies
```sh
npm install -D frets-styles-generator tailwindcss typescript parcel
```

## Create Entrypoint

Create your primary typescript source file at `src/app.ts`

Create an HTML file in `src/index.html`. This should have a script tag at the bottom of the file before the closing body tag so parcel knows to bundle up a script.

```html
<script src="app.ts"></script>
```

It should also have a link to a css file in the head.

```html
<link rel="stylesheet" href="styles/app.css">
```

Here's the whole html file we will need.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="styles/app.css">
  </head>
  <body>
    <h1 class="font-bold text-2xl text-center mx-auto mt-3">A Simple FRETS Web App</h1>
    <main id="app" class="container mx-auto"></main>
    <script src="app.ts"></script>
  </body>
</html>
```

## Typescript Setup

You will need a tsconfig.json file in the root of your project.

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "esnext",
    "strict": true,
    "importHelpers": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "noImplicitAny": false,
    "noImplicitThis": false,
    "strictPropertyInitialization": false,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "baseUrl": ".",
    "types": [],
    "paths": {
      "~*": ["./src/*"],
      "/*": ["./*"]
    },
    "lib": [
      "es5",
      "es6",
      "dom",
      "dom.iterable",
      "es2015.promise",
    ]
  },
  "include": [
    "src/**/*.ts",
  ],
  "exclude": [
    "node_modules"
  ]
}

```

## App.ts

Setup some important things in the main typescript file.

It needs a class defined for your data model.

```ts
import {PropsWithFields, ActionsWithFields, FRETS} from 'frets';

export class RealWorldProps extends PropsWithFields {
	public username?: string;

	constructor(props?: Partial<RealWorldProps>) {
		super();
		if (props) {
			Object.assign(this, props);
		}
	}
}
```

Then you need a class that defines Actions which can be taken in your app.

```ts
export class RealWorldActions extends ActionsWithFields {
	public login: (e: Event) => void;

}
```

We can now "new up" an instance of a FRETS app with those two classes as the specified generic types. We don't need to export the Frets app object but we can export a type which will be a useful shorthand in other functions that accept the app as an argument later on.

```ts
export type App = FRETS<RealWorldProps, RealWorldActions>;

const F: App = new FRETS<RealWorldProps, RealWorldActions>(
	new RealWorldProps(),
	new RealWorldActions()
);
```

You will also want to specify and export a Type for the action event handler functions which you need to register next.

```ts
export type ActionFn = (e: Event, data: Readonly<RealWorldProps>) => RealWorldProps;
```

This makes it slightly less verbose to create many of these functions which all share the same signature.

```ts
const loginAction: ActionFn = (e, data) => {
	e.preventDefault();
	return {
		...data,
		username: F.getField<string>('fieldName').value
	};
};

F.actions.login = F.registerAction(loginAction);
```

I'll explain about `getField` in a little bit. This is obviously a really simple example of an action. At it's core it makes a change to the passed in data model and returns it.

We register these functions and do an assignment at the same time: so that in your view rendering functions it's possible to add a typesafe handler.

```ts
  // spoiler alert!
	$.button.btn.btnBlue.h({onclick: app.actions.login}, ['Login'])
```

## Tailwind CSS

In order to use tailwind we need to create a new `postcss.config.js  ` file in the root of our project.

```js
module.exports = {
	plugins: [
		require('tailwindcss')('tailwind.config.js'),
		require('autoprefixer')
	]
};
```

You should then be able to create your primary stylesheet `src/styles/app.css` (which is already linked in your html)

```css
@tailwind base;

@tailwind components;

@tailwind utilities;

body {
  background-color: lightgray;
  font-family: 'Helvetica', Arial, sans-serif;
}


.btn {
  @apply font-bold py-2 px-3 rounded cursor-pointer text-center;
}

.btn-blue {
  @apply bg-blue-500 text-white;
}

.btn-blue:hover {
  @apply bg-blue-700;
}


```
Those button classes are an example of using tailwind to add special custom utility classes to your CSS.

We're not quite ready to run yet. We still need to write our view rendering method.

## Generating the atomic CSS app-styles class

In order to make dom renering functions more developer-friendly, we can turn that css file into a typescript file full of helpful methods by using `frets-styles-generator`.

```sh
./node_modules/.bin/frets-styles-generator src/styles/
```

This will create a new typescript file next to any CSS files in the path you specify. For instance app.css will get it's own companion typescript class at `src/styles/app-styles.ts`. You will be importing the `$` and `$$` members into your view rendering functions becaus those classes have a special "getter" method which creates a chainable api for generating dom nodes with long "utility-first" css class names in javascript without having to write out long un-refactorable strings.

## View render methods

In react you would call these SFCs. They are simply functions that should not have side effects and should return a VNode for maquette to use in dom rendering. I put each one in it's own file for clean organization, and some of them can get quite verbose. Because in frets we don't write any templates, html, or JSX.

This way of writing these class names is fun and satisfying and saves you from having to revisit tailwind docs all the time.

In `src/views/root.ts`

```ts
import {VNode} from 'frets';
import {App} from '../app';
import {$, $$} from '../styles/app-styles';

export const notification = $.div.maxWMd.mxAuto.flex.justifyBetween.itemsCenter.p_6.bgWhite.rounded.shadowXl.m_3;
export const input = $.input.bgGray_100.m_2.p_1.textBlack.rounded;
export const renderRoot = (app: App): VNode => {
	const usernameField = app.registerField<string>('fieldName');
	const passField = app.registerField<string>('fieldPass');
	return notification.h([
		app.modelProps.username ?
			`Hello ${app.modelProps.username}` :
			$$('form').flex.flexCol.h([
				$.label.h(['Username', input.h({
					onblur: usernameField.handler,
					value: usernameField.value
				})]),
				$.label.h(['Password', input.h({
					type: 'password',
					onblur: passField.handler,
					value: passField.value
				})]),
				$.button.btn.btnBlue.h({onclick: app.actions.login}, ['Login'])
			])

	]);
};
```

### Quick Note on RegisterField

Since our functions are stateless we have to access persistent state from the `app.modelProps` on the main app or from a registry of ad-hoc data fields that are keyed by strings. You see this above like this:

```ts
const usernameField = app.registerField<string>('fieldName');
```

You can also pass in a default value to start with. If it's been called once it won't overwrite. And if you pass in a default value then you don't need to specify the generic type.

```ts
const usernameField = app.registerField('fieldName', 'bob the builder');
```

Now `usernameField` is an object with 'value' and 'handler' members.  The value of course is for displaying the current value stored in state, and the handler is for changing the value when a browser event causes an update. This handler assumes it was attached to a form field and receives a change or blur event.


## Register the view and Mount to DOM

We just need to wire up this final method into our main frets app by importing root.ts inside of app.ts and then we have a fully functional frets app.

```ts
F.registerView(renderRoot);

F.mountTo('app');
```

The argument passed to the mountTo method is the id of an element in the html which will be merged with the output of the render method. This allows for easy usage of skeleton placeholders and server-rendered content that can be replaced after the page has been "hydrated" and the JS is all loaded and parsed. Frets apps should pride themselves on being small, and light-weight so hopefully the user won't have enormous JS bundles that take forever to download and parse.

Maquette handles all of the virtual-dom diffing and updating in an efficient and simple manner. After any event handler is fired from within the dom tree that maquette is responsible for, the specified app render function is called again with whatever values are currently in the app state after being updated inside the actions (handlers). If an async call comes back it needs to call `F.render(newProps)` in order to manually trigger a new DOM rendering cycle.

Now run the parcel dev server either from a script in package.json or with the command

```sh
npx parcel serve src/index.html
```

When you visit [http://localhost:1234](http://localhost:1234) you should see a screen like this:

![](http://uploads.timbendt.com/Screen-Shot-2019-05-18-15-38-22.png)

And when you enter text into the fields and click "login" you should see the state change.

If you want to see the final project that we created here you can [get the boilerplate starter project from github](https://github.com/sirtimbly/boilerplate-frets-tailwindcss).


