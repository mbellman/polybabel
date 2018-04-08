import { IToken, Tokenizer, TokenType } from './types';

/**
 * Returns a tokenizer function which associates tokens matching
 * a token type to a specific {pattern}.
 */
export default function createTokenizer (
  tokenType: TokenType,
  pattern: RegExp
): Tokenizer {
  return (input: string, offset: number): IToken => {
    let incomingChar: string = input[offset];
    let value: string;

    if (pattern.test(incomingChar)) {
      value = '';

      while (pattern.test(incomingChar)) {
        value += incomingChar;
        incomingChar = input[++offset];
      }
    }

    return {
      type: tokenType,
      value
    };
  };
}
