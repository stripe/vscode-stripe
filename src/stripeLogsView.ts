import {CLICommand, StripeClient} from './stripeClient';
import {ChildProcess} from 'child_process';
import {StreamingViewDataProvider} from './stripeStreamingView';
import {StripeTreeItem} from './stripeTreeItem';
import {unixToLocaleStringTZ} from './utils';

// Log object should have an isObject and method for how to create a label.
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

export class StripeLogsViewProvider extends StreamingViewDataProvider {
  constructor(stripeClient: StripeClient) {
    super(stripeClient, CLICommand.LogsTail);
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

  async createStreamProcess(): Promise<ChildProcess> {
    const stripeLogsTailProcess = await this.stripeClient.getOrCreateCLIProcess(
      CLICommand.LogsTail,
      ['--format', 'JSON'],
    );
    if (!stripeLogsTailProcess) {
      throw new Error('Failed to start `stripe logs tail` process');
    }
    return stripeLogsTailProcess;
  }

  streamReady(chunk: any): boolean {
    return chunk.includes('Ready!');
  }

  streamLoading(chunk: any): boolean {
    return chunk.includes('Getting ready');
  }

  createTreeItem(chunk: any): StripeTreeItem | null {
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
      return logTreeItem;
    }
    return null;
  }
}
