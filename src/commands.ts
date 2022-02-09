import * as grpc from '@grpc/grpc-js';
import * as querystring from 'querystring';
import * as vscode from 'vscode';
import {
  camelToSnakeCase,
  getExtensionInfo,
  openNewTextEditorWithContents,
  recursivelyRenameKeys,
  showQuickPickWithItems,
  validateFixtureEvent,
} from './utils';
import {
  getConnectWebhookEndpoint,
  getRecentEvents,
  getWebhookEndpoint,
  recordEvent,
  setConnectWebhookEndpoint,
  setWebhookEndpoint,
} from './stripeWorkspaceState';

import osName = require('os-name');
import {EventsResendRequest} from './rpc/events_resend_pb';
import {FixtureRequest} from './rpc/fixtures_pb';
import {LoginRequest} from './rpc/login_pb';
import {LoginStatusRequest} from './rpc/login_status_pb';
import {StripeCLIClient} from './rpc/commands_grpc_pb';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeEventsViewProvider} from './stripeEventsView';
import {StripeLogsViewProvider} from './stripeLogsView';
import {StripeSamples} from './stripeSamples';
import {StripeTerminal} from './stripeTerminal';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeWebhooksViewProvider} from './stripeWebhooksView';
import {SurveyPrompt} from './surveyPrompt';
import {Telemetry} from './telemetry';
import {TriggerRequest} from './rpc/trigger_pb';
import {TriggersListRequest} from './rpc/triggers_list_pb';
import {WebhookEndpointCreateRequest} from './rpc/webhook_endpoint_create_pb';

export class Commands {
  telemetry: Telemetry;
  terminal: StripeTerminal;
  context: vscode.ExtensionContext;

  supportedEvents: string[] = [
    'account.updated',
    'balance.available',
    'charge.captured',
    'charge.dispute.created',
    'charge.failed',
    'charge.refunded',
    'charge.succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.completed',
    'customer.created',
    'customer.deleted',
    'customer.source.created',
    'customer.source.updated',
    'customer.subscription.created',
    'customer.subscription.deleted',
    'customer.subscription.updated',
    'customer.updated',
    'invoice.created',
    'invoice.finalized',
    'invoice.payment_failed',
    'invoice.payment_succeeded',
    'invoice.updated',
    'issuing_authorization.request',
    'issuing_card.created',
    'issuing_cardholder.created',
    'payment_intent.amount_capturable_updated',
    'payment_intent.canceled',
    'payment_intent.created',
    'payment_intent.payment_failed',
    'payment_intent.succeeded',
    'payment_method.attached',
    'plan.created',
    'plan.deleted',
    'plan.updated',
    'product.created',
    'product.deleted',
    'product.updated',
    'setup_intent.canceled',
    'setup_intent.created',
    'setup_intent.setup_failed',
    'setup_intent.succeeded',
    'subscription_schedule.canceled',
    'subscription_schedule.created',
    'subscription_schedule.released',
    'subscription_schedule.updated',
  ];

  constructor(
    telemetry: Telemetry,
    terminal: StripeTerminal,
    context: vscode.ExtensionContext,
    supportedEvents?: string[],
  ) {
    this.telemetry = telemetry;
    this.terminal = terminal;
    this.context = context;
    if (supportedEvents) {
      this.supportedEvents = supportedEvents;
    }
  }

  getSupportedEventsList = async (
    daemonClient: StripeCLIClient,
    stripeOutputChannel: vscode.OutputChannel,
  ): Promise<string[]> => {
    const supportedTriggersList = await new Promise<string[]>((resolve, reject) => {
      daemonClient.triggersList(new TriggersListRequest(), (error: any, response: any) => {
        if (error) {
          stripeOutputChannel.appendLine(
            `Warning: Failed to retrieve supported triggered event list dynamically: ${error}`,
          );
          resolve(this.supportedEvents);
        } else if (response) {
          resolve(response.getEventsList());
        }
      });
    });

    return supportedTriggersList;
  };

