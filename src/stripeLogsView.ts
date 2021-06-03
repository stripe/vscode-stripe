import {LogsTailRequest, LogsTailResponse} from './rpc/logs_tail_pb';
import {StreamingViewDataProvider, ViewState} from './stripeStreamingView';
import {ClientReadableStream} from '@grpc/grpc-js';
import {StripeTreeItem} from './stripeTreeItem';
import {unixToLocaleStringTZ} from './utils';

export class StripeLogsViewProvider extends StreamingViewDataProvider<LogsTailResponse> {
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

  async createReadableStream(): Promise<ClientReadableStream<LogsTailResponse>> {
    const daemonClient = await this.stripeDaemon.setupClient();
    const logsTailStream = daemonClient.logsTail(new LogsTailRequest());
    return logsTailStream;
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

  private handleState(state: number): void {
    switch (state) {
      case LogsTailResponse.State.STATE_UNSPECIFIED:
        // this case should never be hit
        this.setViewState(ViewState.Idle);
        break;
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
        // noop
        break;
      default:
        console.error('Received unknown stream state');
    }
  }

  private handleLog(log: LogsTailResponse.Log): void {
    const label = `[${log.getStatus()}] ${log.getMethod()} ${log.getUrl()} [${log.getRequestId()}]`;
    const logTreeItem = new StripeTreeItem(label, {
      commandString: 'openDashboardLogFromTreeItem',
      contextValue: 'logItem',
      tooltip: unixToLocaleStringTZ(log.getCreatedAt()),
    });
    logTreeItem.metadata = {
      id: log.getRequestId(),
    };
    this.insertItem(logTreeItem);
  }
}
