import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Range,
  TextDocument,
  languages,
  window,
  workspace,
} from 'vscode';
import {PerformanceObserver, performance} from 'perf_hooks';
import {Git} from './git';

import {Telemetry} from './telemetry';

/**
 * Stripe returns redacted API keys in the form of sk_live_aa********************1234, so don't match unless there are
 * at least three unredacted characters of the body of the API key.
 */
const stripeKeysRegex = new RegExp(
  '(sk_test|sk_live|pk_test|pk_live|rk_test|rk_live)_[a-zA-Z0-9]{2}[a-zA-Z0-9]+',
  'g',
);
const diagnosticMessageNoGit =
  'This Stripe API Key is hardcoded. For better security, consider using a .env file.  See https://stripe.com/docs/keys#safe-keys for more advice.';
const diagnosticMessageGit =
  'This Stripe API Key is in a file not ignored by git. For better security, consider using a .env file. See https://stripe.com/docs/keys#safe-keys for more advice.';

const diagnosticCollection: DiagnosticCollection =
  languages.createDiagnosticCollection('StripeHardCodedAPIKeys');

export class StripeLinter {
  telemetry: Telemetry;
  git: Git;
  private perfObserver: PerformanceObserver;

  constructor(telemetry: Telemetry, git: Git) {
    this.telemetry = telemetry;
    this.git = git;

    this.perfObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        this.telemetry.sendEvent('linter.perf.git-check-ignore-duration', entry.duration);
      });
    });
    this.perfObserver.observe({entryTypes: ['measure'], buffered: true});
  }

  async activate() {
    if (window.activeTextEditor) {
      await this.lookForHardCodedAPIKeys(window.activeTextEditor.document);
    }
    workspace.onDidSaveTextDocument(this.lookForHardCodedAPIKeys);
  }

  lookForHardCodedAPIKeys = async (document: TextDocument): Promise<void> => {
    performance.mark('ignore-start');
    const isIgnored = await this.git.isIgnored(document.uri);
    performance.mark('ignore-end');
    performance.measure('ignore', 'ignore-start', 'ignore-end');

    if (isIgnored || document.fileName.endsWith('.env')) {
      diagnosticCollection.delete(document.uri);
      return;
    }

    const text = document.getText();
    const lines = text.split('\n');

    const message = (await this.git.isGitRepo(document.uri))
      ? diagnosticMessageGit
      : diagnosticMessageNoGit;

    const fileDiagnostics: Diagnostic[] = lines.flatMap(this.prepareLineDiagnostics(message));

    // tell VS Code to show warnings and errors in syntax
    diagnosticCollection.set(document.uri, fileDiagnostics);
  };

  // prepareAPIKeyDiagnostics regex matches all instances of a Stripe API Key in a supplied line of text
  // will return a list of Diagnostics pointing at instances of the Stripe API Keys it found
  prepareLineDiagnostics =
    (message: string) =>
    (line: string, index: number): Diagnostic[] => {
      const diagnostics: Diagnostic[] = [];

      let match;
      while ((match = stripeKeysRegex.exec(line)) !== null) {
        const severity = /sk_live/.test(match[0])
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning;

        // specify line and character range to draw the squiggly line under the API Key in the document
        const range = new Range(index, match.index, index, match.index + match[0].length);
        // create new diagnostic and add to the list of total diagnostics for this line of code
        const diagnostic = new Diagnostic(range, message, severity);

        this.telemetry.sendEvent('diagnostics.show', severity);
        diagnostics.push(diagnostic);
      }

      return diagnostics;
    };
}
