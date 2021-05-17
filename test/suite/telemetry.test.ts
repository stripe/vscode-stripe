import * as assert from 'assert';

import * as vscode from 'vscode';
import {StripeAnalyticsServiceTelemetry} from '../../src/telemetry';
import {mocks} from '../mocks/vscode';
import sinon from 'ts-sinon';

const https = require('https');

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

    test('Respects overall and Stripe-specific telemetry configs', () => {
      const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');

      [
        [false, false, false],
        [false, true, false],
        [true, false, false],
        [true, true, true],
      ].forEach(async ([telemetryEnabled, stripeTelemetryEnabled, expected]) => {
        getConfigurationStub.withArgs('telemetry').returns(<any>{
          get: sandbox.stub().withArgs('telemetryEnabled').returns(telemetryEnabled),
        });
        getConfigurationStub
          .withArgs('stripe.telemetry')
          .returns(<any>{get: sandbox.stub().withArgs('enabled').returns(stripeTelemetryEnabled)});

        // Simulate a config change
        await vscode.workspace.getConfiguration('telemetry').update('stripe', undefined);
        const telemetry = new StripeAnalyticsServiceTelemetry(extensionContext);

        assert.strictEqual(telemetry.isTelemetryEnabled(), expected);
      });
    });

    test('sendEvent respects user telemetry settings', () => {
      const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
      getConfigurationStub.withArgs('stripe.telemetry').returns(<any>{
        get: sandbox.stub().withArgs('enabled').returns(false),
      });
      getConfigurationStub.withArgs('telemetry').returns(<any>{
        get: sandbox.stub().withArgs('enableTelemetry').returns(true),
      });

      const httpStub = sandbox.spy(https, 'request');

      const telemetry = new StripeAnalyticsServiceTelemetry(extensionContext);
      telemetry.sendEvent('hello');
      assert.strictEqual(httpStub.callCount, 0);
    });
  });
});
