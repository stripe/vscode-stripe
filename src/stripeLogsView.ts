import {CLICommand, StripeClient} from './stripeClient';
import {ThemeIcon, window} from 'vscode';
import {debounce, unixToLocaleStringTZ} from './utils';
import {LineStream} from 'byline';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import stream from 'stream';

enum ViewState {
  Idle,
  Loading,
  Streaming,
}

type LogObject = {
  status: number;
  method: string;
  url: string;
  // eslint-disable-next-line camelcase
  request_id: string;
  // eslint-disable-next-line camelcase
  created_at: number;
};

export const isLogObject = (object: any): object is LogObject => {
  if (!object || typeof object !== 'object') {
    return false;
  }
  const possibleLogObject = object as LogObject;
  return (
    typeof possibleLogObject.status === 'number' &&
    typeof possibleLogObject.method === 'string' &&
    typeof possibleLogObject.url === 'string' &&
    typeof possibleLogObject.request_id === 'string'
  );
};

export class StripeLogsDataProvider extends StripeTreeViewDataProvider {
  private static readonly REFRESH_DEBOUNCE_MILLIS = 1000;

  private stripeClient: StripeClient;
  private logTreeItems: StripeTreeItem[];
  private viewState: ViewState;
  private logsStdoutStream: stream.Writable | null;
  private logsStderrStream: stream.Writable | null;

  constructor(stripeClient: StripeClient) {
    super();
    this.stripeClient = stripeClient;
    this.logTreeItems = [];
    this.logsStdoutStream = null;
    this.logsStderrStream = null;
    this.viewState = ViewState.Idle;
  }

  startLogsStreaming = async () => {
    if (this.viewState === ViewState.Idle) {
      this.setViewState(ViewState.Loading);
      try {
        await this.setupStreams();
      } catch (e) {
        window.showErrorMessage(e.message);
        this.stopLogsStreaming();
      }
    }
  };

  stopLogsStreaming = () => {
    this.cleanupStreams();
    this.setViewState(ViewState.Idle);
  };

  buildTree(): Promise<StripeTreeItem[]> {
    const streamingControlItemArgs = (() => {
      switch (this.viewState) {
        case ViewState.Idle:
          return {
            label: 'Start streaming API logs',
            command: 'startLogsStreaming',
            iconId: 'play-circle',
          };
        case ViewState.Loading:
          return {
            label: 'Starting streaming API logs...',
            command: 'stopLogsStreaming',
            iconId: 'loading',
          };
        case ViewState.Streaming:
          return {
            label: 'Stop streaming API logs',
            command: 'stopLogsStreaming',
            iconId: 'stop-circle',
          };
      }
    })();

    const streamingControlItem = this.createItemWithCommand(streamingControlItemArgs);

    const treeItems = [streamingControlItem];

    if (this.logTreeItems.length > 0) {
      const logsStreamRootItem = new StripeTreeItem('Recent logs');
      logsStreamRootItem.children = this.logTreeItems;
      logsStreamRootItem.expand();
      treeItems.push(logsStreamRootItem);
    }

    return Promise.resolve(treeItems);
  }

  private createItemWithCommand({
    label,
    command,
    iconId,
  }: {
    label: string;
    command?: string;
    iconId?: string;
  }) {
    const item = new StripeTreeItem(label, {commandString: command});
    if (iconId) {
      item.iconPath = new ThemeIcon(iconId);
    }
    return item;
  }

  private async setupStreams() {
    const stripeLogsTailProcess = await this.stripeClient.getOrCreateCLIProcess(
      CLICommand.LogsTail,
      ['--format', 'JSON'],
    );
    if (!stripeLogsTailProcess) {
      throw new Error('Failed to start `stripe logs tail` process');
    }

    stripeLogsTailProcess.on('exit', this.stopLogsStreaming);

    /**
     * The CLI lets you know that streaming is ready via stderr. In the happy path:
     *
     * $ stripe logs tail
     * Getting ready...
     * Ready! You're now waiting to receive API request logs (^C to quit)
     *
     * We interpret any other message as an error.
     */
    if (!this.logsStderrStream) {
      this.logsStderrStream = new stream.Writable({
        write: (chunk, _, callback) => {
          if (chunk.includes('Ready!')) {
            this.setViewState(ViewState.Streaming);
          } else if (!chunk.includes('Getting ready')) {
            window.showErrorMessage(chunk);
            this.stopLogsStreaming();
          }
          callback();
        },
        decodeStrings: false,
      });
      stripeLogsTailProcess.stderr
        .setEncoding('utf8')
        .pipe(new LineStream())
        .pipe(this.logsStderrStream);
    }

    if (!this.logsStdoutStream) {
      this.logsStdoutStream = new stream.Writable({
        write: (chunk, _, callback) => {
          try {
            const object = JSON.parse(chunk);
            if (isLogObject(object)) {
              const label = `[${object.status}] ${object.method} ${object.url} [${object.request_id}]`;
              const logTreeItem = new StripeTreeItem(label, {
                commandString: 'openDashboardLogFromTreeItem',
                contextValue: 'logItem',
                tooltip: unixToLocaleStringTZ(object.created_at),
              });
              logTreeItem.metadata = {
                id: object.request_id,
              };
              this.insertLog(logTreeItem);
            }
          } catch {}
          callback();
        },
        decodeStrings: false,
      });
      stripeLogsTailProcess.stdout
        .setEncoding('utf8')
        .pipe(new LineStream())
        .pipe(this.logsStdoutStream);
    }
  }

  private cleanupStreams = () => {
    if (this.logsStdoutStream) {
      this.logsStdoutStream.destroy();
      this.logsStdoutStream = null;
    }
    if (this.logsStderrStream) {
      this.logsStderrStream.destroy();
      this.logsStderrStream = null;
    }
    this.stripeClient.endCLIProcess(CLICommand.LogsTail);
  };

  private debouncedRefresh = debounce(
    this.refresh.bind(this),
    StripeLogsDataProvider.REFRESH_DEBOUNCE_MILLIS,
  );

  private insertLog = (logTreeItem: StripeTreeItem) => {
    this.logTreeItems.unshift(logTreeItem);
    this.debouncedRefresh();
  };

  private setViewState(viewState: ViewState) {
    this.viewState = viewState;
    this.refresh();
  }
}
