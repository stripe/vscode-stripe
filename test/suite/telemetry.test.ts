import * as assert from 'assert';

import * as vscode from 'vscode';
import {GATelemetry, StripeAnalyticsServiceTelemetry} from '../../src/telemetry';
import {mocks} from '../mocks/vscode';
import sinon from 'ts-sinon';

const https = require('https');

suite('GATelemetry', function () {
  this.timeout(20000);
  const telemetry = GATelemetry.getInstance();

  suite('Telemetry configs', () => {
    test('Respects overall and Stripe-specific telemetry configs', async () => {
      const workspaceFolder =
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
      const telemetryConfig = vscode.workspace.getConfiguration('telemetry', workspaceFolder);
      const stripeTelemetryConfig = vscode.workspace.getConfiguration(
        'stripe.telemetry',
        workspaceFolder,
      );

      await telemetryConfig.update('enableTelemetry', false);
      await stripeTelemetryConfig.update('enabled', false);
      assert.strictEqual(telemetry.isTelemetryEnabled(), false);

      await telemetryConfig.update('enableTelemetry', false);
      await stripeTelemetryConfig.update('enabled', true);
      assert.strictEqual(telemetry.isTelemetryEnabled(), false);

      await telemetryConfig.update('enableTelemetry', true);
      await stripeTelemetryConfig.update('enabled', false);
      assert.strictEqual(telemetry.isTelemetryEnabled(), false);

      await telemetryConfig.update('enableTelemetry', true);
      await stripeTelemetryConfig.update('enabled', true);
      assert.strictEqual(telemetry.isTelemetryEnabled(), true);
    });
  });
});

suite('Telemetry', function () {
  this.timeout(20000);

  let sandbox: sinon.SinonSandbox;
  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('StripeAnalyticsServiceTelemetry', () => {
    const extensionContext = {...mocks.extensionContextMock};
    const workspaceFolder =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    const telemetryConfig = vscode.workspace.getConfiguration('telemetry', workspaceFolder);
    const stripeTelemetryConfig = vscode.workspace.getConfiguration(
      'stripe.telemetry',
      workspaceFolder,
    );

    test('Respects overall and Stripe-specific telemetry configs', async () => {
      const telemetry = new StripeAnalyticsServiceTelemetry(extensionContext);

      await telemetryConfig.update('enableTelemetry', false);
      await stripeTelemetryConfig.update('enabled', false);
      assert.strictEqual(telemetry.isTelemetryEnabled(), false);

      await telemetryConfig.update('enableTelemetry', false);
      await stripeTelemetryConfig.update('enabled', true);
      assert.strictEqual(telemetry.isTelemetryEnabled(), false);

      await telemetryConfig.update('enableTelemetry', true);
      await stripeTelemetryConfig.update('enabled', false);
      assert.strictEqual(telemetry.isTelemetryEnabled(), false);

      await telemetryConfig.update('enableTelemetry', true);
      await stripeTelemetryConfig.update('enabled', true);
      assert.strictEqual(telemetry.isTelemetryEnabled(), true);
    });

    test('sendEvent respects user telemetry settings', async () => {
      await stripeTelemetryConfig.update('enabled', false);

      const httpStub = sandbox.spy(https, 'request');

      const telemetry = new StripeAnalyticsServiceTelemetry(extensionContext);
      telemetry.sendEvent('hello');
      assert.strictEqual(httpStub.callCount, 0);
    });
  });
});
