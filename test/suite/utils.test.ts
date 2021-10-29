import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import * as vscode from 'vscode';
const proxyquire = require('proxyquire');
const modulePath = '../../src/utils';

const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

suite('Utils', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('getUserAgent', () => {
    let module: {getUserAgent: () => any};

    setup(() => {
      module = setupProxies({
        vscode: {
          version: 2,
        },
      });
    });

    test('getUserAgent returns user agent', () => {
      const mockExtension = <vscode.Extension<any>>{
        id: 'my-extension',
        packageJSON: {version: 1},
      };
      sandbox.stub(vscode.extensions, 'getExtension').returns(mockExtension);
      const userAgent = module.getUserAgent();
      assert.strictEqual(userAgent, 'my-extension/1 vscode/2');
    });

    test('getUserAgent returns blank when getExtension returns nothing', () => {
      sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);
      const userAgent = module.getUserAgent();
      assert.strictEqual(userAgent, '');
    });

    test('getUserAgent does not error when packgeJSON does not exist', () => {
      const mockExtension = <vscode.Extension<any>>{
        id: 'my-extension',
      };
      sandbox.stub(vscode.extensions, 'getExtension').returns(mockExtension);
      const userAgent = module.getUserAgent();
      assert.strictEqual(userAgent, 'my-extension/undefined vscode/2');
    });

    test('getUserAgent does not error when packgeJSON does not contain version', () => {
      const mockExtension = <vscode.Extension<any>>{
        id: 'my-extension',
        packageJSON: {},
      };
      sandbox.stub(vscode.extensions, 'getExtension').returns(mockExtension);
      const userAgent = module.getUserAgent();
      assert.strictEqual(userAgent, 'my-extension/undefined vscode/2');
    });
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

  suite('vaiidateFixtureEvent', () => {
    test('valid fixture event returns no error', () => {
        const content = `
          {
            "fixtures": [
              {
                "name": "customer",
                "path": "/v1/customers",
                "method": "post",
                "params": {
                  "description": "(created by Stripe CLI)",
                  "source": "tok_visa"
                }
              }
            ]
          }
        `;
        assert.strictEqual(utils.validateFixtureEvent(content), '');
    });

    test('valid fixture event with extra properties returns no error', () => {
      const content = `
        {
          "_meta": {
            "template_version": 0
          },
          "fixtures": [
            {
              "name": "customer",
              "path": "/v1/customers",
              "method": "post",
              "params": {
                "description": "(created by Stripe CLI)",
                "source": "tok_visa"
              }
            }
          ]
        }
      `;
      assert.strictEqual(utils.validateFixtureEvent(content), '');
    });

    test('valid fixture event with multiple fixtures returns no error', () => {
      const content = `
        {
          "_meta": {
            "template_version": 0
          },
          "fixtures": [
            {
              "name": "customer",
              "path": "/v1/customers",
              "method": "post",
              "params": {
                "description": "(created by Stripe CLI)",
                "source": "tok_visa"
              }
            },
            {
              "name": "invoiceitem",
              "path": "/v1/invoiceitems",
              "method": "post",
              "params": {
                "amount": 2000,
                "currency": "usd",
                "customer": "cust_123",
                "description": "(created by Stripe CLI)"
              }
            }
          ]
        }
      `;
      assert.strictEqual(utils.validateFixtureEvent(content), '');
    });

    test('fixture missing name property returns correct error message', () => {
      const content = `
        {
          "fixtures": [
            {
              "name": "customer",
              "path": "/v1/customers",
              "method": "post",
              "params": {
                "description": "(created by Stripe CLI)",
                "source": "tok_visa"
              }
            },
            {
              "path": "/v1/invoiceitems",
              "method": "post",
              "params": {
                "amount": 2000,
                "currency": "usd",
                "customer": "cust_123",
                "description": "(created by Stripe CLI)"
              }
            }
          ]
        }
      `;
      assert.strictEqual(
        utils.validateFixtureEvent(content),
        'Property "name" missing at fixture position 1.'
      );
    });

    test('fixture missing path property returns correct error message', () => {
      const content = `
        {
          "fixtures": [
            {
              "name": "customer",
              "path": "/v1/customers",
              "method": "post",
              "params": {
                "description": "(created by Stripe CLI)",
                "source": "tok_visa"
              }
            },
            {
              "name": "invoiceitem",
              "method": "post",
              "params": {
                "amount": 2000,
                "currency": "usd",
                "customer": "cust_123",
                "description": "(created by Stripe CLI)"
              }
            }
          ]
        }
      `;
      assert.strictEqual(
        utils.validateFixtureEvent(content),
        'Property "path" missing at fixture position 1.'
      );
    });

    test('fixture missing method property returns correct error message', () => {
      const content = `
        {
          "fixtures": [
            {
              "name": "customer",
              "path": "/v1/customers",
              "method": "post",
              "params": {
                "description": "(created by Stripe CLI)",
                "source": "tok_visa"
              }
            },
            {
              "name": "invoiceitem",
              "path": "/v1/invoiceitems",
              "params": {
                "amount": 2000,
                "currency": "usd",
                "customer": "cust_123",
                "description": "(created by Stripe CLI)"
              }
            }
          ]
        }
      `;
      assert.strictEqual(
        utils.validateFixtureEvent(content),
        'Property "method" missing at fixture position 1.'
      );
    });

    test('invalid JSON format returns correct error message', () => {
      const content = `
        {
          "fixtures": [
            {
              "name": "customer",
              "path": "/v1/customers",
              "method": "post"
              }
      `;
      assert.strictEqual(
        utils.validateFixtureEvent(content).indexOf('Failed to parse the JSON file.'),
        0
      );
  });
  });
});
