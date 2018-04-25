import assert from '../system/assert';
import createTokenizer from './createTokenizer';
import { IToken, Tokenizer, TokenType } from './types';
import { TokenUtils } from './token-utils';

/**
 * An array of tokenizer functions for matching specific
 * token patterns.
 *
 * @internal
 */
const tokenizers: Tokenizer[] = [
  createTokenizer(TokenType.SYMBOL, /[$|=`:;<>?,.\-*+\/\\%&!^~\[\]{}()'"#]/),
  createTokenizer(TokenType.NUMBER, /[\d.]/),
  createTokenizer(TokenType.WORD, /\w/),
  createTokenizer(TokenType.NEWLINE, /[\r\n]/),
  // Classify all whitespace tokens as indentation; only
  // 'indentation' at the start of a line will be included
  // in a tokenize() token array.
  createTokenizer(TokenType.INDENTATION, /(\s|\t)/),
];

/**
 * Returns an 'EOF' token representing the end of a file,
 * assigning its next token to itself to allow indefinite
 * token.nextToken.nextToken chains.
 *
 * @internal
 */
function getEOFToken (): IToken {
  const token: IToken = {
    type: TokenType.EOF,
    value: null
  };

  token.nextToken = token;

  return token;
}

/**
 * Tokenizes an {input} string and returns an array of all non-
 * whitespace tokens, excepting whitespace at the beginning of
 * a new line (indentation).
 */
export default function tokenize (input: string): IToken[] {
  const tokens: IToken[] = [];
  const eofToken = getEOFToken();
  let offset: number = 0;
  let line: number = 1;

  while (offset < input.length) {
    let totalFailedTokenizers: number = 0;

    for (const tokenizer of tokenizers) {
      const token: IToken = tokenizer(input, offset);
      const { type, value } = token;

      if (value) {
        const previousToken = tokens[tokens.length - 1];

        if (previousToken) {
          // Allow the tokens to be streamed through as a linked list
          token.previousToken = previousToken;
          previousToken.nextToken = token;
        }

        token.line = TokenUtils.isNewline(token)
          ? ++line
          : line;

        offset += value.length;

        if (!TokenUtils.isIndentation(token) || TokenUtils.isIndentation(token) && TokenUtils.isStartOfLine(token)) {
          // We only want to save tokens if they are not indentations
          // or if they are start-of-line indentations. Token parsing
          // is considerably faster without the additional whitespace.
          tokens.push(token);
        }

        break;
      }

      totalFailedTokenizers++;
    }

    assert(
      totalFailedTokenizers < tokenizers.length,
      `Line ${tokens[tokens.length - 1].line}: Unrecognized token '${input[offset]}'`
    );
  }

  tokens[tokens.length - 1].nextToken = eofToken;

  tokens.push(eofToken);

  return tokens;
}
