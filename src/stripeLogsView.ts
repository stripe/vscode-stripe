import {CLICommand, StripeClient} from './stripeClient';
import {ThemeIcon, window} from 'vscode';
import {LineStream} from 'byline';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import stream from 'stream';

enum ViewState {
  Idle,
  Loading,
  Streaming,
}

export class StripeLogsDataProvider extends StripeTreeViewDataProvider {
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

  async startLogsStreaming() {
    this.setViewState(ViewState.Loading);
    try {
      await this.setupStreams();
      this.setViewState(ViewState.Streaming);
    } catch (e) {
      window.showErrorMessage(e.message);
      this.cleanupStreams();
      this.setViewState(ViewState.Idle);
    }
  }

  stopLogsStreaming() {
    this.cleanupStreams();
    this.setViewState(ViewState.Idle);
  }

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
    const item = new StripeTreeItem(label, command);
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

    // The CLI lets you know that streaming is ready via stderr
    if (!this.logsStderrStream) {
      await new Promise<void>((resolve) => {
        this.logsStderrStream = new stream.Writable({
          write: (chunk, encoding, callback) => {
            if (encoding === 'utf8') {
              if (chunk.includes('Ready!')) {
                resolve();
              }
            }
            callback();
          },
          decodeStrings: false,
        });
        stripeLogsTailProcess.stderr.setEncoding('utf8').pipe(new LineStream()).pipe(this.logsStderrStream);
      });
    }

    if (!this.logsStdoutStream) {
      this.logsStdoutStream = new stream.Writable({
        write: (chunk, encoding, callback) => {
          if (encoding === 'utf8') {
            try {
              const logObject = JSON.parse(chunk);
              if (logObject && typeof logObject === 'object') {
                const label = `[${logObject.status}] ${logObject.method} ${logObject.url} [${logObject.request_id}]`;
                const logTreeItem = new StripeTreeItem(label);
                this.insertLog(logTreeItem);
              }
            } catch {}
          }
          callback();
        },
        decodeStrings: false,
      });
      stripeLogsTailProcess.stdout.setEncoding('utf8').pipe(new LineStream()).pipe(this.logsStdoutStream);
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

  private insertLog = (logTreeItem: StripeTreeItem) => {
    this.logTreeItems.unshift(logTreeItem);
    this.refresh();
  };

  private setViewState(viewState: ViewState) {
    this.viewState = viewState;
    this.refresh();
  }
}
