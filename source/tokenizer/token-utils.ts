import { Callback } from '../system/types';
import { IToken, TokenType } from './types';

export namespace TokenUtils {
  export function getPreviousToken ({ previousToken }: IToken): IToken {
    return previousToken;
  }

  export function getPreviousTextToken (token: IToken): IToken {
    while ((token = getPreviousToken(token)) && !isText(token)) { }

    return token;
  }

  export function getNextToken ({ nextToken }: IToken): IToken {
    return nextToken;
  }

  export function getNextTextToken (token: IToken): IToken {
    while ((token = getNextToken(token)) && !isText(token) && !isEOF(token)) { }

    return token;
  }

  export function isWord ({ type }: IToken): boolean {
    return type === TokenType.WORD;
  }

  export function isSymbol ({ type }: IToken): boolean {
    return type === TokenType.SYMBOL;
  }

  export function isNumber ({ type }: IToken): boolean {
    return type === TokenType.NUMBER;
  }

  export function isNewline ({ type }: IToken): boolean {
    return type === TokenType.NEWLINE;
  }

  export function isIndentation ({ type }: IToken): boolean {
    return type === TokenType.INDENTATION;
  }

  export function isEOF ({ type }: IToken): boolean {
    return type === TokenType.EOF;
  }

  export function isText (token: IToken): boolean {
    return isWord(token) || isSymbol(token) || isNumber(token);
  }

  export function isStartOfLine ({ previousToken }: IToken): boolean {
    return !previousToken || TokenUtils.isNewline(previousToken);
  }
}
