import { Callback } from '../../system/types';
import { IToken } from '../../tokenizer/types';

/**
 * A string, regex pattern, or token predicate function to match
 * against a token.
 *
 * @internal
 */
type BaseTokenMatch = string | RegExp | TokenPredicate;

/**
 * A function which returns a boolean depending on certain token
 * characteristics.
 */
export type TokenPredicate = Callback<IToken, boolean>;

/**
 * Either a single base token match or an array of base token
 * matches which can contain any type in the union.
 */
export type TokenMatch = BaseTokenMatch | Array<BaseTokenMatch>;

/**
 * A 2-tuple containing a token match to match against tokens
 * in a parsing stream, and a callback to fire if a matching
 * token is encountered.
 */
export type TokenMatcher = [ TokenMatch, Callback ];