  openWebhooksListen = async (options: any) => {
    this.telemetry.sendEvent('openWebhooksListen');

    const shouldPromptForURL = !options?.forwardTo && !options?.forwardConnectTo;

    const [forwardTo, forwardConnectTo] = await (async () => {
      if (!shouldPromptForURL) {
        return [options?.forwardTo, options?.forwardConnectTo];
      }

      const defaultForwardToURL = 'http://localhost:3000';

      const forwardToInput = await vscode.window.showInputBox({
        prompt:
          '[Account events] Enter local server URL to forward webhook events from your account',
        value: getWebhookEndpoint(this.context) || defaultForwardToURL,
      });
      const forwardConnectToInput = await vscode.window.showInputBox({
        prompt:
          '[Connect events] Enter local server URL to forward events from Connect applications (default: same URL as normal events)',
        value: getConnectWebhookEndpoint(this.context) || forwardToInput,
      });

      // save values for next invocation
      if (forwardToInput) {
        setWebhookEndpoint(this.context, forwardToInput);
      }
      if (forwardConnectToInput) {
        setConnectWebhookEndpoint(this.context, forwardConnectToInput);
      }

      return [forwardToInput, forwardConnectToInput];
    })();

    const invalidURLCharsRE = /[^\w-.~:\/?#\[\]@!$&'()*+,;=]/;
    const invalidURL = [forwardTo, forwardConnectTo].find((url) => invalidURLCharsRE.test(url));
    if (invalidURL) {
      await vscode.window.showErrorMessage(`Invalid URL: ${invalidURL}`);
      return;
    }

    // forwardTo and forwardConnectTo can be null if the user clicks away
    // and doesn't hit enter when clicking forward events to your local
    // machine
    if (forwardTo === undefined || forwardConnectTo === undefined) {
      return;
    }

    const skipVerify = await (async () => {
      if (options?.skipVerify !== undefined) {
        return options.skipVerify;
      }

      if (![forwardTo, forwardConnectTo].some((url) => url.startsWith('https'))) {
        return false;
      }

      const selected = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Skip SSL certificate verification?',
      });
      return selected === 'Yes';
    })();

    if (Array.isArray(options?.events)) {
      const invalidEventCharsRE = /[^a-z_.]/;
      const invalidEvent = options.events.find((e: string) => invalidEventCharsRE.test(e));
      if (invalidEvent) {
        await vscode.window.showErrorMessage(
          `Invalid chararacters found in event: ${invalidEvent}. For a list of all possible events, see https://stripe.com/docs/api/events/types.`,
        );
        return;
      }
    }
    const forwardToFlag = forwardTo ? ['--forward-to', forwardTo] : [];

    const forwardConnectToFlag = forwardConnectTo ? ['--forward-connect-to', forwardConnectTo] : [];

    const eventsFlag =
      Array.isArray(options?.events) && options.events.length > 0
        ? ['--events', options.events.join(',')]
        : [];

    const skipVerifyFlag = skipVerify ? ['--skip-verify'] : [];

