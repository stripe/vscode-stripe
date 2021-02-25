import {
  HoverParams,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver';
import {getLangUrlParamFromLanguageId, getStripeApiReferenceUrl} from './utils';
import {TextDocument} from 'vscode-languageserver-textdocument';
import {stripeMethodList} from './patterns';

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasWorkspaceFolderCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings

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
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const text = document.getText();
  const line = text.split('\n')[params.position.line];
  const hoverPosition = params.position.character;

  const hoverMatches: string[] = [];
  let hasMatch = false;

  // run through all possible stripe method calls and try to match at least one on this hovered line of code
  for (let i = 0; i < stripeMethodList.length; i++) {
    let match;
    const stripeMethod = stripeMethodList[i];

    const language = getLangUrlParamFromLanguageId(document.languageId);

    if (!language) {
      // unsupported language
      return [];
    }

    const pattern = stripeMethod.regexps[language];
    if (!pattern) {
      return [];
    }
    const regexp = new RegExp(pattern, 'g');

    // in almost all cases there'll only be one match, but we might want to stack matches in the future
    while ((match = regexp.exec(line)) !== null) {
      hasMatch = true;

      const [methodMatch, methodPositionStart] = [match[0], match.index];
      const methodPositionEnd = methodPositionStart + methodMatch.length;

      // are any stripe method calls on this line being hovered over?
      // check for where the stripe method call is and see if the hover position is within that character range
      if (hoverPosition >= methodPositionStart && hoverPosition <= methodPositionEnd) {
        hoverMatches.push(
          `See this method in the [Stripe API Reference](${getStripeApiReferenceUrl(
            stripeMethod,
            document.languageId,
          )})`,
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
  return {contents: matches};
});

documents.listen(connection);
connection.listen();
