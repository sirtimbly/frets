# Getting Started with FRETS

## Use the Starter Project

We have a convenient [starter project](https://github.com/sirtimbly/frets-starter) that demonstrates how to structure and run your frets application.

```sh
git clone git@github.com:sirtimbly/frets-starter.git
cd frets-starter
npm install
npm start
```

## Installation

The easiest way to incorporate FRETS into an existing javascript project is to install it with npm and then import it in the main entrypoint of your application.

```sh
npm install frets frets-styles-generator --save
```

Since we recommend writing FRETS apps using TypeScript, and compiling to plain JavaScript for the browser, you will either need to run `tsc` (the typescript compiler) or use webpack with ts-loader.

```sh
npm install webpack webpack-dev-server webpack-cli typescript ts-loader --save-dev
```





