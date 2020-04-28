import {
  ServerOptions,
  LanguageClientOptions,
  LanguageClient,
} from "vscode-languageclient";

import { workspace, ExtensionContext, languages } from "vscode";

import { Telemetry } from "../telemetry";

const telemetry = Telemetry.getInstance();

export class StripeLanguageClient {
  static activate(context: ExtensionContext, serverOptions: ServerOptions) {
    let clientOptions: LanguageClientOptions = {
      // Register the server for javascript (more languages to come)
      documentSelector: [{ scheme: "file", language: "javascript" }, { scheme: "file", language: "typescript" }],
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
      },
    };

    let client = new LanguageClient(
      "stripeLanguageServer",
      "Stripe Language Server",
      serverOptions,
      clientOptions
    );

    client.onTelemetry((data: any) => {
      const eventData = data.data || null;
      telemetry.sendEvent(data.name, eventData);
    });

    client.start();
  }
}
