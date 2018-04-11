import { IToken, Tokenizer, TokenType } from './types';

/**
 * Returns a tokenizer function which attempts to return tokens
 * of a specific type matching a given {pattern}.
 */
export default function createTokenizer (tokenType: TokenType, pattern: RegExp): Tokenizer {
  return (input: string, offset: number): IToken => {
    let incomingChar: string = input[offset];
    let value: string;

    if (pattern.test(incomingChar)) {
      value = '';

      while (pattern.test(incomingChar)) {
        value += incomingChar;
        incomingChar = input[++offset];

        if (tokenType === TokenType.SYMBOL || value === '\r\n') {
          // Terminate symbol tokens after a single character, and
          // newline tokens after a single full newline, so they
          // can be tokenized individually
          break;
        }
      }
    }

    return {
      type: tokenType,
      value
    };
  };
}
