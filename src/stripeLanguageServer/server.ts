import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  HoverParams,
} from "vscode-languageserver";

import { TextDocument } from "vscode-languageserver-textdocument";

import { stripeMethodList } from "./patterns";

let connection = createConnection(ProposedFeatures.all);

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );

  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Full,
      },
      hoverProvider: true,
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

function findHoverMatches(params: HoverParams): string[] {
  let document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const text = document.getText();
  const line = text.split("\n")[params.position.line];
  const hoverPosition = params.position.character;

  let hoverMatches: string[] = [];
  let hasMatch = false;

  // run through all possible stripe method calls and try to match at least one on this hovered line of code
  for (let i = 0; i < stripeMethodList.length; i++) {
    let match;
    const stripeMethod = stripeMethodList[i];

    const language =
      document.languageId === "typescript" ? "javascript" : document.languageId;

    const pattern = stripeMethod.regexps[language];
    if (!pattern) return [];
    const regexp = new RegExp(pattern, "g");

    // in almost all cases there'll only be one match, but we might want to stack matches in the future
    while ((match = regexp.exec(line)) !== null) {
      hasMatch = true;

      const [methodMatch, methodPositionStart] = [match[0], match.index];
      const methodPositionEnd = methodPositionStart + methodMatch.length;

      // are any stripe method calls on this line being hovered over?
      // check for where the stripe method call is and see if the hover position is within that character range
      if (
        hoverPosition >= methodPositionStart &&
        hoverPosition <= methodPositionEnd
      ) {
        hoverMatches.push(
          `See ${methodMatch} in the [Stripe API Reference](https://stripe.com/docs/api${stripeMethod.url})`
        );
        connection.telemetry.logEvent({name: 'ls.apihover', data: methodMatch});
      }
    }

    if (hasMatch) {
      break;
    }
  }

  return hoverMatches;
}

connection.onHover((params: HoverParams) => {
  const matches: string[] = findHoverMatches(params);
  return { contents: matches };
});

documents.listen(connection);
connection.listen();
