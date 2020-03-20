<h1 align="center">
  <br>
    <img src="https://github.com/stripe/vscode-stripe/blob/master/resources/logo_128.png?raw=true" alt="logo" width="150">
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

- Easy access to key sections of the Stripe developer dashboard
- Ability to see and access recent events from Stripe
- Realtime API logs inside the integrated terminal
- Launch and forward webhooks traffic to your local machine via commands and debug configurations.
- Linting of Stripe API keys to make sure you don't expose them by mistake.
- Code snippets for most common API objects for the top languages supported by Stripe.

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

## Developing this extension

1. Checkout this repo
1. Run `npm install` in terminal to install dependencies
1. Run the `Run Extension` target in the Debug View or simply press `F5` This will: - Start a task `npm: watch` to compile the code - Run the extension in a new VS Code window
