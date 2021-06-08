import * as vscode from 'vscode';
import {LogsTailRequest, LogsTailResponse} from './rpc/logs_tail_pb';
import {StreamingViewDataProvider, ViewState} from './stripeStreamingView';
import {addLogDetails, clearLogDetails} from './stripeWorkspaceState';
import {camelToSnakeCase, recursivelyRenameKeys, unixToLocaleStringTZ} from './utils';
import {ClientReadableStream} from '@grpc/grpc-js';
import {StripeClient} from './stripeClient';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeTreeItem} from './stripeTreeItem';

export class StripeLogsViewProvider extends StreamingViewDataProvider<LogsTailResponse> {
  private extensionContext: vscode.ExtensionContext;

  constructor(
    stripeClient: StripeClient,
    stripeDaemon: StripeDaemon,
    extensionContext: vscode.ExtensionContext,
  ) {
    super(stripeClient, stripeDaemon);
    this.extensionContext = extensionContext;
  }

  buildTree(): Promise<StripeTreeItem[]> {
    const treeItems = [
      this.getStreamingControlItem('API logs', 'startLogsStreaming', 'stopLogsStreaming'),
    ];

    if (this.streamingTreeItems.length > 0) {
      const logsStreamRootItem = new StripeTreeItem('Recent logs');
      logsStreamRootItem.children = this.streamingTreeItems;
      logsStreamRootItem.expand();
      treeItems.push(logsStreamRootItem);
    }

    return Promise.resolve(treeItems);
  }

  async createReadableStream(): Promise<ClientReadableStream<LogsTailResponse> | undefined> {
    try {
      const daemonClient = await this.stripeDaemon.setupClient();
      const logsTailStream = daemonClient.logsTail(new LogsTailRequest());
      return logsTailStream;
    } catch (e) {
      if (e.name === 'NoDaemonCommandError') {
        this.stripeClient.promptUpdateForDaemon();
      }
      console.error(e);
    }
  }

  handleData = (response: LogsTailResponse) => {
    const state = response.getState();
    const log = response.getLog();
    if (state) {
      this.handleState(state);
    } else if (log) {
      this.handleLog(log);
    }
  };

  // override parent method.
  clearItems() {
    super.clearItems();
    clearLogDetails(this.extensionContext);
  }

  private handleState(state: number): void {
    switch (state) {
      case LogsTailResponse.State.STATE_DONE:
        this.setViewState(ViewState.Idle);
        break;
      case LogsTailResponse.State.STATE_LOADING:
        this.setViewState(ViewState.Loading);
        break;
      case LogsTailResponse.State.STATE_READY:
        this.setViewState(ViewState.Streaming);
        break;
      case LogsTailResponse.State.STATE_RECONNECTING:
        this.setViewState(ViewState.Loading);
        break;
      default:
        // this case should never be hit
        this.setViewState(ViewState.Idle);
        console.error('Received unknown stream state');
    }
  }

  private handleLog(log: LogsTailResponse.Log): void {
    const label = `[${log.getStatus()}] ${log.getMethod()} ${log.getUrl()} [${log.getRequestId()}]`;
    const logTreeItem = new StripeTreeItem(label, {
      commandString: 'openLogDetails',
      contextValue: 'logItem',
      tooltip: unixToLocaleStringTZ(log.getCreatedAt()),
    });
    logTreeItem.metadata = {
      id: log.getRequestId(),
    };

    // Unfortunately these steps are necessary for correct rendering
    const stripeLogObj = {...log.toObject()};
    const snakeCaseStripeLogObj = recursivelyRenameKeys(stripeLogObj, camelToSnakeCase);

    // Save the log object in memento
    addLogDetails(this.extensionContext, log.getRequestId(), snakeCaseStripeLogObj);

    this.insertItem(logTreeItem);
  }
}
