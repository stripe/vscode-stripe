import * as assert from 'assert';
import * as sinon from 'sinon';
import * as stripeState from '../../src/stripeWorkspaceState';
import * as vscode from 'vscode';

import {EventEmitter, Readable} from 'stream';
import {Commands} from '../../src/commands';
import {NoOpTelemetry} from '../../src/telemetry';
import {StripeClient} from '../../src/stripeClient';
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
    let stripeClient: Partial<StripeClient>;

    setup(() => {
      stripeOutputChannel = {append: (value: string) => {}, show: () => {}};

      triggerProcess = <childProcess.ChildProcess>new EventEmitter();
      triggerProcess.stdout = <Readable>new EventEmitter();

      stripeClient = {getOrCreateCLIProcess: () => Promise.resolve(triggerProcess)};
    });

    test('executes and records event', async () => {
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const supportedEvents = ['a'];
      const commands = new Commands(telemetry, terminal, extensionContext, supportedEvents);

      commands.openTriggerEvent(extensionContext, <any>stripeClient, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      const eventsInState = stripeState.getRecentEvents(extensionContext);

      assert.deepStrictEqual(telemetrySpy.args[0], ['openTriggerEvent']);
      assert.deepStrictEqual(eventsInState, ['a']);
    });

    test('writes stripe trigger output to output channel', async () => {
      const appendSpy = sinon.spy(stripeOutputChannel, 'append');

      const supportedEvents = ['a'];
      const commands = new Commands(telemetry, terminal, extensionContext, supportedEvents);

      commands.openTriggerEvent(extensionContext, <any>stripeClient, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Simulate output from `stripe trigger <event>`
      triggerProcess.stdout.emit('data', 'some output from stripe trigger');

      assert.deepStrictEqual(appendSpy.args[0], ['some output from stripe trigger']);
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
