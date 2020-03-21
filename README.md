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

### Forward webhooks traffic with debugging

You can forward webhooks traffic to your local machine by either running the command `Stripe: "Start Webhooks events listening with CLI` or by creating a debug configuration that allows you to launch webhooks forwarding when starting debugging or pressing `F5`.

The Stripe debug configuration can be combined with other configurations, so you with one click/press can launch both Stripe and your local API instance.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Stripe: Webhooks Forward",
      "type": "stripe",
      "request": "launch",
      "command": "listen",
      "localUrl": "http://localhost:3000/stripe-events"
    }
  ]
}
```

For the `stripe` debug configuration you can also specify `localUrl` which is the URL of your local server that should receive your webhooks traffic.

You can also combine the `stripe` debug configuration with `compounds` configurations to have one configuration that launches your API and stripe at the same time:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Stripe: Webhooks Forward",
      "type": "stripe",
      "request": "launch",
      "command": "listen",
      "localUrl": "http://localhost:3000/stripe-events"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Node: Launch Program",
      "program": "${workspaceFolder}/examples/standalone.js",
      "skipFiles": ["<node_internals>/**"]
    }
  ],
  "compounds": [
    {
      "name": "Launch: Stripe + API",
      "configurations": ["Node: Launch Program", "Stripe: Webhooks Forward"]
    }
  ]
}
```

## Developing this extension

1. Checkout this repo
1. Run `npm install` in terminal to install dependencies
1. Run the `Run Extension` target in the Debug View or simply press `F5` This will: - Start a task `npm: watch` to compile the code - Run the extension in a new VS Code window

```

```
