import AbstractParser from './AbstractParser';
import { Callback } from '../../system/types';
import { ISyntaxNode, ISyntaxTree } from './syntax-types';

/**
 * Any parsed syntax object, whether an individual syntax
 * node or a full syntax tree.
 */
export type ParsedSyntax = ISyntaxNode | ISyntaxTree;

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
 * subclass A - or merely the name of the subclass or
 * AbstractParser base method to call.
 *
 * Arrays of TokenMatchers are provided in @Parser()
 * configuration objects to control parser behavior
 * when matching specific tokens.
 */
export type TokenMatcher<A extends AbstractParser = AbstractParser> = [
  (string | RegExp | Array<string | RegExp>),
  (ParserHandler<A> | keyof A)
];
