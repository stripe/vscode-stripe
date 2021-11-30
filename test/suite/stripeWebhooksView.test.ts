import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {
  WebhookEndpointsListRequest,
  WebhookEndpointsListResponse,
} from '../../src/rpc/webhook_endpoints_list_pb';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeDaemon} from '../../src/daemon/stripeDaemon';
import {StripeWebhooksViewProvider} from '../../src/stripeWebhooksView';

suite('stripeWebhooksView', () => {
  let sandbox: sinon.SinonSandbox;

  const stripeDaemon = <Partial<StripeDaemon>>{
    setupClient: () => {},
    restartDaemon: () => {},
  };

  const daemonClient = <Partial<StripeCLIClient>>{
    webhookEndpointsList: (
      req: WebhookEndpointsListRequest,
      callback: (error: grpc.ServiceError | null, res: WebhookEndpointsListResponse) => void,
    ) => {
      callback(null, new WebhookEndpointsListResponse());
    },
  };

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('refreshEndpoints', () => {
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
    });

    test('get all endpoints successfully', async () => {
      const stripeWebhooksView = new StripeWebhooksViewProvider(<any>stripeDaemon);

      const endpointData1 = new WebhookEndpointsListResponse.WebhookEndpointData();
      endpointData1.setUrl('http://endpoints1.com');
      const endpointData2 = new WebhookEndpointsListResponse.WebhookEndpointData();
      endpointData2.setUrl('http://endpoints2.com');

      const mockEndpointsResponse = new WebhookEndpointsListResponse();
      mockEndpointsResponse.setEndpointsList([endpointData1, endpointData2]);

      sandbox
        .stub(daemonClient, 'webhookEndpointsList')
        .value(
          (
            req: WebhookEndpointsListRequest,
            callback: (error: grpc.ServiceError | null, res: WebhookEndpointsListResponse) => void,
          ) => {
            callback(null, mockEndpointsResponse);
          },
        );

      await stripeWebhooksView.refreshEndpoints();
      const endpointItems = stripeWebhooksView.getEndpoints();

      assert.deepStrictEqual(endpointItems.length, 2);
    });

    test('failed to get endpoints', async () => {
        const stripeWebhooksView = new StripeWebhooksViewProvider(<any>stripeDaemon);
        const errorMessage = 'Something went wrong';
        const error = <grpc.ServiceError>{details: errorMessage};

        const errorSpy = sandbox.spy(vscode.window, 'showErrorMessage');

        sandbox
          .stub(daemonClient, 'webhookEndpointsList')
          .value(
            (
              req: WebhookEndpointsListRequest,
              callback: (error: grpc.ServiceError | null, res: WebhookEndpointsListResponse) => void,
            ) => {
              callback(error, new WebhookEndpointsListResponse());
            },
          );

        await stripeWebhooksView.refreshEndpoints();
        const endpointItems = stripeWebhooksView.getEndpoints();

        assert.deepStrictEqual(endpointItems.length, 0);
        assert.deepStrictEqual(errorSpy.calledWith(sinon.match(errorMessage)), true);
      });
  });
});
