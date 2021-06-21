<h1 align="center">
  <br>
    <img src="https://github.com/stripe/vscode-stripe/blob/master/resources/logo.png?raw=true" alt="logo" width="150">
  <br>
  Stripe for Visual Studio Code
  <br>
  <br>
</h1>

<h4 align="center">Build, test, and use Stripe inside your editor.</h4>

Stripe’s extension for Visual Studio Code makes it easy to generate sample code, view API request logs, forward events to your application, and use Stripe within your editor.

A new Stripe panel in the activity bar provides easy access to code snippets for several languages, adds debug configurations, and extends the command palette with common developer workflows.

![Stripe](resources/extension.png)

Read more about this extension in the official Stripe documentation at [https://stripe.com/docs/stripe-vscode](https://stripe.com/docs/stripe-vscode)

## Contributions

Stripe for Visual Studio Code is an open source project. We do development in the open, where our [issue tracker](https://github.com/stripe/vscode-stripe/issues) is public here in GitHub.

Contributions and feedback to the project are welcome, so please open issues for feature requests, questions and alike.

### Developing this extension

1. Checkout this repo
1. Run `npm install` in terminal to install dependencies
1. Run the `Run Extension` target in the Debug View or simply press `F5` This will:
   - Start a task `npm: watch` to compile the code
   - Run the extension in a new VS Code window
1. Disable the Stripe Extension for this workspace.
   - Right click "Stripe" from the Extensions marketplace
   - Click Disable (Workspace)

### Debugging this extension

1. Open the Run view, select the "Run Extension" button to launch an additional Extension Development Host instance of VSCode that executes the extension code in your workspace.
1. To debug the stripe language server, select the "Client + Server" button. This will allow you to set breakpoints for code that lives within the stripeLanguageServer directory.
   - You can find more info on the language server here: https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

## License

See [LICENSE.md](LICENSE.md)

## Telemetry

The Stripe VS Code Extension collects basic telemetry in order to improve this extension's experience. If you'd like to opt out we respect the [global telemetry setting in VS Code](https://code.visualstudio.com/docs/getstarted/telemetry), so we won't collect any data unless this setting is turned on.

## Third-Party Notices

| Name                               | Description                                                                        | Version |   Size |  License   |
| :--------------------------------- | :--------------------------------------------------------------------------------- | :------ | -----: | :--------: |
| @grpc/grpc-js                      | gRPC Library for Node - pure JS implementation                                     | 1.3.2   | 117.3k | Apache-2.0 |
| byline                             | simple line-by-line stream reader                                                  | 5.0.0   |   1.8k |    MIT     |
| compare-versions                   | Compare semver version strings to find greater, equal or lesser.                   | 3.6.0   |   1.7k |    MIT     |
| execa                              | Process execution for humans                                                       | 4.0.0   |  25.4k |    MIT     |
| moment                             | Parse, validate, manipulate, and display dates                                     | 2.24.0  | 289.7k |    MIT     |
| os-name                            | Get the name of the current operating system. Example: macOS Sierra                | 3.1.0   |  29.9k |    MIT     |
| proxyquire                         | Proxies nodejs require in order to allow overriding dependencies during testing.   | 2.1.3   |    16k |    MIT     |
| remark-gfm                         | remark plugin to support GFM (autolink literals, strikethrough, tables, tasklists) | 1.0.0   |  22.2k |    MIT     |
| toml                               | TOML parser for Node.js (parses TOML spec v0.4.0)                                  | 3.0.0   |  27.5k |    MIT     |
| uuid                               | RFC4122 (v1, v4, and v5) UUIDs                                                     | 3.4.0   |   8.1k |    MIT     |
| vscode-languageclient              | VSCode Language client implementation                                              | 6.1.3   | 215.3k |    MIT     |
| vscode-languageserver              | Language server implementation for node                                            | 6.1.1   | 121.9k |    MIT     |
| vscode-languageserver-textdocument | A simple text document implementation for Node LSP servers                         | 1.0.1   |   3.8k |    MIT     |

## Code of Conduct

This project has adopted the Stripe Code of Conduct. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
