import * as assert from 'assert';

import * as vscode from 'vscode';
import {StripeAnalyticsServiceTelemetry} from '../../src/telemetry';
import {mocks} from '../mocks/vscode';
import sinon from 'ts-sinon';

const https = require('https');
const proxyquire = require('proxyquire');
const modulePath = '../../src/telemetry';

const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

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

    test('Respects overall and Stripe-specific telemetry configs', async () => {
      const getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
      await Promise.all(
        [
          [false, false, false],
          [false, true, false],
          [true, false, false],
          [true, true, true],
        ].map(([telemetryEnabled, stripeTelemetryEnabled, expected]) => {
          const vscodeStub = {
            env: <any>{
              isTelemetryEnabled: telemetryEnabled,
            },
          };
          const module = setupProxies({vscode: vscodeStub});
          getConfigurationStub.withArgs('stripe.telemetry').returns(<any>{
            get: sandbox.stub().withArgs('enabled').returns(stripeTelemetryEnabled),
          });

          const telemetry = new module.StripeAnalyticsServiceTelemetry(extensionContext);

          assert.strictEqual(telemetry.isTelemetryEnabled(), expected);
        }),
      );
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
