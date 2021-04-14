import * as assert from 'assert';

import * as vscode from 'vscode';
import {GATelemetry, StripeAnalyticsServiceTelemetry} from '../../src/telemetry';
import {mocks} from '../mocks/vscode';
import sinon from 'ts-sinon';

const proxyquire = require('proxyquire');
const https = require('https');

const modulePath = '../../src/telemetry';
const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

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

suite('Telemetry', () => {
  let sandbox: sinon.SinonSandbox;
  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('StripeAnalyticsServiceTelemetry', () => {
    const extensionContext = {...mocks.extensionContextMock};

    test('Respects overall and Stripe-specific telemetry configs', async () => {
      const telemetry = new StripeAnalyticsServiceTelemetry(extensionContext);

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

    test('sendEvent respects user telemetry settings', () => {
      const areAllTelemetryConfigsEnabled = sinon.stub().returns(false);
      const module = setupProxies({areAllTelemetryConfigsEnabled});
      const httpStub = sandbox.spy(https, 'request');

      const telemetry = new module.StripeAnalyticsServiceTelemetry(extensionContext);
      telemetry.sendEvent('hello');
      assert.strictEqual(httpStub.callCount, 0);
    });
  });
});
