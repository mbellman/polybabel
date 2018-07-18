import AbstractParser from './AbstractParser';
import { Callback } from '../../system/types';
import { Constructor } from 'trampoline-framework';
import { ISyntaxNode } from './syntax-types';
import { IToken, ITokenRange } from '../../tokenizer/types';

/**
 * A string, regex pattern, or token predicate function to match
 * against a token.
 *
 * @internal
 */
type BaseTokenMatch = string | RegExp | TokenPredicate;

/**
 * Constants representing the type of behavior for a token matcher
 * added to a parser class via decoration.
 *
 * EXPECT - Requires the current token in the parsing stream to
 *  satisfy its token matcher.
 *
 * ALLOW - Allows, but does not require, the current token in
 *  the parsing stream to satisfy its token matcher.
 *
 * MATCH - Once EXPECT and ALLOW token matchers have been exhausted,
 *  used to handle additional tokens in the parsing stream. If
 *  a new token doesn't satisfy any MATCH-type token matchers,
 *  the parser halts.
 */
export const enum TokenMatcherType {
  EXPECT,
  ALLOW,
  MATCH
}

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
 * in a parsing stream, and the name of the parser method to
 * fire if a matching token is encountered.
 */
export type TokenMatcher = [ TokenMatch, string ];

/**
 * A special static field key used by parser classes. The field
 * contains an array of IDecoratedTokenMatcher objects which
 * determines either starting token match or stream token match
 * behavior. The token matches are supplied by decorators.
 *
 * @see IDecoratedTokenMatcher
 * @see parser-decorators.ts
 */
export type DecoratedTokenMatcherField = 'starterMatchers' | 'streamMatchers';

/**
 * An object containing both a token matcher and a token matcher
 * type to determine the nature of the matcher.
 *
 * @see TokenMatcherType
 * @see parser-decorators.ts
 */
export interface IDecoratedTokenMatcher {
  tokenMatcher: TokenMatcher;
  type: TokenMatcherType;
}

/**
 * @todo @description
 */
export interface ISanitizer {
  match: TokenMatch;
  parser: Constructor<AbstractParser>;
}

/**
 * @todo @description
 */
export interface IDecoratedParser {
  starterMatchers: IDecoratedTokenMatcher[];
  streamMatchers: IDecoratedTokenMatcher[];
  sanitizers: ISanitizer[];
  isSingleLineParser: boolean;
}

/**
 * @todo @description
 */
export interface IParseSequenceConfiguration<V extends ISyntaxNode> {
  ValueParser: Constructor<AbstractParser<V>>;
  delimiter: TokenMatch;
  terminator: TokenMatch;
}

/**
 * @todo @description
 */
export interface IParserError {
  message: string;
  tokenRange?: ITokenRange;
}
