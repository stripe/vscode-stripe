import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import * as vscode from 'vscode';

suite('Utils', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('showQuickPick', () => {
    test('showQuickPickWithValues shows expected items and returns selected', async () => {
      const quickPickInstance = vscode.window.createQuickPick();
      const showSpy = sandbox.spy(quickPickInstance, 'show');
      const createQuickPickStub = sandbox
        .stub(vscode.window, 'createQuickPick')
        .returns(quickPickInstance);

      const placeholder = 'I am placeholder text';
      const itemValues = ['a', 'b', 'c'];

      const selectedEvent = await (async () => {
        const selected = utils.showQuickPickWithValues(placeholder, itemValues);
        await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
        return selected;
      })();

      assert.strictEqual(createQuickPickStub.calledOnce, true);
      assert.strictEqual(showSpy.calledOnce, true);
      assert.strictEqual(quickPickInstance.placeholder, placeholder);
      const labels = quickPickInstance.items.map((x) => x.label);
      assert.deepStrictEqual(labels, itemValues);
      assert.strictEqual(selectedEvent, 'a');
    });

    test('showQuickPickWithItem shows expected items and returns selected', async () => {
      const quickPickInstance = vscode.window.createQuickPick();
      const showSpy = sandbox.spy(quickPickInstance, 'show');
      const createQuickPickStub = sandbox
        .stub(vscode.window, 'createQuickPick')
        .returns(quickPickInstance);

      const placeholder = 'I am placeholder text';
      const items = [
        {
          label: 'test_label',
          description: 'test_description',
          detail: 'test_detail',
          picked: false,
          alwaysShow: false,
        },
        {
          label: 'another_label',
        },
      ];

      const selectedEvent = await (async () => {
        const selected = utils.showQuickPickWithItems(placeholder, items);
        await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
        return selected;
      })();

      assert.strictEqual(createQuickPickStub.calledOnce, true);
      assert.strictEqual(showSpy.calledOnce, true);
      assert.strictEqual(quickPickInstance.placeholder, placeholder);
      assert.deepStrictEqual(quickPickInstance.items, items);
      assert.strictEqual(selectedEvent, 'test_label');
    });
  });
});
