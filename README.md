# FRETS (Functional, Reactive, entirely TypeScript)
## An Ultralight Composable Frontend TypeScript Web Framework
<p style="text-align: center">
  <img alt="GitHub Workflow Status (branch)" src="https://img.shields.io/github/workflow/status/sirtimbly/frets/NPM%20Release/master">
  <a href="https://www.npmjs.com/package/frets"><img src="https://badge.fury.io/js/frets.svg" alt="npm version" height="20"></a>
  <img alt="Libraries.io dependency status for latest release" src="https://img.shields.io/librariesio/release/npm/frets">
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

Read the [docs](https://sirtimbly.github.io/frets/)!

The basic SAM (State Action Model) app lifecycle:
Action (event) -> Model (update) -> State (calculate) -> View (render) -> [wait for client events that call an Action()]

Note:
> Loosely based on [sam.js.org](https://sam.js.org)


## Philosophical Rules

1. Optimize for Developer Ergonomics (chainable APIs)
2. No Magic Strings
3. No Configuration Objects
4. Encourage Some Functional Programming

## Contact Me

Leave an issue here with any questions or suggestions, or reach out on twitter: [@sirtimbly](https://twitter.com/sirtimbly).

## Quick Demo App

```ts
const frets = setup((f) => {
  //... register MODELS
  //... register VIEWS
    //... inside your views, register ACTIONS and FIELDS
});

// customize the state calculation function that gets called before every re-render
frets.stateRenderer = (newProps: TodoListProps, oldProps: TodoListProps): TodoListProps => {
  // add your derived state business logic here
  return newProps
};

// mount it to the DOM
frets.mountTo("main")

```
Read the [docs](https://sirtimbly.github.io/frets/) for more details about getting started!

## What and Why?

FRETS is a set of classes and interfaces to make it easy for you to write code that complies (mostly) with the SAM pattern. You can get all the reassurance of reliable code completion and type checking while still writing "pure" render functions. I think classes made up of functions are a perfectly valid way of giving developers the convenience of automatic code completion, and the other advantages of the Typescript tooling world. Making a developer remember all the variable names or massive copy-pasting is the enemy of clean bug-free code.


## Functional Rendering with TypeScript Helper Classes

Rendering with a plain hyperscript function - like the `h()` function [provided by maquette](https://maquettejs.org/typedoc/index.html#h) is powerful - but most develoers aren't sadists - so they replace it with TSX, JSX or another template compiler. I usually wouldn't bet against HTML, but JSX has always just felt kinda annoying to me. It differs from HTML in a few important ways. And HTML isn't really that great for developers to begin with.

As a web developer I would recommend against any abstractions that pull us too far away from HTML/CSS. I've seen the pain of ASP.Net WebForms and Adobe Flex. Yet, here I am recommending developers use an abstraction that breaks fundamental rules about applying HTML and CSS to your site.

I created the [FRETS-Styles-Generator](https://gitlab.com/FRETS/frets-styles-generator) tool to read a CSS file and turn it into a TS class that proxies the functionality of the maquette `h()` function. Normally you would pass your classnames to it like so `h("div.card.content-area", ["my content"])`. The css selector is a big glaring ugly magic string, it's not refactorable or type checked. So with the generated class now you can express the above function like this `$.div.card.contentArea.h(["my content"])`. If you choose to run the generator against one of the [several "atomic css" libraries out there](https://css-tricks.com/lets-define-exactly-atomic-css/) then you get a whole bunch of __composable__ classes that let you specify your your UI looks, what it's nested structure is, and encourages thorough refactoring within your TypeScript. Bonus, the generator runs everything through PostCSS so you can split up your stylesheets in to modules that you can `@import` and make use of new CSS variable.

Bigger bonus, if you go into your stylesheets and start removing classes, the generator will rebuild the TypeScript class and your TS project will give you *build errors* if any of your CSS is now missing! That could make maintenance of app stylesheets a lot easier.

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsirtimbly%2Ffrets.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsirtimbly%2Ffrets?ref=badge_large)
