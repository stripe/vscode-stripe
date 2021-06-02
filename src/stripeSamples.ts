import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from 'vscode';
import {SampleConfigsRequest, SampleConfigsResponse} from './rpc/sample_configs_pb';
import {SampleCreateRequest, SampleCreateResponse} from './rpc/sample_create_pb';
import {SamplesListRequest, SamplesListResponse} from './rpc/samples_list_pb';
import {StripeClient} from './stripeClient';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeCLIClient as StripeDaemonClient} from './rpc/commands_grpc_pb';

/**
 * SampleQuickPickItem contains the data for each Sample quick pick item.
 */
type SampleQuickPickItem = vscode.QuickPickItem & {
  sampleData: {
    name: string;
    url: string;
  };
};

/**
 * StripeSamples prompts the user for a Stripe sample and delegates sample creation to the
 * underlying Stripe daemon process.
 */
export class StripeSamples {
  private daemonClient?: StripeDaemonClient;
  private stripeClient: StripeClient;
  private stripeDaemon: StripeDaemon;

  constructor(stripeClient: StripeClient, stripeDaemon: StripeDaemon) {
    this.stripeClient = stripeClient;
    this.stripeDaemon = stripeDaemon;
  }

  /**
   * Show a menu with a list of Stripe samples, prompt for sample options, clone the sample, and
   * prompt to open the sample.
   */
  selectAndCloneSample = async () => {
    try {
      this.daemonClient = await this.stripeDaemon.setupClient();
    } catch (e) {
      if (e.name === 'NoDaemonCommandError') {
        this.stripeClient.promptUpdateForDaemon();
      }
      console.error(e);
      return;
    }

    try {
      const selectedSample = await this.promptSample();
      if (!selectedSample) {
        return;
      }

      const selectedIntegration = await this.promptIntegration(selectedSample);
      if (!selectedIntegration) {
        return;
      }

      const selectedClient = await this.promptClient(selectedIntegration);
      if (!selectedClient) {
        return;
      }

      const selectedServer = await this.promptServer(selectedIntegration);
      if (!selectedServer) {
        return;
      }

      const clonePath = await this.promptPath(selectedSample);
      if (!clonePath) {
        return;
      }

      const sampleCreateResponse = await this.createSample(
        selectedSample.sampleData.name,
        selectedIntegration.getIntegrationName(),
        selectedServer,
        selectedClient,
        clonePath,
      );

      const postInstallMessage = sampleCreateResponse.getPostInstall();

      await this.promptOpenFolder(postInstallMessage, clonePath);
    } catch (e) {
      if ((e as grpc.ServiceError).code === grpc.status.UNAUTHENTICATED) {
        this.stripeClient.promptLogin();
      } else {
        vscode.window.showErrorMessage(`Cannot create Stripe sample: ${e.message}`);
      }
      console.error(e);
    }
  };

  /**
   * Get a list of Stripe Samples items to show in a quick pick menu.
   */
  private getQuickPickItems = async () => {
    const rawSamples = await new Promise<SamplesListResponse.SampleData[]>((resolve, reject) => {
      this.daemonClient?.samplesList(new SamplesListRequest(), (error, response) => {
        if (error) {
          reject(error);
        } else if (response) {
          resolve(response.getSamplesList());
        }
      });
    });

    // alphabetical order
    rawSamples.sort((a, b) => {
      if (a.getName() < b.getName()) {
        return -1;
      }
      if (a.getName() > b.getName()) {
        return 1;
      }
      return 0;
    });

    const samplesQuickPickItems: SampleQuickPickItem[] = rawSamples.map((s) => {
      return {
        label: `$(repo) ${s.getName()}`,
        detail: s.getDescription(),
        sampleData: {
          name: s.getName(),
          url: s.getUrl(),
        },
      };
    });

    return samplesQuickPickItems;
  };

  /**
   *  Get the available configs for this sample.
   */
  private getConfigsForSample(sampleName: string): Promise<SampleConfigsResponse.Integration[]> {
    const request = new SampleConfigsRequest();
    request.setSampleName(sampleName);

    return new Promise((resolve, reject) => {
      this.daemonClient?.sampleConfigs(request, (error, response) => {
        if (error) {
          reject(error);
        } else if (response) {
          resolve(response.getIntegrationsList());
        }
      });
    });
  }

