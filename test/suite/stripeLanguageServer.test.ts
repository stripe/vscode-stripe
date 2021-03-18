import * as assert from 'assert';
import * as utils from '../../src/stripeLanguageServer/utils';
import {stripeMethodList} from '../../src/stripeLanguageServer/patterns';

suite('Stripe language server', () => {
  suite('API Reference URL', () => {
    test('Should get Stripe API Reference URL with the right language preset', () => {
      const stripeMethod = stripeMethodList[0];
      [
        ['csharp', 'dotnet'],
        ['javascript', 'node'],
        ['typescript', 'node'],
        ['go', 'go'],
        ['java', 'java'],
        ['php', 'php'],
        ['python', 'python'],
        ['ruby', 'ruby'],
      ].forEach(([languageId, langUrlParam]) => {
        assert.strictEqual(
          utils.getStripeApiReferenceUrl(stripeMethod, languageId),
          `https://stripe.com/docs/api/balance/balance_retrieve?lang=${langUrlParam}`,
        );
      });
    });

    test('Should get Stripe API Reference URL without a language preset if language is not supported', () => {
      const stripeMethod = stripeMethodList[0];
      assert.strictEqual(
        utils.getStripeApiReferenceUrl(stripeMethod, 'unsupportedLanguage'),
        'https://stripe.com/docs/api/balance/balance_retrieve',
      );
    });
  });
});
