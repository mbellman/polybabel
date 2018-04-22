import { IToken } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { ParserUtils } from '../common/parser-utils';
import { TokenPredicate } from '../common/parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * Determines whether a token corresponds to the beginning
 * of a type name declaration.
 *
 * @example
 *
 *  Type type
 *  Type[
 *  Type<
 *
 * @internal
 */
function isStringTypeName (token: IToken): boolean {
  return (
    TokenUtils.isWord(token) && (
      TokenUtils.isWord(token.nextToken) ||
      ParserUtils.tokenMatches(token.nextToken, /[<[]/)
    )
  );
}

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
   * a type name denoted either by a string or property chain,
   * such as a type in a namespace.
   *
   * @example
   *
   *  Type type
   *  Type<
   *  Type[
   *  Namespace.Type type
   *  Namespace.Type<
   *  Namespace.Type[
   */
  export function isTypeName (token: IToken): boolean {
    if (!TokenUtils.isWord(token)) {
      return false;
    }

    if (isStringTypeName(token)) {
      // The most common type declarations will be those
      // with non-namespaced names, so we can optimize
      // slightly by checking for these first
      return true;
    }

    while (isPropertyChain(token)) {
      token = token.nextToken;
    }

    return isStringTypeName(token);
  }

  /**
   * Determines whether a token corresponds to the beginning or
   * part of a property chain.
   *
   * @example
   *
   *  object.
   *  .property
   */
  export function isPropertyChain (token: IToken): boolean {
    const isPropertyName = TokenUtils.isWord(token) && ParserUtils.tokenMatches(token.nextToken, '.');
    const isPropertyDelimiter = ParserUtils.tokenMatches(token, '.') && TokenUtils.isWord(token.nextToken);

    return isPropertyName || isPropertyDelimiter;
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of a function call.
   *
   * @example
   *
   *  callFunction(
   */
  export function isFunctionCall (token: IToken): boolean {
    return (
      TokenUtils.isWord(token) &&
      ParserUtils.tokenMatches(token.nextToken, '(')
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
