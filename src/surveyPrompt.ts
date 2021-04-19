import * as vscode from 'vscode';
import moment from 'moment';

/**
 * Google Forms does not support versions of forms so this version is purely made up by us
 * to avoid spamming users when the survey has not changed since they last took it.
 */
export const SURVEY_VERSION = 1.0;

export enum StorageKeys {
  doNotShowAgain = 'stripeDoNotShowAgain',
  lastSurveyDate = 'stripeLastSurveyDate',
  lastSurveyVersionTaken = 'stripeLastSurveyVersionTaken',
}

export class SurveyPrompt {
  storage: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    // Global state so we don't re-prompt across each workspace the user has.
    this.storage = context.globalState;
  }

  public activate(): void {
    const show = this.shouldShowBanner();
    if (!show) {
      return;
    }

    setTimeout(this.showSurvey, 60 * 1000 * 5); // Wait 5 minutes to show survey to avoid showing upon initial activation.
  }

  public shouldShowBanner(): boolean {
    if (this.storage.get(StorageKeys.doNotShowAgain)) {
      return false;
    }

    // Only sample people took the survey more than 12 weeks ago
    if (this.tookSurveyRecently()) {
      return false;
    }

    // Only sample people who have not taken the latest version of the survey.
    if (this.tookMostRecentVersionOfSurvey()) {
      return false;
    }

    // Only sample 20% of people to avoid spam
    const randomSample: number = SurveyPrompt.getRandomInt(100);
    if (randomSample >= 20) {
      return false;
    }

    return true;
  }

  tookSurveyRecently(): boolean {
    const lastSurveyDateEpoch = this.storage.get(StorageKeys.lastSurveyDate) as number;

    if (lastSurveyDateEpoch) {
      const lastSurveyDate = moment(lastSurveyDateEpoch);
      const currentDate = moment();

      if (currentDate.diff(lastSurveyDate, 'weeks') < 12) {
        return true;
      }
    }

    return false;
  }

  tookMostRecentVersionOfSurvey(): boolean {
    let lastSurveyVersionTaken = this.storage.get(StorageKeys.lastSurveyVersionTaken, 0.0);

    // Edge case we can remove when we update the survey version.
    // Beacuse this field was introduced later, if the lastSurveyDate is present,
    // they've taken 1.0
    if (lastSurveyVersionTaken === 0.0 && this.storage.get(StorageKeys.lastSurveyDate)) {
      lastSurveyVersionTaken = 1.0;
    }

    return lastSurveyVersionTaken >= SURVEY_VERSION;
  }

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  showSurvey = async () => {
    const prompts = ['Take survey', 'Maybe later', "Don't Show Again"];

    const selection = await vscode.window.showInformationMessage(
      'Got 2 minutes to tell us how the Stripe extension is working for you?',
      ...prompts,
    );

    if (!selection) {
      return;
    }

    if (selection === 'Take survey') {
      vscode.commands.executeCommand('stripe.openSurvey');
    } else if (selection === "Don't Show Again") {
      this.storage.update(StorageKeys.doNotShowAgain, true);
    }
  };

  /**
   * Update details of survey settings upon survey taking.
   */
  updateSurveySettings = () => {
    const currentEpoch = moment().valueOf();
    this.storage.update(StorageKeys.lastSurveyDate, currentEpoch);
    this.storage.update(StorageKeys.lastSurveyVersionTaken, SURVEY_VERSION);
    this.storage.update(StorageKeys.doNotShowAgain, false);
  };
}
