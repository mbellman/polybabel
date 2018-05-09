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
  createTokenizer(TokenType.SYMBOL, /[$|=`:;<>?,.\-*+\/\\%&!^~\[\]{}()'"#@]/),
  createTokenizer(TokenType.NUMBER, /[\d.]/),
  createTokenizer(TokenType.WORD, /\w/),
  createTokenizer(TokenType.NEWLINE, /[\r\n]/),
  createTokenizer(TokenType.WHITESPACE, /[\s\t]/)
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
  token.nextTextToken = token;

  return token;
}

/**
 * @todo @description
 */
function setNextTokens (lastToken: IToken): void {
  const eofToken = getEOFToken();
  let nextToken = eofToken;
  let nextTextToken = eofToken;
  let token = lastToken;

  while (token) {
    token.nextToken = nextToken;
    token.nextTextToken = nextTextToken;

    nextToken = token;

    if (TokenUtils.isText(token)) {
      nextTextToken = token;
    }

    token = token.previousToken;
  }
}

/**
 * @todo @description
 */
export default function tokenize (input: string): IToken {
  if (input.length === 0) {
    return getEOFToken();
  }

  let firstToken: IToken;
  let lastToken: IToken;
  let previousToken: IToken;
  let previousTextToken: IToken;
  let offset: number = 0;
  let line: number = 1;

  while (offset < input.length) {
    let totalFailedTokenizers: number = 0;

    for (const tokenizer of tokenizers) {
      const token: IToken = tokenizer(input, offset);
      const { type, value } = token;

      if (value) {
        if (!firstToken) {
          firstToken = token;
        }

        token.line = TokenUtils.isNewline(token) ? ++line : line;
        token.previousToken = previousToken;
        token.previousTextToken = previousTextToken;

        previousToken = token;
        lastToken = token;

        if (TokenUtils.isText(token)) {
          previousTextToken = token;
        }

        offset += value.length;

        break;
      }

      totalFailedTokenizers++;
    }

    assert(
      totalFailedTokenizers < tokenizers.length,
      `Line ${lastToken.line}: Unrecognized token '${input[offset]}'`
    );
  }

  setNextTokens(lastToken);

  return firstToken;
}
