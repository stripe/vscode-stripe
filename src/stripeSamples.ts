import * as path from 'path';
import {QuickPickItem, Uri, commands, env, window, workspace} from 'vscode';
import {SampleConfigsRequest, SampleConfigsResponse} from './rpc/sample_configs_pb';
import {SampleCreateRequest, SampleCreateResponse} from './rpc/sample_create_pb';
import {SamplesListRequest, SamplesListResponse} from './rpc/samples_list_pb';
import {StripeClient} from './stripeClient';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeCLIClient as StripeDaemonClient} from './rpc/commands_grpc_pb';

/**
 * SampleQuickPickItem contains the data for each Sample quick pick item.
 */
type SampleQuickPickItem = QuickPickItem & {
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
  selectAndCloneSample = async (sample?: string, integration?: string) => {
    try {
      this.daemonClient = await this.stripeDaemon.setupClient();
    } catch (e: any) {
      if (e.name === 'NoDaemonCommandError') {
        this.stripeClient.promptUpdateForDaemon();
      }
      console.error(e);
      return;
    }

    try {
      const samplesList = await this.getQuickPickItems();
      let selectedSample: SampleQuickPickItem | undefined;
      if (sample) {
        selectedSample = samplesList.find((s) => s.sampleData.name === sample);
      } else {
        selectedSample = await this.promptSample();
      }
      if (!selectedSample) {
        return;
      }

      const sampleName = selectedSample.sampleData.name;

      const integrationsList = await this.getConfigsForSample(sampleName);
      let selectedIntegration: SampleConfigsResponse.Integration | undefined
      if (integration) {
        selectedIntegration = integrationsList.find((i) => i.getIntegrationName() === integration);
      } else {
        selectedIntegration = await this.promptIntegration(selectedSample);
      }
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

      const cloneSampleAsName = await this.promptSampleName(sampleName);

      const clonePath = await this.promptPath(selectedSample, cloneSampleAsName);
      if (!clonePath) {
        return;
      }

      await window.showInformationMessage(
        `Sample "${sampleName}" cloning in progress...`,
        'OK',
      );

      const sampleCreateResponse = await this.createSample(
        sampleName,
        selectedIntegration.getIntegrationName(),
        selectedServer,
        selectedClient,
        clonePath,
      );

      const sampleIsReady = `Your sample "${cloneSampleAsName}" is all ready to go`;
      // eslint-disable-next-line no-nested-ternary
      const postInstallMessage = !!sampleCreateResponse
        ? !!sampleCreateResponse.getPostInstall()
          ? sampleCreateResponse.getPostInstall()
          : `${sampleIsReady}.`
        : `${sampleIsReady}, but we could not set the API keys in the .env file. Please set them manually.`;

      await this.promptOpenFolder(postInstallMessage, clonePath, sampleName);
    } catch (e: any) {
      window.showErrorMessage(`Cannot create Stripe sample: ${e.message}`);
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
    const selectedSample = await window.showQuickPick(this.getQuickPickItems(), {
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
    const integrationsPromise = this.getConfigsForSample(sample.sampleData.name);

    // Don't resolve the promise now. Instead, pass the promise to showQuickPick.
    // The quick pick will show a progress indicator while the promise is resolving.
    const getIntegrationNames = async (): Promise<string[]> => {
      return ((await integrationsPromise) || []).map((i) => i.getIntegrationName());
    };

    const selectedIntegrationName = await window.showQuickPick(getIntegrationNames(), {
      placeHolder: 'Select an integration',
    });
    if (!selectedIntegrationName) {
      return;
    }

    const integrations = await integrationsPromise;
    if (!integrations) {
      return undefined;
    }

    const selectedIntegration = integrations.find(
      (i) => i.getIntegrationName() === selectedIntegrationName,
    );
    return selectedIntegration;
  };

  /**
   * Ask for the sample client language
   */
  private promptClient = (
    integration: SampleConfigsResponse.Integration,
  ): Thenable<string | undefined> => {
    return window.showQuickPick(integration.getClientsList(), {
      placeHolder: 'Select a client language',
    });
  };

  /**
   * Ask for the sample server language
   */
  private promptServer = (
    integration: SampleConfigsResponse.Integration,
  ): Thenable<string | undefined> => {
    return window.showQuickPick(integration.getServersList(), {
      placeHolder: 'Select a server language',
    });
  };

  /**
   * Ask for where to clone the sample
   */
  private promptPath = async (sample: SampleQuickPickItem, cloneSampleAsName: string): Promise<string | undefined> => {
    const cloneDirectoryUri = await window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : undefined,
      openLabel: 'Clone sample',
    });

    if (!cloneDirectoryUri) {
      return;
    }

    const clonePath = path.resolve(cloneDirectoryUri[0].fsPath, cloneSampleAsName);

    return clonePath;
  };

  /**
   * Ask for sample name
   */
  private promptSampleName = async (sampleName: string): Promise<string> => {
    const inputName = await window.showInputBox({
      value: sampleName,
      prompt: 'Enter a sample name',
    });

    return !!inputName ? inputName : sampleName;
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
  ): Promise<SampleCreateResponse | null> => {
    const sampleCreateRequest = new SampleCreateRequest();
    sampleCreateRequest.setSampleName(sampleName);
    sampleCreateRequest.setIntegrationName(integrationName);
    sampleCreateRequest.setServer(server);
    sampleCreateRequest.setClient(client);
    sampleCreateRequest.setPath(path);

    return new Promise<SampleCreateResponse | null>((resolve, reject) => {
      this.daemonClient?.sampleCreate(sampleCreateRequest, (error, response) => {
        if (error) {
          // The error message that starts with 'we could not set...' is a special case that we want to
          // handle differently. Unfortunately, the server does not distinguish this error from other
          // ones, so we have to do our own handling.
          if (error.details.startsWith('we could not set')) {
            resolve(null);
          } else {
            reject(error);
          }
        } else if (response) {
          resolve(response);
        }
      });
    });
  };

  /**
   * Ask if the user wants to open the sample in the same or new window
   */
  private promptOpenFolder = async (postInstallMessage: string, clonePath: string, sampleName: string): Promise<void> => {
    const openFolderOptions = {
      sameWindow: 'Open in same window',
      newWindow: 'Open in new window',
    };

    const selectedOption = await window.showInformationMessage(
      postInstallMessage,
      {modal: true},
      ...Object.values(openFolderOptions),
    );

    // open the readme file in a new browser window
    // cant open in the editor because cannot update user setting 'workbench.startupEditor​' from stripe extension
    // preview markdown also does not work because opening new workspace will terminate the stripe extension process
    env.openExternal(Uri.parse(`https://github.com/stripe-samples/${sampleName}#readme`));

    switch (selectedOption) {
      case openFolderOptions.sameWindow:
        await commands.executeCommand('vscode.openFolder', Uri.file(clonePath), {
          forceNewWindow: false,
        });
        break;
      case openFolderOptions.newWindow:
        await commands.executeCommand('vscode.openFolder', Uri.file(clonePath), {
          forceNewWindow: true,
        });
        break;
      default:
        break;
    }
  };
}
