/**
 * Token type constants.
 */
export const enum TokenType {
  WORD,
  NUMBER,
  SYMBOL,
  NEWLINE,
  WHITESPACE,
  EOF
}

/**
 * A token object generated during string tokenization.
 */
export interface IToken {
  type: TokenType;
  value: string;
  line?: number;
  previousToken?: IToken;
  previousTextToken?: IToken;
  nextToken?: IToken;
  nextTextToken?: IToken;
}

/**
 * A function which attempts to extract a token from a specific
 * {input} string starting from an {offset}.
 */
export type Tokenizer = (input: string, offset: number) => IToken;
