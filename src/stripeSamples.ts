import * as path from 'path';
import * as vscode from 'vscode';
import {SampleConfigsRequest, SampleConfigsResponse} from './rpc/sample_configs_pb';
import {SampleCreateRequest, SampleCreateResponse} from './rpc/sample_create_pb';
import {SamplesListRequest, SamplesListResponse} from './rpc/samples_list_pb';
import {StripeCLIClient} from './rpc/commands_grpc_pb';

type SampleQuickPickItem = vscode.QuickPickItem & {
  sampleData: {
    name: string;
    url: string;
  };
};

export class StripeSamples {
  private stripeCLIClient: StripeCLIClient;

  constructor(stripeCLIClient: StripeCLIClient) {
    this.stripeCLIClient = stripeCLIClient;
  }

  /**
   * Show a menu with a list of Stripe samples, prompt for sample options, clone the sample, and
   * prompt to open the sample.
   */
  selectAndCloneSample = async () => {
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

    await this.createSample(
      selectedSample.sampleData.name,
      selectedIntegration.getIntegrationName(),
      selectedServer,
      selectedClient,
      clonePath,
    );
  };

  /**
   * Get a list of Stripe Samples items to show in a quick pick menu.
   */
  getQuickPickItems = async () => {
    const rawSamples = await new Promise<SamplesListResponse.SampleData[]>((resolve, reject) => {
      this.stripeCLIClient.samplesList(new SamplesListRequest(), (error, response) => {
        if (error) {
          reject(error);
        } else {
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

  getConfigsForSample(sampleName: string): Promise<SampleConfigsResponse.Integration[]> {
    return new Promise((resolve, reject) => {
      this.stripeCLIClient.sampleConfigs(
        new SampleConfigsRequest().setSampleName(sampleName),
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.getIntegrationsList());
          }
        },
      );
    });
  }

  promptSample = async (): Promise<SampleQuickPickItem | undefined> => {
    let selectedSample: SampleQuickPickItem | undefined;
    try {
      selectedSample = await vscode.window.showQuickPick(this.getQuickPickItems(), {
        matchOnDetail: true,
        placeHolder: 'Select a sample to clone',
      });
    } catch (e) {
      vscode.window.showErrorMessage(`Error fetching list of Stripe samples: ${e}`);
      return;
    }
    return selectedSample;
  };

  promptIntegration = async (
    sample: SampleQuickPickItem,
  ): Promise<SampleConfigsResponse.Integration | undefined> => {
    let integrations: SampleConfigsResponse.Integration[] | undefined;

    const getIntegrationNames = async (sampleName: string) => {
      integrations = await this.getConfigsForSample(sampleName);
      return integrations.map((i) => i.getIntegrationName());
    };

    let selectedIntegrationName: string | undefined;
    try {
      selectedIntegrationName = await vscode.window.showQuickPick(
        await getIntegrationNames(sample.sampleData.name),
        {
          placeHolder: 'Select an integration',
        },
      );
    } catch (e) {
      vscode.window.showErrorMessage(`Error fetching configs for ${sample.sampleData.name}: ${e}`);
      return;
    }

    if (!integrations) {
      return;
    }

    if (!selectedIntegrationName) {
      return;
    }

    return integrations.find((i) => i.getIntegrationName() === selectedIntegrationName);
  };

  promptClient = (integration: SampleConfigsResponse.Integration): Thenable<string | undefined> => {
    return vscode.window.showQuickPick(integration.getClientsList(), {
      placeHolder: 'Select a client language',
    });
  };

  promptServer = (integration: SampleConfigsResponse.Integration): Thenable<string | undefined> => {
    return vscode.window.showQuickPick(integration.getServersList(), {
      placeHolder: 'Select a server language',
    });
  };

  promptPath = async (sample: SampleQuickPickItem): Promise<string | undefined> => {
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

  createSample = async (
    sampleName: string,
    integrationName: string,
    server: string,
    client: string,
    path: string,
  ) => {
    const sampleCreateRequest = new SampleCreateRequest()
      .setSampleName(sampleName)
      .setIntegrationName(integrationName)
      .setServer(server)
      .setClient(client)
      .setPath(path);

    try {
      const sampleCreateResponse = await new Promise<SampleCreateResponse>((resolve, reject) => {
        this.stripeCLIClient.sampleCreate(sampleCreateRequest, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      const postInstallMessage = sampleCreateResponse.getPostInstall();

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
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to create Stripe Sample: ${e}`);
    }
  };
}
