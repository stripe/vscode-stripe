<h1 align="center">
  <br>
    <img src="https://github.com/stripe/vscode-stripe/blob/master/resources/logo_128.png?raw=true" alt="logo" width="150">
  <br>
  Stripe for Visual Studio Code
  <br>
  <br>
</h1>

<h4 align="center">Bringing you Stripe inside your editor.</h4>

Stripe for VS Code is a new extension for Visual Studio Code that enables developers to have an easier integration experience with Stripe by having easy access to Stripe specific information such as code snippets, API requests logs and events directly from their editor.

Stripe for VS Code works by extending VS Code with a new “Stripe” panel in the activity bar, provides code snippets for top languages, debug configurations and extends the command palette with Stripe specific commands to make workflows easier.

![Stripe](resources/stripe.png)

## Getting started

1. Go to [releases](https://github.com/stripe/vscode-stripe/releases) and download the `.VSIX` file from the latest release
3. See the VS Code docs on [how to install the VSIX](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix )
2. Once installed, click the new Stripe icon in the Activity Bar or explore the new Stripe commands in the command palette.

Make sure you have the [Stripe CLI](https://stripe.com/docs/stripe-cli) installed on your computer.

## Features

- Easy access to key sections of the Stripe developer dashboard
- See recent events from Stripe and trigger new ones.
- Realtime API logs inside the integrated terminal
- Launch and forward webhooks traffic to your local machine via commands and debug configurations.
- Linting of Stripe API keys to make sure you don't expose them by mistake.
- JavaScript code snippets for most common Stripe API scenarios

### Stripe API key linting

The built-in API key linter checks for Stripe API keys inside your source code, and warns you if you expose an API key inside your code. 

Test-mode keys will be treated as warnings, and live-mode keys will be marked as problems.

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

For the `stripe` debug configuration you can also specify `localUrl` which is the URL of your local server that should receive your webhooks traffic. You can also specify `events` which is an optional array that allows you to filter which events you want to have forwarded.

#### Compound configurations
You can combine the `stripe` debug configuration with `compounds` configurations to have one configuration that launches your API and stripe at the same time:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Stripe: Webhooks Forward",
      "type": "stripe",
      "request": "launch",
      "command": "listen",
      "localUrl": "http://localhost:3000/stripe-events",
      "events": ["payment_intent.succeeded", "payment_intent.canceled"] // Optional array if only specific events are wanted
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
1. Run the `Run Extension` target in the Debug View or simply press `F5` This will: 
    - Start a task `npm: watch` to compile the code 
    - Run the extension in a new VS Code window

## License

See [LICENSE.md](LICENSE.md)

## Code of Conduct
This project has adopted the Stripe Code of Conduct. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
