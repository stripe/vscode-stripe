<h1 align="center">
  <br>
    <img src="https://github.com/stripe/vscode-stripe/blob/master/resources/icon_128.png?raw=true" alt="logo" width="100">
  <br>
  Stripe for Visual Studio Code
  <br>
  <br>
</h1>

<h4 align="center">Bringing you Stripe inside your editor.</h4>

![CI](https://github.com/stripe/vscode-stripe/workflows/build/badge.svg)

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec non commodo dolor. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Ut eleifend, leo at aliquet molestie, libero dolor efficitur sem, sit amet finibus lacus nisl et est.

## Getting started

1. Grab extension from [marketplace](https://marketplace.visualstudio.com/items?itemName=stripe.vscode-stripe)
2. Click the new Stripe icon in the Activity Bar or explore the new Stripe commands in the command palette.

Make sure you have the [Stripe CLI]() installed on your computer.

## Features

- Browser preview inside VS Code (Powered by [Chrome Headless](https://developers.google.com/web/updates/2017/04/headless-chrome)).
- Ability to have multiple previews open at the same time.
- Debuggable. Launch urls and attach [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) to the browser view instance, and debug within VS Code.
- Attach Chrome DevTools via `chrome://inspect`
- Option to set the default startUrl via `browser-preview.startUrl`
- Option to set the path to the chrome executable via `browser-preview.chromeExecutable`
- Option to set the type of rendering via `browser-preview.format` with the support for `jpeg` (default one) and `png` formats

### Stripe API key linting

### Webhooks debugging

You can enable in-editor debugging of Browser Preview by installing [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome), and configure VS Code's debugger to either attach or launch to the browser previews by using the following configuration:

```json
{
  "version": "0.1.0",
  "configurations": [
    {
      "type": "browser-preview",
      "request": "attach",
      "name": "Browser Preview: Attach"
    },
    {
      "type": "browser-preview",
      "request": "launch",
      "name": "Browser Preview: Launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Watch It

[Watch an animated gif](docs/DEBUGGING.md) showing how to open the preview and debug a browser app.

## Developing this extension

1. Checkout this repo
1. Run `npm install` in terminal to install dependencies
1. Run the `Run Extension` target in the Debug View or simply press `F5` This will: - Start a task `npm: watch` to compile the code - Run the extension in a new VS Code window
