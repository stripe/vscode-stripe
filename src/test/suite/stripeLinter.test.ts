import * as assert from 'assert';
import * as vscode from 'vscode';
import {StripeLinter} from '../../stripeLinter';
import {sleep} from '../helpers';

suite('stripeLinter', function() {
  this.timeout(20000);

  test('lints API keys on file open', async () => {
    const stripeLinter = new StripeLinter();
    stripeLinter.activate();

    const uris = await vscode.workspace.findFiles('apiKey.ts');
    const uri = uris[0];
    await vscode.window.showTextDocument(uri);
    await sleep(2000); // wait for diagnostics to appear

    const diagnostics = vscode.languages.getDiagnostics(uri);
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, 'This Stripe API Key is in a file not ignored by git. For better security, consider using a .env file. See https://stripe.com/docs/keys#safe-keys for more advice.');
  });

  test('lints API keys on file change', async () => {
    const stripeLinter = new StripeLinter();
    stripeLinter.activate();

    const uris = await vscode.workspace.findFiles('apiKey.ts');
    const uri = uris[0];

    await vscode.window.showTextDocument(uri);
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      await editor.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(1, 0),
          'const apiKey2 = \'sk_live_000000\';',
        );
      });
    }

    await sleep(2000); // wait for diagnostics to appear

    const diagnostics = vscode.languages.getDiagnostics(uri);
    assert.strictEqual(diagnostics.length, 2);
    assert.strictEqual(diagnostics[1].message, 'This Stripe API Key is in a file not ignored by git. For better security, consider using a .env file. See https://stripe.com/docs/keys#safe-keys for more advice.');
  });
});
