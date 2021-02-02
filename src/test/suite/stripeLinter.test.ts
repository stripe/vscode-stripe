
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as stripeLinter from '../../stripeLinter';
import * as vscode from 'vscode';
import {Git} from '../../git';
import {NoOpTelemetry} from '../../telemetry';

suite('StripeLinter', () => {
  let sandbox: sinon.SinonSandbox;
  const telemetry = new NoOpTelemetry();
  const git = new Git();

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('lookForHardCodedAPIKeys', () => {

    test('Editor content is not searched when shoudSearchFile returns false', async() => {
      const options = {content: 'I have content with critical data : sk_live_1234'};
      await vscode.workspace.openTextDocument(options)
        .then((doc) => vscode.window.showTextDocument(doc, {preview: false}));

      const shouldSearchStub = sandbox.stub(stripeLinter, 'shouldSearchFile').returns(false);
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const linter = new stripeLinter.StripeLinter(telemetry, git);
      await linter.activate();

      const diagnostics = vscode.languages.getDiagnostics();
      assert.strictEqual(shouldSearchStub.calledOnce, true);
      assert.strictEqual(telemetrySpy.callCount, 0);
      assert.strictEqual(diagnostics.length, 0);
    });

    test('Diagnostics are pushed when linter finds offenses', async() => {
      const options = {content: 'I have content with critical data : sk_live_1234'};
      const document = await vscode.workspace.openTextDocument(options);
      await vscode.window.showTextDocument(document, {preview: false});

      const shouldSearchStub = sandbox.stub(stripeLinter, 'shouldSearchFile').returns(true);
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const linter = new stripeLinter.StripeLinter(telemetry, git);
      await linter.activate();
      const diagnostics: vscode.Diagnostic[] = vscode.languages.getDiagnostics(document.uri);

      assert.strictEqual(shouldSearchStub.calledOnce, true);
      assert.strictEqual(telemetrySpy.calledOnce, true);
      assert.deepStrictEqual(telemetrySpy.args[0], ['diagnostics.show', vscode.DiagnosticSeverity.Error]);
      assert.strictEqual(diagnostics.length, 1);
    });

    test('No diagnostics are pushed when file is clean', async() => {
      const options = {content: 'I am a good file'};
      const document = await vscode.workspace.openTextDocument(options);
      await vscode.window.showTextDocument(document, {preview: false});

      const shouldSearchStub = sandbox.stub(stripeLinter, 'shouldSearchFile').returns(true);
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const linter = new stripeLinter.StripeLinter(telemetry, git);
      await linter.activate();
      const diagnostics: vscode.Diagnostic[] = vscode.languages.getDiagnostics(document.uri);

      assert.strictEqual(shouldSearchStub.calledOnce, true);
      assert.strictEqual(telemetrySpy.callCount, 0);
      assert.strictEqual(diagnostics.length, 0);
    });
  });
});
