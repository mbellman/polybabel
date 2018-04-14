/**
 * Token type constants.
 */
export const enum TokenType {
  WORD,
  NUMBER,
  SYMBOL,
  NEWLINE,
  WHITESPACE
}

/**
 * A token object generated in string tokenization.
 */
export interface IToken {
  type: TokenType;
  value: string;
  line?: number;
  previousToken?: IToken;
  nextToken?: IToken;
}

/**
 * A function which attempts to extract a token from a specific
 * {input} string starting from an {offset}.
 */
export type Tokenizer = (input: string, offset: number) => IToken;
