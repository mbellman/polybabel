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
   * Returns a special token searcher function which steps
   * through the token stream using a provided step function,
   * with the goal of determining whether a predicate-qualifying
   * or predicate-disqualifying token is eventually reached.
   * This ultimately makes composing lookahead or lookbehind
   * routines easier than constructing loops manually.
   *
   * The provided search test qualifier evaluates the current
   * token and determines whether we're ready to evaluate it
   * with an actual search qualifier. If the search qualifier
   * returns true, the search is successful; otherwise it fails.
   *
   * The provided search disqualifier is evaluated each time
   * the search test qualifier fails, and if it returns true
   * before the next step cycle, the search fails. Otherwise,
   * we continue to the next step and repeat the cycle.
   */
  export function createTokenSearchPredicate (
    tokenStepFunction: Callback<IToken>,
    searchTestQualifier: TokenPredicate,
    searchQualifier: TokenPredicate,
    searchDisqualifier: TokenPredicate
  ): TokenPredicate {
    return (token: IToken) => {
      while ((token = tokenStepFunction(token)) && !isEOF(token)) {
        if (searchTestQualifier(token)) {
          return searchQualifier(token);
        } else if (searchDisqualifier(token)) {
          return false;
        }
      }

      return false;
    };
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
