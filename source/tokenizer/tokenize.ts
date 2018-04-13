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
  let line: number = 1;

  while (offset < input.length) {
    let totalFailedTokenizers: number = 0;

    for (const tokenizer of tokenizers) {
      const token: IToken = tokenizer(input, offset);
      const { type, value } = token;

      if (value) {
        if (type !== TokenType.WHITESPACE) {
          const previousToken = tokens[tokens.length - 1];
          const isNewLine = type === TokenType.NEWLINE;

          if (previousToken) {
            token.previousToken = previousToken;
            previousToken.nextToken = token;
          }

          token.line = isNewLine ? ++line : line;

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
