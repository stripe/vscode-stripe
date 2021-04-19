import * as assert from 'assert';
import * as vscode from 'vscode';
import {SURVEY_VERSION, StorageKeys, SurveyPrompt} from '../../src/surveyPrompt';
import {TestMemento, mocks} from '../mocks/vscode';
import {fn as momentProto} from 'moment';

import sinon from 'sinon';

suite('surveyPrompt', () => {
  let sandbox: sinon.SinonSandbox;
  let extensionContext: vscode.ExtensionContext;
  let globalState: vscode.Memento;

  setup(() => {
    sandbox = sinon.createSandbox();
    globalState = new TestMemento();
    extensionContext = {...mocks.extensionContextMock, globalState: globalState};
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('shouldShowBanner', () => {
    test('should show banner when all conditions are met', () => {
      const surveyPrompt = new SurveyPrompt(extensionContext);
      sandbox.stub(surveyPrompt, 'tookSurveyRecently').returns(false);
      sandbox.stub(surveyPrompt, 'tookMostRecentVersionOfSurvey').returns(false);
      sandbox.stub(SurveyPrompt, 'getRandomInt').returns(1);

      assert.strictEqual(surveyPrompt.shouldShowBanner(), true);
    });

    test('should not show banner if doNoShowAgain is true', () => {
      globalState.update(StorageKeys.doNotShowAgain, true);
      const surveyPrompt = new SurveyPrompt(extensionContext);
      const recentSpy = sandbox.spy(surveyPrompt, 'tookSurveyRecently');
      const versionSpy = sandbox.spy(surveyPrompt, 'tookMostRecentVersionOfSurvey');
      const randomSpy = sandbox.spy(SurveyPrompt, 'getRandomInt');

      assert.strictEqual(surveyPrompt.shouldShowBanner(), false);
      assert.strictEqual(recentSpy.callCount, 0);
      assert.strictEqual(versionSpy.callCount, 0);
      assert.strictEqual(randomSpy.callCount, 0);
    });

    test('should not show banner if tookSurveyRecently is true', () => {
      const surveyPrompt = new SurveyPrompt(extensionContext);
      sandbox.stub(surveyPrompt, 'tookSurveyRecently').returns(true);
      const versionSpy = sandbox.spy(surveyPrompt, 'tookMostRecentVersionOfSurvey');
      const randomSpy = sandbox.spy(SurveyPrompt, 'getRandomInt');

      assert.strictEqual(surveyPrompt.shouldShowBanner(), false);
      assert.strictEqual(versionSpy.callCount, 0);
      assert.strictEqual(randomSpy.callCount, 0);
    });

    test('should not show banner if tookMostRecentVersionOfSurvey is true', () => {
      const surveyPrompt = new SurveyPrompt(extensionContext);
      sandbox.stub(surveyPrompt, 'tookSurveyRecently').returns(true);
      sandbox.stub(surveyPrompt, 'tookMostRecentVersionOfSurvey').returns(true);
      const randomSpy = sandbox.spy(SurveyPrompt, 'getRandomInt');

      assert.strictEqual(surveyPrompt.shouldShowBanner(), false);
      assert.strictEqual(randomSpy.callCount, 0);
    });

    test('should not show banner if not in 20%', () => {
      const surveyPrompt = new SurveyPrompt(extensionContext);
      sandbox.stub(surveyPrompt, 'tookSurveyRecently').returns(true);
      sandbox.stub(surveyPrompt, 'tookMostRecentVersionOfSurvey').returns(true);
      sandbox.stub(SurveyPrompt, 'getRandomInt').returns(30);

      assert.strictEqual(surveyPrompt.shouldShowBanner(), false);
    });
  });

  suite('tookMostRecentVersionOfSurvey', () => {
    test('returns false if survey was never taken', () => {
      const surveyPrompt = new SurveyPrompt(extensionContext);
      assert.strictEqual(surveyPrompt.tookMostRecentVersionOfSurvey(), false);
    });

    test('returns false if older version of survey was taken', () => {
      globalState.update(StorageKeys.lastSurveyVersionTaken, SURVEY_VERSION - 0.1);
      const surveyPrompt = new SurveyPrompt(extensionContext);
      assert.strictEqual(surveyPrompt.tookMostRecentVersionOfSurvey(), false);
    });

    // Can remove this test case when surveyVersion > 1.0
    test('returns true if survey was taken before new field', () => {
      globalState.update(StorageKeys.lastSurveyDate, 10000);
      const surveyPrompt = new SurveyPrompt(extensionContext);
      assert.strictEqual(surveyPrompt.tookMostRecentVersionOfSurvey(), true);
    });

    test('returns true if most recent version was taken', () => {
      globalState.update(StorageKeys.lastSurveyVersionTaken, SURVEY_VERSION);
      const surveyPrompt = new SurveyPrompt(extensionContext);
      assert.strictEqual(surveyPrompt.tookMostRecentVersionOfSurvey(), true);
    });
  });

  suite('updateSurveySettings', () => {
    test('saves expected settings', () => {
      sandbox.stub(momentProto, 'valueOf').returns(1000);
      const surveyPrompt = new SurveyPrompt(extensionContext);
      surveyPrompt.updateSurveySettings();

      assert.strictEqual(surveyPrompt.storage.get(StorageKeys.lastSurveyDate), 1000);
      assert.strictEqual(
        surveyPrompt.storage.get(StorageKeys.lastSurveyVersionTaken),
        SURVEY_VERSION,
      );
      assert.notStrictEqual(surveyPrompt.storage.get(StorageKeys.doNotShowAgain), true);
    });
  });
});
