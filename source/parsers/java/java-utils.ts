import { IToken, TokenType } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { ParserUtils } from '../common/parser-utils';
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

  export function isVariable ({ type, nextToken }: IToken): boolean {
    return (
      type === TokenType.WORD && (
        TokenUtils.isWord(nextToken) ||
        ParserUtils.tokenMatches(nextToken, /[<[]/)
      )
    );
  }

  export function isInstantiation (token: IToken): boolean {
    return ParserUtils.tokenMatches(token, JavaConstants.Keyword.NEW);
  }

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
}
