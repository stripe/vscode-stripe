/* eslint-disable no-warning-comments */
import * as path from 'path';
export interface Pattern {
  regexps: RegExpMap;
  url: string;
}

export interface RegExpMap {
  [index: string]: string;
}

// TODO: future autogen for this is possible with a couple of scripts
// eg. regexp.javascript = /balance\.retrieve, regexp.golang = /balance\.Get
// .NET is unlikely to be supported due to the service pattern, but we can link each service type to the correct API ref top section
export const stripeMethodList: Pattern[] = require(path.resolve(
  __dirname,
  '../../config/api_ref/patterns.json',
));
