import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as sinon from 'sinon';
import * as stripeState from '../../src/stripeWorkspaceState';
import * as vscode from 'vscode';

import {EventEmitter, Readable} from 'stream';
import {TriggerRequest, TriggerResponse} from '../../src/rpc/trigger_pb';
import {TriggersListRequest, TriggersListResponse} from '../../src/rpc/triggers_list_pb';
import {Commands} from '../../src/commands';
import {NoOpTelemetry} from '../../src/telemetry';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeDaemon} from '../daemon/stripeDaemon';
import {SurveyPrompt} from '../../src/surveyPrompt';
import childProcess from 'child_process';
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
  };

  const supportedEvents = ['a'];
  const daemonClient = <Partial<StripeCLIClient>>{
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

  suite('openTriggerEvent', () => {
    let stripeOutputChannel: Partial<vscode.OutputChannel>;
    let triggerProcess: childProcess.ChildProcess;

    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
      stripeOutputChannel = {append: (value: string) => {}, show: () => {}};

      triggerProcess = <childProcess.ChildProcess>new EventEmitter();
      triggerProcess.stdout = <Readable>new EventEmitter();

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

    test('uses fallback events list if fails to retrieve list through grpc', async () => {
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');
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
      commands.openTriggerEvent(extensionContext, <any>stripeDaemon, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      const eventsInState = stripeState.getRecentEvents(extensionContext);

      assert.deepStrictEqual(telemetrySpy.args[0], ['openTriggerEvent']);
      assert.deepStrictEqual(eventsInState[0], 'fall');
    });

    test('writes stripe trigger output to output channel', async () => {
      const appendSpy = sinon.spy(stripeOutputChannel, 'append');
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

      assert.deepStrictEqual(appendSpy.args[0], ['Triggering event a...\n']);
      assert.deepStrictEqual(appendSpy.args[1], ['Ran fixture: fixture_1\n']);
      assert.deepStrictEqual(appendSpy.args[2], ['Ran fixture: fixture_2\n']);
      assert.deepStrictEqual(appendSpy.args[3], [
        'Trigger succeeded! Check dashboard for event details.\n',
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
});
