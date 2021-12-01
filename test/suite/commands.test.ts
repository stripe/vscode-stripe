import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as sinon from 'sinon';
import * as stripeState from '../../src/stripeWorkspaceState';
import * as vscode from 'vscode';

import {EventsResendRequest, EventsResendResponse} from '../../src/rpc/events_resend_pb';
import {LoginRequest, LoginResponse} from '../../src/rpc/login_pb';
import {LoginStatusRequest, LoginStatusResponse} from '../../src/rpc/login_status_pb';
import {TriggerRequest, TriggerResponse} from '../../src/rpc/trigger_pb';
import {TriggersListRequest, TriggersListResponse} from '../../src/rpc/triggers_list_pb';
import {Commands} from '../../src/commands';
import {NoOpTelemetry} from '../../src/telemetry';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeDaemon} from '../daemon/stripeDaemon';
import {StripeEvent} from '../../src/rpc/common_pb';
import {StripeTreeItem} from '../../src/stripeTreeItem';
import {SurveyPrompt} from '../../src/surveyPrompt';
import {mocks} from '../mocks/vscode';

const proxyquire = require('proxyquire');
const modulePath = '../../src/commands';
const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

suite('commands', function () {
  this.timeout(20000);

  let sandbox: sinon.SinonSandbox;
  let extensionContext: vscode.ExtensionContext;

  const terminal = <any>{
    execute: (command: any, args: Array<string>) => {},
  };

  const telemetry = new NoOpTelemetry();

  const stripeDaemon = <Partial<StripeDaemon>>{
    setupClient: () => {},
    restartDaemon: () => {},
  };

  const supportedEvents = ['a'];
  const daemonClient = <Partial<StripeCLIClient>>{
    eventsResend: (
      req: EventsResendRequest,
      callback: (error: grpc.ServiceError | null, res: EventsResendResponse) => void,
    ) => {
      callback(null, new EventsResendResponse());
    },
    login: (
      req: LoginRequest,
      callback: (error: grpc.ServiceError | null, res: LoginResponse) => void,
    ) => {
      callback(null, new LoginResponse());
    },
    loginStatus: (
      req: LoginStatusRequest,
      callback: (error: grpc.ServiceError | null, res: LoginStatusResponse) => void,
    ) => {
      callback(null, new LoginStatusResponse());
    },
    triggersList: (
      req: TriggersListRequest,
      callback: (error: grpc.ServiceError | null, res: TriggersListResponse) => void,
    ) => {
      callback(null, new TriggersListResponse());
    },
    trigger: (
      req: TriggerRequest,
      callback: (error: grpc.ServiceError | null, res: TriggerResponse) => void,
    ) => {
      callback(null, new TriggerResponse());
    },
  };

  setup(() => {
    sandbox = sinon.createSandbox();
    extensionContext = {...mocks.extensionContextMock};
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('startLogin', () => {
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
    });

    test('login success', async () => {
      const informationSpy = sandbox.spy(vscode.window, 'showInformationMessage');
      const restartStub = sandbox.stub(stripeDaemon, 'restartDaemon');

      sandbox
        .stub(daemonClient, 'loginStatus')
        .value(
          (
            req: LoginStatusRequest,
            callback: (error: grpc.ServiceError | null, res: LoginStatusResponse) => void,
          ) => {
            callback(null, new LoginStatusResponse());
          },
        );

      sandbox
        .stub(daemonClient, 'login')
        .value(
          (
            req: LoginRequest,
            callback: (error: grpc.ServiceError | null, res: LoginResponse) => void,
          ) => {
            callback(null, new LoginResponse());
          },
        );

      const commands = new Commands(telemetry, terminal, extensionContext);

      await commands.confirmLogin(<any>stripeDaemon);

      // assert restart daemon was called
      assert.strictEqual(restartStub.calledOnce, true);
      // asswer shows success message
      assert.deepStrictEqual(informationSpy.args[0], [
        'Successfully logged into your Stripe Account!',
      ]);
    });

    test('shows error when login request fails.', async () => {
      const errorSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const err: Partial<grpc.ServiceError> = {
        code: grpc.status.UNKNOWN,
        details: 'An unknown error occurred',
      };

      sandbox
        .stub(daemonClient, 'login')
        .value(
          (
            req: LoginRequest,
            callback: (error: grpc.ServiceError | null, res: LoginResponse) => void,
          ) => {
            callback(<any>err, new LoginResponse());
          },
        );

      const commands = new Commands(telemetry, terminal, extensionContext);
      await commands.startLogin(<any>stripeDaemon);

      // assert information message
      assert.deepStrictEqual(errorSpy.args[0], [`Failed to login. ${err.details}`]);
    });

    test('shows error when login confirmation fails', async () => {
      const errorSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const err: Partial<grpc.ServiceError> = {
        code: grpc.status.UNKNOWN,
        details: 'An unknown error occurred',
      };

      sandbox
        .stub(daemonClient, 'loginStatus')
        .value(
          (
            req: LoginStatusRequest,
            callback: (error: grpc.ServiceError | null, res: LoginStatusResponse) => void,
          ) => {
            callback(<any>err, new LoginStatusResponse());
          },
        );

      const commands = new Commands(telemetry, terminal, extensionContext);
      await commands.confirmLogin(<any>stripeDaemon);

      // assert information message
      assert.deepStrictEqual(errorSpy.args[0], [`Failed to login. ${err.details}`]);
    });
  });

  suite('getSupportedEventsList', () => {
    let stripeOutputChannel: Partial<vscode.OutputChannel>;

    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
      stripeOutputChannel = {appendLine: (value: string) => {}, show: () => {}};
    });

    test('uses fallback events list if fails to retrieve list through grpc', async () => {
      const err: Partial<grpc.ServiceError> = {
        code: grpc.status.UNKNOWN,
        details: 'An unknown error occurred',
      };

      sandbox
        .stub(daemonClient, 'triggersList')
        .value(
          (
            req: TriggersListRequest,
            callback: (error: grpc.ServiceError | null, res: TriggersListResponse) => void,
          ) => {
            callback(<any>err, new TriggersListResponse());
          },
        );

      const fallbackEventsList = ['fall', 'back', 'list'];
      const commands = new Commands(telemetry, terminal, extensionContext, fallbackEventsList);
      const eventsList = await commands.getSupportedEventsList(
        <any>daemonClient,
        <any>stripeOutputChannel,
      );
      assert.deepStrictEqual(eventsList, fallbackEventsList);
    });
  });

  suite('openTriggerEvent', () => {
    let stripeOutputChannel: Partial<vscode.OutputChannel>;

    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
      stripeOutputChannel = {appendLine: (value: string) => {}, show: () => {}};

      const mockTriggerResponse = new TriggerResponse();
      mockTriggerResponse.setRequestsList(['fixture_1', 'fixture_2']);
      sandbox
        .stub(daemonClient, 'trigger')
        .value(
          (
            req: TriggerRequest,
            callback: (error: grpc.ServiceError | null, res: TriggerResponse) => void,
          ) => {
            callback(null, mockTriggerResponse);
          },
        );
    });

    test('executes and records event', async () => {
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');
      const mockTriggerListResp = new TriggersListResponse();
      mockTriggerListResp.setEventsList(supportedEvents);

      sandbox
        .stub(daemonClient, 'triggersList')
        .value(
          (
            req: TriggersListRequest,
            callback: (error: grpc.ServiceError | null, res: TriggersListResponse) => void,
          ) => {
            callback(null, mockTriggerListResp);
          },
        );

      const commands = new Commands(telemetry, terminal, extensionContext);
      commands.openTriggerEvent(extensionContext, <any>stripeDaemon, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      const eventsInState = stripeState.getRecentEvents(extensionContext);

      assert.deepStrictEqual(telemetrySpy.args[0], ['openTriggerEvent']);
      assert.deepStrictEqual(eventsInState, supportedEvents);
    });

    test('writes stripe trigger output to output channel', async () => {
      const appendSpy = sinon.spy(stripeOutputChannel, 'appendLine');
      const mockResp = new TriggersListResponse();
      mockResp.setEventsList(supportedEvents);

      sandbox
        .stub(daemonClient, 'triggersList')
        .value(
          (
            req: TriggersListRequest,
            callback: (error: grpc.ServiceError | null, res: TriggersListResponse) => void,
          ) => {
            callback(null, mockResp);
          },
        );

      const commands = new Commands(telemetry, terminal, extensionContext);
      commands.openTriggerEvent(extensionContext, <any>stripeDaemon, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      assert.deepStrictEqual(appendSpy.args[0], ['Triggering event a...']);
      assert.deepStrictEqual(appendSpy.args[1], ['Ran fixture: fixture_1']);
      assert.deepStrictEqual(appendSpy.args[2], ['Ran fixture: fixture_2']);
      assert.deepStrictEqual(appendSpy.args[3], [
        'Trigger succeeded! Check dashboard for event details.',
      ]);
    });
  });

  suite('buildTriggerEventsList', () => {
    test('returns all original events when no recent events', () => {
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns([]);
      const commands = new Commands(telemetry, terminal, extensionContext);
      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, supportedEvents);
    });

    test('returns recent events on top', () => {
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns(['c']);
      const commands = new Commands(telemetry, terminal, extensionContext);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });

    test('does not include events that are not supported', () => {
      const getEventsStub = sandbox
        .stub(stripeState, 'getRecentEvents')
        .returns(['c', 'unsupported']);
      const commands = new Commands(telemetry, terminal, extensionContext);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);
      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });
  });

  suite('openSurvey', () => {
    test('openSurvey saves survey prompt settings', () => {
      sandbox.stub(vscode.env, 'openExternal');
      // stub out osName
      const osName = sandbox.stub().returns('testOS');
      const module = setupProxies({'os-name': osName});

      const surveyPrompt = new SurveyPrompt(extensionContext);
      const promptSpy = sandbox.spy(surveyPrompt, 'updateSurveySettings');
      const commands = new module.Commands(telemetry, terminal, extensionContext);
      commands.openSurvey(surveyPrompt);

      assert.strictEqual(promptSpy.calledOnce, true);
    });
  });

  suite('resendTriggerEvent', () => {
    let stripeOutputChannel: Partial<vscode.OutputChannel>;
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
      stripeOutputChannel = {appendLine: (value: string) => {}, show: () => {}};
    });

    test('resends event and displays output', async () => {
      const appendSpy = sinon.spy(stripeOutputChannel, 'appendLine');
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      // Mock event response
      const eventId = 'evt_123';
      const stripeEvent = new StripeEvent();
      stripeEvent.setType('balance.available');
      stripeEvent.setId(eventId);

      const mockResendResponse = new EventsResendResponse();
      mockResendResponse.setStripeEvent(stripeEvent);
      sandbox
        .stub(daemonClient, 'eventsResend')
        .value(
          (
            req: EventsResendRequest,
            callback: (error: grpc.ServiceError | null, res: EventsResendResponse) => void,
          ) => {
            callback(null, mockResendResponse);
          },
        );

      // Create treeItem
      const treeItem = new StripeTreeItem('label');
      treeItem.metadata = {id: eventId};

      const commands = new Commands(telemetry, terminal, extensionContext);
      await commands.resendEvent(treeItem, <any>stripeDaemon, <any>stripeOutputChannel);

      assert.deepStrictEqual(telemetrySpy.args[0], ['resendEvent']);
      assert.deepStrictEqual(appendSpy.args[0], [`Resending Event: ${eventId}...`]);

      const reponseObject = JSON.parse(appendSpy.args[1][0]);
      assert.deepStrictEqual(reponseObject.id, eventId);
    });

    test('outputs error and records if no event is returned from server', async () => {
      const appendSpy = sinon.spy(stripeOutputChannel, 'appendLine');
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const mockResendResponse = new EventsResendResponse();
      sandbox
        .stub(daemonClient, 'eventsResend')
        .value(
          (
            req: EventsResendRequest,
            callback: (error: grpc.ServiceError | null, res: EventsResendResponse) => void,
          ) => {
            callback(null, mockResendResponse);
          },
        );

      // Create treeItem
      const treeItem = new StripeTreeItem('label');
      treeItem.metadata = {id: '1223'};

      const commands = new Commands(telemetry, terminal, extensionContext);
      await commands.resendEvent(treeItem, <any>stripeDaemon, <any>stripeOutputChannel);

      assert.deepStrictEqual(telemetrySpy.args[0], ['resendEvent']);
      assert.deepStrictEqual(telemetrySpy.args[1], ['noResponseFromResendEvent']);

      assert.deepStrictEqual(appendSpy.args[1], ['Error: Did not get event back from server.']);
    });

    test('surfaces error from server', async () => {
      const windowSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const errorMessage = 'Something went wrong';
      const error = <grpc.ServiceError>{details: errorMessage};

      sandbox
        .stub(daemonClient, 'eventsResend')
        .value(
          (
            req: EventsResendRequest,
            callback: (error: grpc.ServiceError | null, res: EventsResendResponse) => void,
          ) => {
            callback(error, new EventsResendResponse());
          },
        );

      const treeItem = new StripeTreeItem('label');
      treeItem.metadata = {id: '1234'};

      const commands = new Commands(telemetry, terminal, extensionContext);
      await commands.resendEvent(treeItem, <any>stripeDaemon, <any>stripeOutputChannel);

      assert.deepStrictEqual(windowSpy.args[0], [`Failed to resend event: 1234. ${errorMessage}`]);
    });
  });

  suite('openTriggerCustomizedEvent', () => {
    let stripeOutputChannel: Partial<vscode.OutputChannel>;

    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
      stripeOutputChannel = {appendLine: (value: string) => {}, show: () => {}};

      const mockTriggerResponse = new TriggerResponse();
      mockTriggerResponse.setRequestsList(['fixture_1', 'fixture_2']);
      sandbox
        .stub(daemonClient, 'trigger')
        .value(
          (
            req: TriggerRequest,
            callback: (error: grpc.ServiceError | null, res: TriggerResponse) => void,
          ) => {
            callback(null, mockTriggerResponse);
          },
        );
    });

    test('executes customized event', () => {
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const infoMessage: any = 'Open and execute saved fixture'; // type any is to allow `showInformationMessage` stubbing
      sandbox.stub(vscode.window, 'showInformationMessage').resolves(infoMessage);
      sandbox
        .stub(vscode.window, 'showOpenDialog')
        .resolves([vscode.Uri.file('/path/fixture.json')]);
      sandbox.stub(vscode.workspace, 'openTextDocument').resolves();
      sandbox.stub(vscode.window, 'showTextDocument').resolves();

      const commands = new Commands(telemetry, terminal, extensionContext);
      commands.openTriggerCustomizedEvent(<any>stripeDaemon, <any>stripeOutputChannel);

      assert.deepStrictEqual(telemetrySpy.args[0], ['openTriggerCustomizedEvent']);
    });
  });
});
