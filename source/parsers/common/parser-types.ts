import AbstractParser from './AbstractParser';
import { Callback } from '../../system/types';
import { ISyntaxNode, ISyntaxTree } from './syntax-types';

/**
 * Any parsed syntax object, whether an individual syntax
 * node or a full syntax tree.
 */
export type ParsedSyntax = ISyntaxNode<any> | ISyntaxTree<any>;

/**
 * A callback function which receives an AbstractParser
 * subclass instance.
 */
export type ParserHandler<A extends AbstractParser> = Callback<A>;

/**
 * A 2-tuple used for token value matching and handling.
 * The first slot contains a string, regex pattern, or
 * array of strings/regex patterns to match, and the
 * second contains a ParserHandler for an AbstractParser
 * subclass A.
 *
 * Arrays of TokenMatchers are statically provided on
 * AbstractParser subclasses and used during parsing to
 * determine behavior when certain tokens are encountered
 * during the token stream.
 */
export type TokenMatcher<A extends AbstractParser = AbstractParser> = [
  (string | RegExp | Array<string | RegExp>),
  (ParserHandler<A> | keyof A)
];
