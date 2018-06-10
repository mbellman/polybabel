import chalk from 'chalk';
import { Callback } from '../system/types';
import { IToken, TokenType } from './types';
import { TokenPredicate } from '../parser/common/parser-types';

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

  /**
   * Returns a special token search function which steps through
   * a token stream, starting at a given token, using a provided
   * step function, returning the token if the search qualifier
   * returns true and null if the search disqualifier returns
   * true. The token stream is stepped through until one of the
   * two returns true, or the step function returns undefined
   * or an EOF token.
   */
  export function createTokenSearcher (tokenStepFunction: Callback<IToken, IToken>, searchQualifier: TokenPredicate, searchDisqualifier: TokenPredicate): Callback<IToken, IToken> {
    return (token: IToken) => {
      while ((token = tokenStepFunction(token)) && !isEOF(token)) {
        if (searchQualifier(token)) {
          return token;
        } else if (searchDisqualifier(token)) {
          return null;
        }
      }

      return null;
    };
  }

  /**
   * Follows the same principles as createTokenSearcher(), but
   * creates a function which returns a boolean determining
   * whether the token was found, instead of the token itself
   * or null.
   */
  export function createTokenSearchPredicate (tokenStepFunction: Callback<IToken, IToken>, searchQualifier: TokenPredicate, searchDisqualifier: TokenPredicate): TokenPredicate {
    const searchToken = createTokenSearcher(tokenStepFunction, searchQualifier, searchDisqualifier);

    return (token: IToken) => !!searchToken(token);
  }

  /**
   * Generates a preview of the portion of a line of code
   * surrounding a provided token. End of line or EOF tokens
   * automatically terminate the start or end of the preview.
   */
  export function createLinePreview (token: IToken, range: number = 10): string {
    const DOUBLE_RANGE = 2 * range;
    let linePreview = '';
    let currentToken = token;
    let tokenCounter = 0;

    while (tokenCounter++ < range) {
      const { previousToken } = currentToken;

      if (!previousToken || isNewline(previousToken)) {
        break;
      }

      currentToken = currentToken.previousToken;
    }

    tokenCounter = 0;

    while (tokenCounter++ < DOUBLE_RANGE) {
      const isFocusedToken = currentToken === token;
      const { value } = currentToken;

      linePreview += isFocusedToken
        ? `${chalk.red(value)}`
        : value;

      currentToken = currentToken.nextToken;

      if (isEOF(currentToken) || isNewline(currentToken)) {
        break;
      }
    }

    return linePreview.trim();
  }
}
