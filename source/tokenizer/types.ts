/**
 * Token type constants.
 */
export const enum TokenType {
  WORD,
  NUMBER,
  OPEN_BRACKET,
  OPEN_CURLY_BRACE,
  OPEN_PARENTHESIS,
  CLOSE_BRACKET,
  CLOSE_CURLY_BRACE,
  CLOSE_PARENTHESIS,
  OPERATOR,
  QUOTE,
  SYMBOLS,
  WHITESPACE
}

/**
 * A token object generated in string tokenization.
 */
export interface IToken {
  type: TokenType;
  value: string;
}

/**
 * A function which attempts to extract a token from a specific
 * {input} string starting at a particular {offset}.
 */
export type Tokenizer = (input: string, offset: number) => IToken;
