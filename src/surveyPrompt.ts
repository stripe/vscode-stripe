import * as vscode from "vscode";
import moment from "moment";

enum storageKeys {
  doNotShowAgain = "stripeDoNotShowAgain",
  lastSurveyDate = "stripeLastSurveyDate",
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export class SurveyPrompt {
  storage: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.storage = context.globalState;
  }

  public async activate(): Promise<void> {
    const show = this.shouldShowBanner();
    if (!show) {
      return;
    }

    setTimeout(this.showSurvey, 60 * 1000 * 5); // Wait 5 minutes to show survey to avoid showing upon initial activation.
  }

  public shouldShowBanner(): boolean {
    if (this.storage.get(storageKeys.doNotShowAgain)) {
      return false;
    }

    // Only sample people took the survey more than 12 weeks ago
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

    // Only sample 20% of people to avoid spam
    const randomSample: number = getRandomInt(100);
    if (randomSample >= 20) {
      return false;
    }

    return true;
  }

  public async showSurvey() {
    const prompts = ["Take survey", "Maybe later", "Don't Show Again"];

    const selection = await vscode.window.showInformationMessage(
      "Got 2 minutes to tell us how the Stripe extension is working for you?",
      ...prompts
    );

    if (!selection) {
      return;
    }

    if (selection === "Take survey") {
      vscode.commands.executeCommand("stripe.openSurvey");
      let currentEpoch = moment().valueOf();
      this.storage.update(storageKeys.lastSurveyDate, currentEpoch);
      this.storage.update(storageKeys.doNotShowAgain, false);
    } else if (selection === "Don't Show Again") {
      this.storage.update(storageKeys.doNotShowAgain, true);
    }
  }
}
