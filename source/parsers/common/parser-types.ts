import { Callback } from '../../system/types';

/**
 * @todo @description
 */
export type TokenMatch = string | RegExp | Array<string | RegExp>;

/**
 * @todo @description
 */
export type TokenMatcher = [ TokenMatch, Callback ];