    this.terminal.execute('listen', [
      ...forwardToFlag,
      ...forwardConnectToFlag,
      ...eventsFlag,
      ...skipVerifyFlag,
    ]);
  };

  startEventsStreaming = (stripeEventsViewProvider: StripeEventsViewProvider) => {
    this.telemetry.sendEvent('startEventsStreaming');
    stripeEventsViewProvider.startStreaming();
  };

  stopEventsStreaming = (stripeEventsViewProvider: StripeEventsViewProvider) => {
    this.telemetry.sendEvent('stopEventsStreaming');
    stripeEventsViewProvider.stopStreaming();
  };

  clearRecentEvents = (stripeEventsViewProvider: StripeEventsViewProvider) => {
    this.telemetry.sendEvent('clearRecentEvents');
    stripeEventsViewProvider.clearItems();
  };

  startLogsStreaming = (stripeLogsViewProvider: StripeLogsViewProvider) => {
    this.telemetry.sendEvent('startLogsStreaming');
    stripeLogsViewProvider.startStreaming();
  };

  stopLogsStreaming = (stripeLogsViewProvider: StripeLogsViewProvider) => {
    this.telemetry.sendEvent('stopLogsStreaming');
    stripeLogsViewProvider.stopStreaming();
  };

  clearRecentLogs = (stripeLogsViewProvider: StripeLogsViewProvider) => {
    this.telemetry.sendEvent('clearRecentLogs');
    stripeLogsViewProvider.clearItems();
  };

  startLogin = async (stripeDaemon: StripeDaemon) => {
    this.telemetry.sendEvent('login');
    const daemonClient = await stripeDaemon.setupClient();

    daemonClient.login(new LoginRequest(), async (error, response) => {
      if (error) {
        vscode.window.showErrorMessage(`Failed to login. ${error.details}`);
      } else if (response) {
        const pairingCode = response.getPairingCode();
        await vscode.window
          .showInformationMessage(
            `Your pairing code is ${pairingCode}. \n This pairing code verifies your authentication with Stripe.`,
            ...['Authenticate from Dashboard', 'Cancel'],
          )
          .then((option) => {
            if (option === 'Authenticate from Dashboard') {
              // Open Browser and switch view to wait for confirmation.
              vscode.env.openExternal(vscode.Uri.parse(response.getUrl()));
              vscode.window.withProgress(
                {
                  location: vscode.ProgressLocation.Notification,
                  title: `Your pairing code is ${pairingCode}. Waiting for confirmation...`,
                },
                () => this.confirmLogin(stripeDaemon),
              );
            }
          });
      }
    });
  };

  confirmLogin = async (stripeDaemon: StripeDaemon) => {
    const daemonClient = await stripeDaemon.setupClient();
    return new Promise<void>((resolve, reject) => {
      daemonClient.loginStatus(new LoginStatusRequest(), async (error, response) => {
        if (error) {
          vscode.window.showErrorMessage(`Failed to login. ${error.details}`);
          resolve();
        } else if (response) {
          // we need to restart the daemon to pick up new config changes.
          await stripeDaemon.restartDaemon();
          vscode.window.showInformationMessage('Successfully logged into your Stripe Account!');
          resolve();
        }
      });
    });
  };

  openCLI = () => {
    this.telemetry.sendEvent('openCLI');
    const terminal = vscode.window.createTerminal('Stripe');
    terminal.sendText('stripe ', false);
    terminal.show();
  };

  openDashboardApikeys = () => {
    this.telemetry.sendEvent('openDashboardApikeys');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/apikeys'));
  };

  openDashboardEvent = (stripeTreeItem: StripeTreeItem) => {
    this.telemetry.sendEvent('openDashboardEvent');
    vscode.env.openExternal(
      vscode.Uri.parse(`https://dashboard.stripe.com/test/events/${stripeTreeItem.metadata.id}`),
    );
  };

  openDashboardEvents = () => {
    this.telemetry.sendEvent('openDashboardEvents');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/events'));
  };

  openDashboardLog = (stripeTreeItem: StripeTreeItem) => {
    this.telemetry.sendEvent('openDashboardLog');
    vscode.env.openExternal(
      vscode.Uri.parse(`https://dashboard.stripe.com/test/logs/${stripeTreeItem.metadata.id}`),
    );
  };

  openDashboardLogs = () => {
    this.telemetry.sendEvent('openDashboardLogs');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/logs'));
  };

  openDashboardWebhooks = () => {
    this.telemetry.sendEvent('openDashboardWebhooks');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/webhooks'));
  };

  openSamples = () => {
    this.telemetry.sendEvent('openSamples');
    vscode.env.openExternal(vscode.Uri.parse('https://github.com/stripe-samples'));
  };

  openEventDetails = (data: any) => {
    this.telemetry.sendEvent('openEventDetails');
    const {id, type} = data;
    const filename = `${type} (${id})`;
    const uri = vscode.Uri.parse(`stripeEvent:${filename}`);
    vscode.workspace
      .openTextDocument(uri)
      .then((doc) => vscode.languages.setTextDocumentLanguage(doc, 'json'))
      .then((doc) => vscode.window.showTextDocument(doc, {preview: false}));
  };

  openLogDetails = (data: any) => {
    this.telemetry.sendEvent('openLogDetails');
    const {id} = data;
    const filename = id;
    const uri = vscode.Uri.parse(`stripeLog:${filename}`);
    vscode.workspace
      .openTextDocument(uri)
      .then((doc) => vscode.languages.setTextDocumentLanguage(doc, 'json'))
      .then((doc) => vscode.window.showTextDocument(doc, {preview: false}));
  };

  openTriggerEvent = async (
    extensionContext: vscode.ExtensionContext,
    stripeDaemon: StripeDaemon,
    stripeOutputChannel: vscode.OutputChannel,
  ) => {
    this.telemetry.sendEvent('openTriggerEvent');
    const daemonClient = await stripeDaemon.setupClient();

    const supportedTriggersList = await this.getSupportedEventsList(
      daemonClient,
      stripeOutputChannel,
    );
    const events = this.buildTriggerEventsList(supportedTriggersList, extensionContext);
    const eventName = await showQuickPickWithItems('Enter event name to trigger', events);

    if (eventName) {
      stripeOutputChannel.show();
      stripeOutputChannel.appendLine(`Triggering event ${eventName}...`);

      const triggerRequest = new TriggerRequest();
      triggerRequest.setEvent(eventName);
      daemonClient.trigger(triggerRequest, (error, response) => {
        if (error) {
          vscode.window.showErrorMessage(`Failed to trigger event: ${eventName}. ${error.details}`);
        } else if (response) {
          response
            .getRequestsList()
            .forEach((f) => stripeOutputChannel.appendLine(`Ran fixture: ${f}`));
          stripeOutputChannel.appendLine('Trigger succeeded! Check dashboard for event details.');
        }
      });

      recordEvent(extensionContext, eventName);
    }
  };

  openCreateCustomizedEvent = async (
    extensionContext: vscode.ExtensionContext,
    stripeDaemon: StripeDaemon,
    stripeOutputChannel: vscode.OutputChannel,
  ) => {
    this.telemetry.sendEvent('openCreateCustomizedEvent');
    const daemonClient = await stripeDaemon.setupClient();

    const supportedTriggersList = await this.getSupportedEventsList(
      daemonClient,
      stripeOutputChannel,
    );
    const events = this.buildTriggerEventsList(supportedTriggersList, extensionContext);
    const eventName = await showQuickPickWithItems('Select a fixture template', events);

    if (eventName) {
      const fixtureRequest = new FixtureRequest();
      fixtureRequest.setEvent(eventName);
      daemonClient.fixture(fixtureRequest, (error, response) => {
        if (error) {
          if (error.code === grpc.status.UNIMPLEMENTED) {
            vscode.window.showErrorMessage(
              'Please upgrade your Stripe CLI to the latest version to use this feature.',
            );
          } else {
            vscode.window.showErrorMessage(
              `Failed to get fixture template for event ${eventName}. ${error.details}`,
            );
          }
        } else if (response) {
          const fixtureTemplate = response.getFixture();
          openNewTextEditorWithContents(fixtureTemplate, 'stripe.fixture.json');

          stripeOutputChannel.show();
          stripeOutputChannel.appendLine(`Fixture template for ${eventName} loaded.`);
        }
      });
    }
  };

  openTriggerCustomizedEvent = async (
    stripeDaemon: StripeDaemon,
    stripeOutputChannel: vscode.OutputChannel,
  ) => {
    this.telemetry.sendEvent('openTriggerCustomizedEvent');
    const daemonClient = await stripeDaemon.setupClient();
    let eventName = 'with customized fixture';

    await vscode.window
      .showInformationMessage(
        'Run previously saved fixture or one time use fixture on the active editor tab?',
        {modal: true},
        ...['Open and execute saved fixture', 'Execute one time fixture'],
      )
      .then(async (option) => {
        if (option === 'Open and execute saved fixture') {
          const fixtureFileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            defaultUri: undefined,
            openLabel: 'Run Fixture',
          });

          if (!fixtureFileUri) {
            return;
          }

          // open the selected fixture on active editor
          vscode.workspace.openTextDocument(fixtureFileUri[0]).then((doc) => {
            vscode.window.showTextDocument(doc, {preview: false});
          });
          eventName = fixtureFileUri[0].fsPath.replace(/^.*[\\\/]/, '');
        }

        // grabs the fixture content on the active editor
        const content =
          (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.getText()) ||
          '';
        const err = validateFixtureEvent(content);

        if (err) {
          this.telemetry.sendEvent('invalidCustomizedFixture');
          vscode.window.showErrorMessage(`Invalid fixture format. ${err}`);
          return;
        }

        stripeOutputChannel.show();
        stripeOutputChannel.appendLine(`Triggering event ${eventName}...`);

        const triggerRequest = new TriggerRequest();
        triggerRequest.setEvent(eventName);
        triggerRequest.setRaw(content);

        daemonClient.trigger(triggerRequest, (error, response) => {
          if (error) {
            if (error.code === grpc.status.UNIMPLEMENTED) {
              vscode.window.showErrorMessage(
                'Please upgrade your Stripe CLI to the latest version to use this feature.',
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to trigger event ${eventName}. ${error.details}`,
              );
            }
          } else if (response) {
            response
              .getRequestsList()
              .forEach((f) => stripeOutputChannel.appendLine(`Ran fixture: ${f}`));
            stripeOutputChannel.appendLine(
              `Triggering ${eventName} succeeded! Check dashboard for event details.`,
            );
          }
        });
      });
  };

  buildTriggerEventsList = (
    events: string[],
    extensionContext: vscode.ExtensionContext,
  ): vscode.QuickPickItem[] => {
    const historicEvents = getRecentEvents(extensionContext, 20);

    // Get a unique list of events and take the first 5
    const recentEvents = [
      ...new Set<string>(historicEvents.filter((e: string) => events.includes(e))),
    ].slice(0, 5);

    const remainingEvents = events.filter((e) => !recentEvents.includes(e));

    const recentItems = recentEvents.map((e) => {
      return {
        label: e,
        description: 'recently triggered',
      };
    });

    const remainingItems = remainingEvents.map((e) => {
      return {
        label: e,
      };
    });
    return [...recentItems, ...remainingItems];
  };

  openReportIssue = () => {
    this.telemetry.sendEvent('openReportIssue');
    const {name, publisher} = getExtensionInfo();

    vscode.commands.executeCommand('vscode.openIssueReporter', {
      extensionId: `${publisher}.${name}`,
    });
  };

  openWebhooksDebugConfigure = () => {
    vscode.commands.executeCommand('workbench.action.debug.configure');
  };

  openDocs = () => {
    this.telemetry.sendEvent('openDocs');
    vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-vscode'));
  };

  openSurvey = (surveyPrompt: SurveyPrompt) => {
    this.telemetry.sendEvent('openSurvey');
    const extensionInfo = getExtensionInfo();

    const query = querystring.stringify({
      devTool: 'vscode', // matches the query string parsing for the dev tool selection on the CSAT form
      os: encodeURIComponent(osName()),
      vscodeVer: encodeURIComponent(vscode.version),
      extensionVer: encodeURIComponent(extensionInfo.version),
      machineId: encodeURIComponent(vscode.env.machineId),
    });

    const url = `https://stripe.com/docs/dev-tools-csat?${query}`;
    vscode.env.openExternal(vscode.Uri.parse(url));
    surveyPrompt.updateSurveySettings();
  };

  openTelemetryInfo = () => {
    vscode.env.openExternal(
      vscode.Uri.parse('https://code.visualstudio.com/docs/getstarted/telemetry'),
    );
  };

  resendEvent = async (
    stripeTreeItem: StripeTreeItem,
    stripeDaemon: StripeDaemon,
    stripeOutputChannel: vscode.OutputChannel,
  ) => {
    this.telemetry.sendEvent('resendEvent');

    const daemonClient = await stripeDaemon.setupClient();
    const eventId = stripeTreeItem.metadata.id;
    const resendRequest = new EventsResendRequest();
    resendRequest.setEventId(eventId);

    stripeOutputChannel.appendLine(`Resending Event: ${eventId}...`);
    stripeOutputChannel.show();

    daemonClient.eventsResend(resendRequest, (error, response) => {
      if (error) {
        vscode.window.showErrorMessage(`Failed to resend event: ${eventId}. ${error.details}`);
      } else if (response) {
        const event = response.getStripeEvent();

        if (event) {
          // Unfortunately these steps are necessary for correct rendering
          const stripeEventObj = {
            ...event.toObject(),
            data: event.getData()?.toJavaScript(),
          };
          const snakeCaseStripeEventObj = recursivelyRenameKeys(stripeEventObj, camelToSnakeCase);
          stripeOutputChannel.appendLine(JSON.stringify(snakeCaseStripeEventObj, undefined, 2));
        } else {
          // This shouldn't happen but we will log and record telemetry in case it does.
          this.telemetry.sendEvent('noResponseFromResendEvent');
          stripeOutputChannel.appendLine('Error: Did not get event back from server.');
        }
      }
    });
  };

  createStripeSample = async (stripeSamples: StripeSamples) => {
    this.telemetry.sendEvent('createStripeSample');
    await stripeSamples.selectAndCloneSample();
  };

  createWebhookEndpoint = async (
    stripeDaemon: StripeDaemon,
    stripeOutputChannel: vscode.OutputChannel,
    stripeWebhooksViewProvider: StripeWebhooksViewProvider,
  ) => {
    const url = await vscode.window.showInputBox({
      prompt: 'URL of the webhook endpoint.',
      value: 'https://',
    });
    const description = await vscode.window.showInputBox({
      prompt: 'Optional description of what the webhook is used for.',
    });
    const connect = await vscode.window.showQuickPick(['Connected accounts', 'Your account only'], {
      placeHolder: 'Should this endpoint receive events from connected accounts or from your account.',
    });
    const isConnect = connect === 'Connected accounts';

    const createRequest = new WebhookEndpointCreateRequest();
    createRequest.setUrl(url || '');
    createRequest.setDescription(description || '');
    createRequest.setConnect(isConnect);

    const daemonClient = await stripeDaemon.setupClient();
    daemonClient.webhookEndpointCreate(createRequest, (error, response) => {
      if (error) {
        if (error.code === grpc.status.UNIMPLEMENTED) {
          vscode.window.showErrorMessage(
            'Please upgrade your Stripe CLI to the latest version to use this feature.',
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to create webhook endpoint ${url}. ${error.details}`,
          );
        }
      } else if (response) {
        stripeOutputChannel.appendLine(`Webhook endpoint ${url} created. Please go to the developer dashboard to update the details of the endpoint.`);
        this.telemetry.sendEvent('createWebhookEndpoint');

        // refresh webhook endpoints tree
        stripeWebhooksViewProvider.refreshEndpoints();
      }
    });
  };
}
