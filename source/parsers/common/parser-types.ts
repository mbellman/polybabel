import { Callback } from '../../system/types';

/**
 * @todo @description
 */
export type TokenMatch = string | RegExp | Array<string | RegExp>;

/**
 * @todo @description
 */
export type TokenMatcher = [ TokenMatch, Callback ];

/**
 * Text token regex match constants.
 */
export const Pattern = {
  WORD: /^[A-Za-z]/,
  NUMBER: /^[0-9]/,
  SYMBOL: /^[^A-Za-z0-9]/,
  ANY: /./
};
