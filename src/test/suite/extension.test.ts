import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test("Should start extension vscode-stripe", () => {
    const started = vscode.extensions.getExtension(
      "stripe.vscode-stripe",
    );
    assert.notStrictEqual(started, undefined);
    assert.strictEqual(started && started.isActive, true);
  });
});
