import * as querystring from "querystring";
import * as vscode from "vscode";
import { ExtensionContext, window, env, Memento, Uri } from "vscode";
import moment from "moment";
import osName = require("os-name");
import readPkgUp = require("read-pkg-up");

enum storageKeys {
  doNotShowAgain = "stripeDoNotShowAgain",
  lastSurveyDate = "stripeLastSurveyDate",
}

export class SurveyPrompt {
  storage: Memento;

  constructor(context: ExtensionContext) {
    this.storage = context.globalState;
  }

  public async activate(): Promise<void> {
    const show = this.shouldShowBanner();
    if (!show) {
      return;
    }

    setTimeout(this.showSurvey, 60 * 1000 * 2); // Wait 2 minutes to show survey to avoid showing upon initial activation.
  }

  public shouldShowBanner(): boolean {
    if (this.storage.get(storageKeys.doNotShowAgain)) {
      return false;
    }

    const lastSurveyDateEpoch = this.storage.get(
      storageKeys.lastSurveyDate
    ) as number;

    if (lastSurveyDateEpoch) {
      let lastSurveyDate = moment(lastSurveyDateEpoch);
      let currentDate = moment();

      if (currentDate.diff(lastSurveyDate, "weeks") < 12) {
        return false;
      }
    }

    return true;
  }

  public async showSurvey() {
    const prompts = ["Take survey", "Maybe later", "Don't Show Again"];

    const selection = await window.showInformationMessage(
      "Got 2 minutes to tell us how the Stripe extension is working for you?",
      ...prompts
    );

    if (!selection) {
      return;
    }

    if (selection === "Take survey") {
      this.launchSurvey();
      let currentEpoch = moment().valueOf();
      this.storage.update(storageKeys.lastSurveyDate, currentEpoch);
      this.storage.update(storageKeys.doNotShowAgain, false);
    } else if (selection === "Don't Show Again") {
      this.storage.update(storageKeys.doNotShowAgain, true);
    }
  }

  private async launchSurvey() {
    const packageMetadata = await readPkgUp();

    let extensionVersion = packageMetadata
      ? packageMetadata.packageJson.version
      : "<none>";

    const query = querystring.stringify({
      platform: encodeURIComponent(osName()),
      vscodeVersion: encodeURIComponent(vscode.version),
      extensionVersion: encodeURIComponent(extensionVersion),
      machineId: encodeURIComponent(env.machineId),
    });
    const url = `https://forms.gle/eP2mtQ8Jmra4pZBP7?${query}`;
    env.openExternal(Uri.parse(url));
  }
}
