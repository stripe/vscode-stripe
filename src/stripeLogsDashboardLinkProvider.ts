import * as vscode from 'vscode';
import {LOG_ID_REGEXP} from './resourceIDs';

export class StripeLogsDashboardLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const text = document.getText();
    const lines = text.split('\n');
    const documentLinks: vscode.DocumentLink[] = lines.reduce(linesToLinksReducer, []);
    return documentLinks;
  }
}

const linesToLinksReducer = (
  links: vscode.DocumentLink[],
  currentLine: string,
  currentLineIndex: number, // the line number, but 0-based instead of 1-based
): vscode.DocumentLink[] => {
  const match = LOG_ID_REGEXP.exec(currentLine);

  if (match) {
    const startPosition = new vscode.Position(currentLineIndex, match.index);
    const endPosition = new vscode.Position(currentLineIndex, match.index + match[0].length);
    const range = new vscode.Range(startPosition, endPosition);

    const target = vscode.Uri.parse(`https://dashboard.stripe.com/test/logs/${match[0]}`);

    const link = new vscode.DocumentLink(range, target);
    link.tooltip = 'Open log in Dashboard';

    links.push(link);
  }

  return links;
};
