import { IToken, Tokenizer, TokenType } from './types';

/**
 * Returns a tokenizer function which attempts to return tokens
 * of a specific type matching a given {pattern}.
 */
export default function createTokenizer (tokenType: TokenType, pattern: RegExp): Tokenizer {
  return (input: string, offset: number): IToken => {
    let incoming: string = input[offset];
    let value: string;

    if (incoming && pattern.test(incoming)) {
      value = '';

      while (incoming && pattern.test(incoming)) {
        value += incoming;
        incoming = input[++offset];

        if (tokenType === TokenType.SYMBOL || /(\r\n|\n)/.test(value)) {
          // Break symbols and newlines after a single match
          // so they can be tokenized individually
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
