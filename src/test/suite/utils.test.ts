import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../utils';
import * as vscode from 'vscode';

suite('Utils', () => {

  const arr = [1, 2, 3];
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('showQuickPick', () => {
    test('showQuickPickWithValues shows expected items and returns selected', async() => {
      const quickPickInstance = vscode.window.createQuickPick();
      const showSpy = sandbox.spy(quickPickInstance, 'show');
      const createQuickPickStub = sandbox.stub(vscode.window, 'createQuickPick').returns(quickPickInstance);

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

    test('showQuickPickWithItem shows expected items and returns selected', async() => {
      const quickPickInstance = vscode.window.createQuickPick();
      const showSpy = sandbox.spy(quickPickInstance, 'show');
      const createQuickPickStub = sandbox.stub(vscode.window, 'createQuickPick').returns(quickPickInstance);

      const placeholder = 'I am placeholder text';
      const items = [{
        label: 'test_label',
        description: 'test_description',
        detail: 'test_detail',
        picked: false,
        alwaysShow: false
        }, {
          label: 'another_label'
        }
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


  suite('findAsync', () => {
    test('Finds an item', async () => {
      const item = await utils.findAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value === 1);
        });
      });
      assert.strictEqual(item, 1);
    });

    test('Returns undefined when failing to find an item', async () => {
      const item = await utils.findAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value === 0);
        });
      });
      assert.strictEqual(item, undefined);
    });

    test('Returns undefined when searching an empty array', async () => {
      const item = await utils.findAsync([], (value) => {
        return new Promise((resolve) => {
          resolve(value === 0);
        });
      });
      assert.strictEqual(item, undefined);
    });
  });

  suite('filterAsync', () => {
    test('Filters an array', async () => {
      const items = await utils.filterAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value < 3);
        });
      });
      assert.deepStrictEqual(items, [1, 2]);
    });

    test('Returns empty array when all items fail the predicate', async () => {
      const item = await utils.filterAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value > 3);
        });
      });
      assert.deepStrictEqual(item, []);
    });

    test('Returns empty array when filtering an empty array', async () => {
      const item = await utils.filterAsync([], (value) => {
        return new Promise((resolve) => {
          resolve(value < 3);
        });
      });
      assert.deepStrictEqual(item, []);
    });
  });
});
