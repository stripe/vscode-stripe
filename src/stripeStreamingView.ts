import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import {ThemeIcon, window} from 'vscode';
import {Message} from 'google-protobuf';
import {StripeClient} from './stripeClient';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {debounce} from './utils';

export enum ViewState {
  Idle,
  Loading,
  Streaming,
}

const REFRESH_DEBOUNCE_MILLIS = 1000;

/**
 * This is an abstract class for TreeViews with streaming tree items.
 */
export abstract class StreamingViewDataProvider<
  Res extends Message,
> extends StripeTreeViewDataProvider {
  protected stripeClient: StripeClient;
  protected stripeDaemon: StripeDaemon;
  protected streamingTreeItems: StripeTreeItem[];
  private readableStream?: grpc.ClientReadableStream<Res>;
  private viewState: ViewState;

  constructor(stripeClient: StripeClient, stripeDaemon: StripeDaemon) {
    super();
    this.stripeClient = stripeClient;
    this.stripeDaemon = stripeDaemon;
    this.streamingTreeItems = [];
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

  clearItems() {
    this.streamingTreeItems = [];
    this.refresh();
  }

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
            iconFileName: 'loading',
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
    iconFileName,
  }: {
    label: string;
    command?: string;
    iconId?: string;
    iconFileName?: string;
  }) {
    if (iconFileName) {
      return new StripeTreeItem(label, {
        commandString: command,
        iconPath: {
          light: path.resolve(__dirname, `../resources/icons/light/${iconFileName}.svg`),
          dark: path.resolve(__dirname, `../resources/icons/dark/${iconFileName}.svg`),
        },
      });
    } else {
      return new StripeTreeItem(label, {
        commandString: command,
        iconPath: iconId ? new ThemeIcon(iconId) : undefined,
      });
    }
  }

  private async setupStreams() {
    this.readableStream = await this.createReadableStream();
    if (!this.readableStream) {
      this.setViewState(ViewState.Idle);
    } else {
      this.readableStream.on('exit', this.stopStreaming);

      this.readableStream.on('error', (err: grpc.ServiceError) => {
        switch (err.code) {
          case grpc.status.UNAUTHENTICATED:
            this.stripeClient.promptLogin();
            break;
          case grpc.status.CANCELLED:
            // noop
            break;
          default:
            window.showErrorMessage(err.details);
            break;
        }
        this.stopStreaming();
      });

      this.readableStream.on('data', this.handleData);
    }
  }

  // Tell us how to create the readable stream
  abstract createReadableStream(): Promise<grpc.ClientReadableStream<Res> | undefined>;

  // Tell us how to handle response from the Stripe daemon
  abstract handleData: (res: Res) => void;

  protected insertItem = (treeItem: StripeTreeItem) => {
    this.streamingTreeItems.unshift(treeItem);
    this.debouncedRefresh();
  };

  protected setViewState(viewState: ViewState) {
    this.viewState = viewState;
    this.refresh();
  }

  private cleanupStreams = () => {
    this.readableStream?.cancel();
    this.readableStream?.destroy();
    this.readableStream = undefined;
  };

  private debouncedRefresh = debounce(this.refresh.bind(this), REFRESH_DEBOUNCE_MILLIS);
}
