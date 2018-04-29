import { Callback } from '../system/types';
import { IToken, TokenType } from './types';

export namespace TokenUtils {
  export function getPreviousToken ({ previousToken }: IToken): IToken {
    return previousToken;
  }

  export function getNextToken ({ nextToken }: IToken): IToken {
    return nextToken;
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

  export function isWhitespace ({ type }: IToken): boolean {
    return type === TokenType.WHITESPACE;
  }

  export function isEOF ({ type }: IToken): boolean {
    return type === TokenType.EOF;
  }

  export function isText (token: IToken): boolean {
    return isWord(token) || isSymbol(token) || isNumber(token);
  }

  export function isIndentation (token: IToken): boolean {
    return isWhitespace(token) && isNewline(token.previousToken);
  }

  export function isStartOfLine ({ previousToken }: IToken): boolean {
    return (
      !previousToken ||
      TokenUtils.isNewline(previousToken) ||
      TokenUtils.isIndentation(previousToken)
    );
  }
}
