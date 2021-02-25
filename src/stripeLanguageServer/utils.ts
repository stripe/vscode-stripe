import {Pattern} from './patterns';
import querystring from 'querystring';

// Convert an LSP language identifier to a URL param `lang` for the Stripe API Reference pages
// See https://microsoft.github.io/language-server-protocol/specification#textDocumentItem
export function getLangUrlParamFromLanguageId(languageId: string): string | null {
  switch (languageId) {
    case 'csharp':
      return 'dotnet';
    case 'javascript':
    case 'typescript':
      return 'node';
    case 'go':
    case 'java':
    case 'php':
    case 'python':
    case 'ruby':
      return languageId;
    default:
      return null;
  }
}

export function getStripeApiReferenceUrl(stripeMethod: Pattern, languageId: string) {
  const lang = getLangUrlParamFromLanguageId(languageId);
  const urlParams = {
    ...(lang ? {lang} : {}),
  };
  const paramsString = querystring.stringify(urlParams);
  const prefixedParamString = paramsString ? `?${paramsString}` : '';
  return `https://stripe.com/docs/api${stripeMethod.url}${prefixedParamString}`;
}
