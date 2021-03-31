import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Should start extension vscode-stripe', async () => {
    const started = vscode.extensions.getExtension('stripe.vscode-stripe');
    assert.notStrictEqual(started, undefined);
    if (started) {
      await started.activate();
    }
    assert.strictEqual(started && started.isActive, true);
  });
});
