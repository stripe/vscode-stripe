import {CLICommand, StripeClient} from './stripeClient';
import {ThemeIcon, window} from 'vscode';
import {ChildProcess} from 'child_process';
import {LineStream} from 'byline';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {debounce} from './utils';
import stream from 'stream';

enum ViewState {
  Idle,
  Loading,
  Streaming,
}

const REFRESH_DEBOUNCE_MILLIS = 1000;

/**
 * This is an abstract class for TreeViews with streaming tree items.
 */
export abstract class StreamingViewDataProvider extends StripeTreeViewDataProvider {
  protected stripeClient: StripeClient;
  protected streamingTreeItems: StripeTreeItem[];
  private streamCommand: CLICommand;
  private viewState: ViewState;
  private stdoutStream: stream.Writable | null;
  private stderrStream: stream.Writable | null;

  constructor(stripeClient: StripeClient, streamCommand: CLICommand) {
    super();
    this.stripeClient = stripeClient;
    this.streamCommand = streamCommand;
    this.streamingTreeItems = [];
    this.stdoutStream = null;
    this.stderrStream = null;
    this.viewState = ViewState.Idle;
  }

  startStreaming = async () => {
    if (this.viewState === ViewState.Idle) {
      this.setViewState(ViewState.Loading);
      try {
        await this.setupStreams();
      } catch (e) {
        window.showErrorMessage(e.message);
        this.stopStreaming();
      }
    }
  };

  stopStreaming = () => {
    this.cleanupStreams();
    this.setViewState(ViewState.Idle);
  };

  protected getStreamingControlItem(
    viewName: string,
    startCommand: string,
    stopCommand: string,
  ): StripeTreeItem {
    const streamingControlItemArgs = (() => {
      switch (this.viewState) {
        case ViewState.Idle:
          return {
            label: `Start streaming ${viewName}`,
            command: startCommand,
            iconId: 'play-circle',
          };
        case ViewState.Loading:
          return {
            label: `Starting streaming ${viewName} ...`,
            command: stopCommand,
            iconId: 'loading',
          };
        case ViewState.Streaming:
          return {
            label: `Stop streaming ${viewName}`,
            command: stopCommand,
            iconId: 'stop-circle',
          };
      }
    })();

    return this.createItemWithCommand(streamingControlItemArgs);
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
    const item = new StripeTreeItem(label, {
      commandString: command,
      iconPath: iconId ? new ThemeIcon(iconId) : undefined,
    });
    return item;
  }

  private async setupStreams() {
    const tailProcess = await this.createStreamProcess();
    tailProcess.on('exit', this.stopStreaming);

    if (!this.stderrStream) {
      this.stderrStream = new stream.Writable({
        write: (chunk, _, callback) => {
          if (this.streamReady(chunk)) {
            this.setViewState(ViewState.Streaming);
          } else if (!this.streamLoading(chunk)) {
            window.showErrorMessage(chunk);
            this.stopStreaming();
          }
          callback();
        },
        decodeStrings: false,
      });
      tailProcess.stderr.setEncoding('utf8').pipe(new LineStream()).pipe(this.stderrStream);
    }

    if (!this.stdoutStream) {
      this.stdoutStream = new stream.Writable({
        write: (chunk, _, callback) => {
          try {
            const object = this.createStreamTreeItem(chunk);
            if (object) {
              this.insertItem(object);
            }
          } catch {}
          callback();
        },
        decodeStrings: false,
      });
      tailProcess.stdout.setEncoding('utf8').pipe(new LineStream()).pipe(this.stdoutStream);
    }
  }

  // Tell us how to start the process
  abstract createStreamProcess(): Promise<ChildProcess>;

  // Tell us how we can tell when the process is ready
  abstract streamReady(chunk: any): boolean;

  // Tell us how we can tell if the stream is still loading
  abstract streamLoading(chunk: any): boolean;

  // Tell us how to process the chunk into a tree item.
  abstract createStreamTreeItem(chunk: any): StripeTreeItem | null;

  private cleanupStreams = () => {
    if (this.stdoutStream) {
      this.stdoutStream.destroy();
      this.stdoutStream = null;
    }
    if (this.stderrStream) {
      this.stderrStream.destroy();
      this.stderrStream = null;
    }
    this.stripeClient.endCLIProcess(this.streamCommand);
  };

  private debouncedRefresh = debounce(this.refresh.bind(this), REFRESH_DEBOUNCE_MILLIS);

  private insertItem = (treeItem: StripeTreeItem) => {
    this.streamingTreeItems.unshift(treeItem);
    this.debouncedRefresh();
  };

  private setViewState(viewState: ViewState) {
    this.viewState = viewState;
    this.refresh();
  }
}
