import assert from '../system/assert';
import createTokenizer from './createTokenizer';
import { IToken, Tokenizer, TokenType } from './types';

/**
 * An array of tokenizer functions for matching specific token patterns.
 *
 * @internal
 */
const tokenizers: Tokenizer[] = [
  createTokenizer(TokenType.WORD, /\w/),
  createTokenizer(TokenType.NUMBER, /\d/),
  createTokenizer(TokenType.SYMBOL, /[$_|=`:;<>?,.\-*+\/%&!^~\[\]{}()'"]/),
  createTokenizer(TokenType.NEWLINE, /[\r\n]/),
  createTokenizer(TokenType.WHITESPACE, /[\s\t]/),
];

/**
 * Tokenizes an {input} string and returns an array of all
 * non-whitespace tokens.
 */
export default function tokenize (input: string): IToken[] {
  const tokens: IToken[] = [];
  let offset: number = 0;

  while (offset < input.length) {
    let totalFailedTokenizers: number = 0;

    for (const tokenizer of tokenizers) {
      const token: IToken = tokenizer(input, offset);
      const { type, value } = token;

      if (value) {
        if (type !== TokenType.WHITESPACE) {
          const lastToken = tokens[tokens.length - 1];

          if (lastToken) {
            token.lastToken = lastToken;
            lastToken.nextToken = token;
          }

          tokens.push(token);
        }

        offset += value.length;

        break;
      }

      totalFailedTokenizers++;
    }

    assert(
      totalFailedTokenizers < tokenizers.length,
      `Unexpected character: '${input[offset]}'`
    );
  }

  return tokens;
}
