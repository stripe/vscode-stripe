import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Range,
  TextDocument,
  extensions,
  languages,
  window,
  workspace,
} from 'vscode';
import {Git} from './git';

import {Telemetry} from './telemetry';
interface Resource {
  uri: {
    path: string;
  };
}

const gitExtension = extensions.getExtension('vscode.git');
const gitExtensionExports = gitExtension ? gitExtension.exports : null;
const isUsingGitExtension = gitExtensionExports && gitExtensionExports.enabled;
const gitAPI = isUsingGitExtension ? gitExtensionExports.getAPI(1) : null;

const ignoredFileList = ['.env'];
const stripeKeysRegex = new RegExp(
  '(sk_test|sk_live|pk_test|pk_live|rk_test|rk_live)_[a-zA-Z0-9]+',
  'g'
);
const diagnosticMessageNoGit =
  'This Stripe API Key is hardcoded. For better security, consider using a .env file.  See https://stripe.com/docs/keys#safe-keys for more advice.';
const diagnosticMessageGit =
  'This Stripe API Key is in a file not ignored by git. For better security, consider using a .env file. See https://stripe.com/docs/keys#safe-keys for more advice.';

const diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection(
  'StripeHardCodedAPIKeys'
);

// isCommitRisk checks if a file is in the git working tree, which means that it's not gitignored and is a commit risk
// returns true if found in working tree, false if not.
const isCommitRisk = (documentUri: string): boolean => {
  const repos = gitAPI.repositories;
  const workingTreeChanges = repos[0].state.workingTreeChanges.map(
    (resource: Resource) => resource.uri.path
  );
  const commitRiskMatch = workingTreeChanges.includes(documentUri);

  return commitRiskMatch;
};

// should search file checks if a file is either a git commit risk, or if git is not being used, will check if it's not an .env file
// returns a boolean: true if we should search the file for API Keys, false if we should not search the file
export const shouldSearchFile = (currentFilename: string): boolean => {
  const isGitRepo = isUsingGitExtension && gitAPI.repositories.length;
  const ignoredFileMatches = ignoredFileList.filter(
    (ignoredFile) => currentFilename.search(ignoredFile) > -1
  );

  let shouldSearch = true;

  // if this file is gitignored then don't search it for hardcoded keys
  if (isGitRepo && !isCommitRisk(currentFilename)) { shouldSearch = false; }
  // if this file is in the ignoredFiles list (eg. .env) then don't search it for hardcoded keys
  if (ignoredFileMatches.length) { shouldSearch = false; }

  return shouldSearch;
};

// lookForHardCodedAPIKeys is the main exported function that is run each time we want to see if
// a user has hardcoded Stripe API Keys in an 'at risk' file
// an 'at risk' file is a file that could end up in source control commits or accidentally copy+pasted somewhere unsafe
// the function will draw squiggly lines with hover tooltips for each hardcoded key in the currently open file
// these warnings / errors also show up in the "Problems" tab in the VS Code integrated Terminal panel.

export class StripeLinter {
  telemetry: Telemetry;
  git: Git;

  constructor(telemetry: Telemetry, git: Git) {
    this.telemetry = telemetry;
    this.git = git;
  }

  async activate() {
    if (window.activeTextEditor) {
      await this.lookForHardCodedAPIKeys(window.activeTextEditor.document);
    }
    workspace.onDidSaveTextDocument(this.lookForHardCodedAPIKeys);
  }

  lookForHardCodedAPIKeys = async (document: TextDocument): Promise<void> => {
    const currentFilename = document.uri.path;
    if (!shouldSearchFile(currentFilename)) { return; }

    const text = document.getText();
    const lines = text.split('\n');

    const message = await this.git.isGitRepo(document.uri) ? diagnosticMessageGit : diagnosticMessageNoGit;

    // get each line's possible API key warnings
    // then flatten nested diagnostics into a flat array
    const fileDiagnostics: Diagnostic[] = lines
      .map(this.prepareLineDiagnostics(message))
      .reduce((acc, next) => acc.concat([...next]), []);

    // tell VS Code to show warnings and errors in syntax
    diagnosticCollection.set(document.uri, fileDiagnostics);
  };


  // prepareAPIKeyDiagnostics regex matches all instances of a Stripe API Key in a supplied line of text
  // will return a list of Diagnostics pointing at instances of the Stripe API Keys it found
  prepareLineDiagnostics = (message: string) => (line: string, index: number): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];

    let match;
    while ((match = stripeKeysRegex.exec(line)) !== null) {
      const severity = /sk_live/.test(match[0])
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning;

      // specify line and character range to draw the squiggly line under the API Key in the document
      const range = new Range(
        index,
        match.index,
        index,
        match.index + match[0].length
      );
      // create new diagnostic and add to the list of total diagnostics for this line of code
      const diagnostic = new Diagnostic(range, message, severity);

      this.telemetry.sendEvent('diagnostics.show', severity);
      diagnostics.push(diagnostic);
    }

    return diagnostics;
  };
}