  /**
   * Ask for which sample to clone.
   */
  private promptSample = async (): Promise<SampleQuickPickItem | undefined> => {
    const selectedSample = await vscode.window.showQuickPick(this.getQuickPickItems(), {
      matchOnDetail: true,
      placeHolder: 'Select a sample to clone',
    });
    return selectedSample;
  };

  /**
   * Ask for which integration to copy for this sample.
   */
  private promptIntegration = async (
    sample: SampleQuickPickItem,
  ): Promise<SampleConfigsResponse.Integration | undefined> => {
    let integrations: SampleConfigsResponse.Integration[] | undefined;

    const getIntegrationNames = async (sampleName: string) => {
      integrations = await this.getConfigsForSample(sampleName);
      return integrations.map((i) => i.getIntegrationName());
    };

    const selectedIntegrationName = await vscode.window.showQuickPick(
      await getIntegrationNames(sample.sampleData.name),
      {
        placeHolder: 'Select an integration',
      },
    );

    if (!integrations) {
      return;
    }

    if (!selectedIntegrationName) {
      return;
    }

    return integrations.find((i) => i.getIntegrationName() === selectedIntegrationName);
  };

  /**
   * Ask for the sample client language
   */
  private promptClient = (
    integration: SampleConfigsResponse.Integration,
  ): Thenable<string | undefined> => {
    return vscode.window.showQuickPick(integration.getClientsList(), {
      placeHolder: 'Select a client language',
    });
  };

  /**
   * Ask for the sample server language
   */
  private promptServer = (
    integration: SampleConfigsResponse.Integration,
  ): Thenable<string | undefined> => {
    return vscode.window.showQuickPick(integration.getServersList(), {
      placeHolder: 'Select a server language',
    });
  };

  /**
   * Ask for where to clone the sample
   */
  private promptPath = async (sample: SampleQuickPickItem): Promise<string | undefined> => {
    const cloneDirectoryUri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri
        : undefined,
      openLabel: 'Clone sample',
    });

    if (!cloneDirectoryUri) {
      return;
    }

    const clonePath = path.resolve(cloneDirectoryUri[0].fsPath, sample.sampleData.name);

    return clonePath;
  };

  /**
   * Execute the sample creation with the given config at the given path
   */
  private createSample = (
    sampleName: string,
    integrationName: string,
    server: string,
    client: string,
    path: string,
  ): Promise<SampleCreateResponse> => {
    const sampleCreateRequest = new SampleCreateRequest();
    sampleCreateRequest.setSampleName(sampleName);
    sampleCreateRequest.setIntegrationName(integrationName);
    sampleCreateRequest.setServer(server);
    sampleCreateRequest.setClient(client);
    sampleCreateRequest.setPath(path);

    try {
      return new Promise<SampleCreateResponse>((resolve, reject) => {
        this.daemonClient?.sampleCreate(sampleCreateRequest, (error, response) => {
          if (error) {
            reject(error);
          } else if (response) {
            resolve(response);
          }
        });
      });
    } catch (e) {
      throw new Error(`Failed to create Stripe Sample: ${e.message}`);
    }
  };

  /**
   * Ask if the user wants to open the sample in the same or new window
   */
  private promptOpenFolder = async (postInstallMessage: string, path: string): Promise<void> => {
    const openFolderOptions = {
      sameWindow: 'Open in same window',
      newWindow: 'Open in new window',
    };

    const selectedOption = await vscode.window.showInformationMessage(
      postInstallMessage || 'Successfully created sample',
      {modal: true},
      ...Object.values(openFolderOptions),
    );

    switch (selectedOption) {
      case openFolderOptions.sameWindow:
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(path), {
          forceNewWindow: false,
        });
        break;
      case openFolderOptions.newWindow:
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(path), {
          forceNewWindow: true,
        });
        break;
      default:
        break;
    }
  };
}
