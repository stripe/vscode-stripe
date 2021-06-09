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

  suite('camelToSnakeCase', () => {
    test('converts camel case to snake case', () => {
      // noop
      assert.strictEqual(utils.camelToSnakeCase('foobar'), 'foobar');
      assert.strictEqual(utils.camelToSnakeCase('foo_bar'), 'foo_bar');

      // two words
      assert.strictEqual(utils.camelToSnakeCase('fooBar'), 'foo_bar');
      assert.strictEqual(utils.camelToSnakeCase('foobaR'), 'fooba_r');
      assert.strictEqual(utils.camelToSnakeCase('Foobar'), '_foobar'); // not valid camel case

      // more than two words
      assert.strictEqual(utils.camelToSnakeCase('fooBarBaz'), 'foo_bar_baz');
      assert.strictEqual(
        utils.camelToSnakeCase('fooBarBazQuxQuuxQuuzCorge'),
        'foo_bar_baz_qux_quux_quuz_corge',
      );
    });
  });

  suite('recursivelyRenameKeys', () => {
    test('recursively renames keys', () => {
      // noop
      assert.deepStrictEqual(
        utils.recursivelyRenameKeys('foo', (str: string) => str),
        'foo',
      );

      // single level
      assert.deepStrictEqual(
        utils.recursivelyRenameKeys({foo: 'foo', bar: 'bar'}, (str: string) => `${str}_renamed`),
        {
          foo_renamed: 'foo',
          bar_renamed: 'bar',
        },
      );

      // with array
      assert.deepStrictEqual(
        utils.recursivelyRenameKeys(
          {foo: [{bar: 'bar'}, {baz: 'baz'}]},
          (str: string) => `${str}_renamed`,
        ),
        {
          foo_renamed: [{bar_renamed: 'bar'}, {baz_renamed: 'baz'}],
        },
      );

      // wide
      assert.deepStrictEqual(
        utils.recursivelyRenameKeys(
          {foo: 'foo', bar: {baz: 'baz'}, qux: {quux: 'quux'}, corge: {grault: 'grault'}},
          (str: string) => `${str}_renamed`,
        ),
        {
          foo_renamed: 'foo',
          bar_renamed: {baz_renamed: 'baz'},
          qux_renamed: {quux_renamed: 'quux'},
          corge_renamed: {grault_renamed: 'grault'},
        },
      );

      // deep
      assert.deepStrictEqual(
        utils.recursivelyRenameKeys(
          {foo: 'foo', bar: {baz: {qux: {quux: {corge: 'grault'}}}}},
          (str: string) => `${str}_renamed`,
        ),
        {
          foo_renamed: 'foo',
          bar_renamed: {baz_renamed: {qux_renamed: {quux_renamed: {corge_renamed: 'grault'}}}},
        },
      );
    });
  });

  suite('emptyStringToNull', () => {
    test('converts empty string to null', () => {
      // convert to null
      assert.strictEqual(utils.emptyStringToNull(''), null);

      // noop
      assert.strictEqual(utils.emptyStringToNull('foo'), 'foo');
      assert.strictEqual(utils.emptyStringToNull(null), null);
      assert.strictEqual(utils.emptyStringToNull(undefined), undefined);
      assert.strictEqual(utils.emptyStringToNull(0), 0);
      assert.strictEqual(utils.emptyStringToNull(1), 1);
      assert.strictEqual(utils.emptyStringToNull(true), true);
      assert.strictEqual(utils.emptyStringToNull(false), false);
      assert.deepStrictEqual(utils.emptyStringToNull([]), []);
      assert.deepStrictEqual(utils.emptyStringToNull(['']), ['']);
      assert.deepStrictEqual(utils.emptyStringToNull({}), {});
      assert.deepStrictEqual(utils.emptyStringToNull({foo: ''}), {foo: ''});
    });
  });

  suite('recursivelyMapValues', () => {
    test('recursively maps values', () => {
      const testFn = (str: any) => {
        if (typeof str === 'string') {
          return `${str}_renamed`;
        }
        return str;
      };

      // non-objects
      assert.deepStrictEqual(utils.recursivelyMapValues(1, testFn), 1);
      assert.deepStrictEqual(utils.recursivelyMapValues('foo', testFn), 'foo_renamed');

      // single level
      assert.deepStrictEqual(utils.recursivelyMapValues({foo: 'foo', bar: 'bar', baz: 1}, testFn), {
        foo: 'foo_renamed',
        bar: 'bar_renamed',
        baz: 1,
      });

      // with array
      assert.deepStrictEqual(
        utils.recursivelyMapValues({foo: [{bar: 'bar'}, {baz: 'baz'}, {qux: 1}]}, testFn),
        {
          foo: [{bar: 'bar_renamed'}, {baz: 'baz_renamed'}, {qux: 1}],
        },
      );

      // wide
      assert.deepStrictEqual(
        utils.recursivelyMapValues(
          {foo: 'foo', bar: {baz: 'baz'}, qux: {quux: 'quux'}, corge: {grault: 1}},
          testFn,
        ),
        {
          foo: 'foo_renamed',
          bar: {baz: 'baz_renamed'},
          qux: {quux: 'quux_renamed'},
          corge: {grault: 1},
        },
      );

      // deep
      assert.deepStrictEqual(
        utils.recursivelyMapValues(
          {foo: 'foo', bar: {baz: {qux: {quux: {corge: 'grault'}}}}},
          testFn,
        ),
        {
          foo: 'foo_renamed',
          bar: {baz: {qux: {quux: {corge: 'grault_renamed'}}}},
        },
      );
    });
  });
});
