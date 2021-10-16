import * as assert from 'assert';
import * as javaClientUtils from '../../src/stripeJavaLanguageClient/utils';
import {CancellationToken, MarkdownString, Position, TextDocument} from 'vscode';
import {getMockJavaServerOptions, mocks} from '../mocks/vscode';
import {JavaHoverProvider} from '../../src/stripeJavaLanguageClient/hoverProvider';
import {LanguageClient} from 'vscode-languageclient';
import sinon from 'ts-sinon';

const getServerResponse = (isClientSdk: boolean): any => {
  if (isClientSdk) {
    return {
      contents: [{value: 'FileLink com.stripe.model.FileLink.create()'}],
    };
  }
  return {
    contents: [{value: 'com.stripe.net.xxx'}],
  };
};

suite('javaHoverProvider', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('provideHover', () => {
    let languageClient: LanguageClient;
    let document: TextDocument;
    let position: Position;
    let token: CancellationToken;

    setup(() => {
      languageClient = new LanguageClient(
        'java',
        'Test Language Client',
        getMockJavaServerOptions(),
        mocks.javaClientOptions,
      );
      sandbox.stub(languageClient.code2ProtocolConverter, 'asTextDocumentIdentifier');
      sandbox.stub(languageClient.code2ProtocolConverter, 'asPosition');
    });

    test('retrieve api deep link for stripe java method', async () => {
      const javaHoverProvider = new JavaHoverProvider(languageClient);
      const expectedApiDocLink = 'https://stripe.com/docs/api/file_links/create';

      sandbox.stub(languageClient, 'sendRequest').returns(Promise.resolve(getServerResponse(true)));
      sandbox.stub(javaClientUtils, 'getJavaApiDocLink').returns(expectedApiDocLink);
      sandbox.stub(javaHoverProvider, 'getContributedHoverCommands').returns(Promise.resolve([]));
      sandbox.stub(languageClient.protocol2CodeConverter, 'asHover').returns({contents: []});
      const hoverContent = await javaHoverProvider.provideHover(document, position, token);

      if (!!hoverContent) {
        const contentMarktdown: MarkdownString = hoverContent.contents[0] as MarkdownString;
        assert.strictEqual(
          contentMarktdown.value,
          `See this method in the [Stripe API Reference](${expectedApiDocLink})`,
        );
      } else {
        throw new assert.AssertionError();
      }
    });

    test('no api deep link for internal stripe method', async () => {
      const javaHoverProvider = new JavaHoverProvider(languageClient);
      const apiDocLink = 'https://stripe.com/docs/api/file_links/create';

      sandbox
        .stub(languageClient, 'sendRequest')
        .returns(Promise.resolve(getServerResponse(false)));
      sandbox.stub(javaClientUtils, 'getJavaApiDocLink').returns(apiDocLink);
      sandbox.stub(javaHoverProvider, 'getContributedHoverCommands').returns(Promise.resolve([]));
      sandbox.stub(languageClient.protocol2CodeConverter, 'asHover').returns({contents: []});
      const hoverContent = await javaHoverProvider.provideHover(document, position, token);

      if (!!hoverContent) {
        assert.strictEqual(hoverContent.contents.length, 0);
      } else {
        throw new assert.AssertionError();
      }
    });

    test('no api deep link for unknown stripe method', async () => {
        const javaHoverProvider = new JavaHoverProvider(languageClient);

        sandbox
          .stub(languageClient, 'sendRequest')
          .returns(Promise.resolve(getServerResponse(true)));
        sandbox.stub(javaClientUtils, 'getJavaApiDocLink').returns('');
        sandbox.stub(javaHoverProvider, 'getContributedHoverCommands').returns(Promise.resolve([]));
        sandbox.stub(languageClient.protocol2CodeConverter, 'asHover').returns({contents: []});
        const hoverContent = await javaHoverProvider.provideHover(document, position, token);

        if (!!hoverContent) {
          assert.strictEqual(hoverContent.contents.length, 0);
        } else {
          throw new assert.AssertionError();
        }
      });
  });
});
