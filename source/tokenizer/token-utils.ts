import { Callback } from '../system/types';
import { IToken, TokenType } from './types';

export namespace TokenUtils {
  export function getPreviousToken ({ previousToken }: IToken): IToken {
    return previousToken;
  }

  export function getPreviousCharacterToken (token: IToken): IToken {
    while ((token = getPreviousToken(token)) && !isCharacterToken(token)) { }

    return token;
  }

  export function getNextToken ({ nextToken }: IToken): IToken {
    return nextToken;
  }

  export function getNextCharacterToken (token: IToken): IToken {
    while ((token = getNextToken(token)) && !isCharacterToken(token)) { }

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

  export function isCharacterToken ({ type }: IToken): boolean {
    return type !== TokenType.NEWLINE;
  }

  export function isAtStartOfLine ({ type, previousToken }: IToken): boolean {
    return !previousToken || previousToken.type === TokenType.NEWLINE;
  }
}
