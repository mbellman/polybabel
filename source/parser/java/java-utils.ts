import { IToken } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { ParserUtils } from '../common/parser-utils';
import { TokenPredicate } from '../common/parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

export namespace JavaUtils {
  export function isAccessModifierKeyword (word: string): boolean {
    return JavaConstants.AccessModifiers.indexOf(word) > -1;
  }

  export function isModifierKeyword (word: string): boolean {
    return JavaConstants.Modifiers.indexOf(word) > -1;
  }

  export function isReservedWord (word: string): boolean {
    return JavaConstants.ReservedWords.indexOf(word) > -1;
  }

  export function isClauseKeyword (word: string): boolean {
    return JavaConstants.Clauses.indexOf(word) > -1;
  }

  /**
   * Determines whether a token corresponds to the beginning of
   * a type. Uses a maximum of two token lookaheads to distinguish
   * [] types from property chains using brackets.
   *
   * @example
   *
   *  Type type
   *  Type<
   *  Type[]
   */
  export function isType (token: IToken): boolean {
    return (
      TokenUtils.isWord(token) &&
      // Type type
      TokenUtils.isWord(token.nextToken) ||
      // Type<
      ParserUtils.tokenMatches(token.nextToken, '<') ||
      // Type[]
      ParserUtils.tokenMatches(token.nextToken, '[') &&
      ParserUtils.tokenMatches(token.nextToken.nextToken, ']')
    );
  }

  /**
   * Determines whether a token corresponds to the beginning or part
   * of a property chain. Uses two token lookaheads to distinguish
   * property chains using brackets from [] types.
   *
   * @example
   *
   *  object.
   *  object[
   */
  export function isPropertyChain (token: IToken): boolean {
    // object. OR object[
    return (
      TokenUtils.isWord(token) &&
      ParserUtils.tokenMatches(token.nextToken, /[.[]/) &&
      // Avoid confusion with token patterns of the form
      // Object[], which signify array types
      !ParserUtils.tokenMatches(token.nextToken.nextToken, ']')
    );
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of a function call.
   *
   * @example
   *
   *  callFunction(
   *  ](
   *  )(
   */
  export function isFunctionCall (token: IToken): boolean {
    return (
      // callFunction(
      TokenUtils.isWord(token) &&
      ParserUtils.tokenMatches(token.nextToken, '(')
    ) || (
      // ]( OR )(
      ParserUtils.tokenMatches(token.previousToken, /[\])]/) &&
      ParserUtils.tokenMatches(token, '(')
    );
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of a literal declaration.
   *
   * @example
   *
   *  5
   *  '
   *  "
   *  {
   *  true
   *  false
   *  null
   */
  export function isLiteral (token: IToken): boolean {
    return (
      TokenUtils.isNumber(token) ||
      ParserUtils.tokenMatches(token, /["'{]/) ||
      ParserUtils.tokenMatches(token, [
        JavaConstants.Keyword.TRUE,
        JavaConstants.Keyword.FALSE,
        JavaConstants.Keyword.NULL,
      ])
    );
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of an instantiation.
   *
   * @example
   *
   *  new
   */
  export function isInstantiation (token: IToken): boolean {
    return ParserUtils.tokenMatches(token, JavaConstants.Keyword.NEW);
  }
}
