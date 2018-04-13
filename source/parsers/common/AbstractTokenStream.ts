import { Callback } from '../../system/types';
import { getNextToken, getPreviousToken, isCharacterToken, isStartOfLine } from '../../tokenizer/token-utils';
import { IToken, TokenType } from '../../tokenizer/types';
import { ParsedSyntax, TokenMatcher } from './types';
import { Parser } from './parser-factory';

export abstract class AbstractTokenStream<P extends ParsedSyntax = ParsedSyntax> {
  public abstract readonly words: TokenMatcher<P>[];
  public abstract readonly symbols: TokenMatcher<P>[];
  public abstract readonly numbers: TokenMatcher<P>[];
  public currentToken: IToken;
  public parsed: P = this.getDefault();
  private _isFinished: boolean = false;

  public get previousCharacterToken (): IToken {
    return this._findMatchingToken(getPreviousToken, isCharacterToken);
  }

  public get previousToken (): IToken {
    return this.currentToken.previousToken;
  }

  public get nextCharacterToken (): IToken {
    return this._findMatchingToken(getNextToken, isCharacterToken);
  }

  public get nextToken (): IToken {
    return this.currentToken.nextToken;
  }

  public assert (condition: boolean, errorMessage: string): void {
    if (!condition) {
      this.throw(errorMessage);
    }
  }

  public assertCurrentTokenValue (targetValue: string, errorMessage: string): void {
    if (this.currentToken.value !== targetValue) {
      this.throw(errorMessage);
    }
  }

  /**
   * Returns the default parsed syntax state which will be modified
   * during parsing.
   */
  public abstract getDefault (): P;

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): P {
    this._stream(token);

    return this.parsed;
  }

  public finish (): void {
    this._isFinished = true;
  }

  public halt (tokenName: string = 'token'): void {
    this.throw(`Unexpected ${tokenName} '${this.currentToken.value}'`);
  }

  /**
   * Determines whether a target value or regex is contained within the
   * current parsing line.
   */
  public lineContains (targetValue: string | RegExp): boolean {
    const targetToken = this._findMatchingToken(getNextToken, ({ value, type }) => (
      value === targetValue ||
      targetValue instanceof RegExp && targetValue.test(value) ||
      type === TokenType.NEWLINE
    ));

    return targetToken.type !== TokenType.NEWLINE;
  }

  /**
   * A shorthand method for parsing the stream's current token value using
   * a set of {matchers}.
   */
  public match (matchers: TokenMatcher<P>[] = []): void {
    this.matchValue(this.currentToken.value, matchers);
  }

  /**
   * Attempts to find a matching {value} among an array of {matchers},
   * and fires the matcher's callback if successful. If unsuccessful,
   * the parser halts.
   */
  public matchValue (value: string, matchers: TokenMatcher<P>[] = []): void {
    for (const [ match, handler ] of matchers) {
      const valueHasMatch =
        value === match ||
        Array.isArray(match) && match.indexOf(value) > -1 ||
        match instanceof RegExp && match.test(value);

      if (valueHasMatch) {
        handler.call(this);

        return;
      }
    }

    this.halt('token');
  }

  /**
   * An optionally overridable hook for parsing the first received token.
   */
  public onFirstToken (): void { }

  /**
   * Attempts to parse a token stream starting from the current token
   * using a provided {Parser} class constructor, where Parser subclasses
   * AbstractParser. If successful, returns the parsed syntax tree or
   * syntax node and assigns the current token to the next token after
   * the parsed stream.
   */
  public parseNextWith <S extends ParsedSyntax>(parse: Parser<S>): S {
    const { parsed, token } = parse(this.currentToken);

    this.currentToken = token;

    this.skip(1);

    return parsed;
  }

  /**
   * A failsafe mechanism for skipping an arbitrary number of tokens.
   * Newlines are automatically skipped through and not counted.
   */
  public skip (steps: number): void {
    while (--steps >= 0) {
      if (!this.nextToken) {
        this._isFinished = true;

        break;
      }

      this.currentToken = this.nextCharacterToken;
    }
  }

  public throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message} (${this.constructor.name}) | ...${this._currentLineToString()}...`);
  }

  public token (): IToken {
    return this.currentToken;
  }

  private _currentLineToString (): string {
    let lineString = '';
    let lineStartToken = this.currentToken;

    if (!isStartOfLine(lineStartToken)) {
      lineStartToken = this._findMatchingToken(getPreviousToken, isStartOfLine);
    }

    let token = lineStartToken;

    do {
      lineString += `${token.value} `;
    } while ((token = token.nextToken) && token.type !== TokenType.NEWLINE);

    return lineString;
  }

  /**
   * Performs a token search, starting from the current token, using a step
   * function to define how to change the lookup position on each search
   * step, and a {predicate} function to determine when a target token has
   * been found. If a token satisfying the predicate function is matched,
   * that token is returned.
   *
   * The current token is omitted in the search.
   */
  private _findMatchingToken (stepFunction: Callback<IToken, IToken>, predicate: Callback<IToken, boolean>): IToken {
    let token = stepFunction(this.currentToken);

    while (token && !predicate(token)) {
      token = stepFunction(token);
    }

    return token;
  }

  private _stream (token: IToken): void {
    let isFirstToken = true;

    this.currentToken = token;

    while (!this._isFinished && this.currentToken) {
      if (isFirstToken && this.currentToken.type !== TokenType.NEWLINE) {
        this.onFirstToken();

        isFirstToken = false;
      }

      const initialToken = this.currentToken;
      const { lastToken, type, value } = this.currentToken;

      switch (type) {
        case TokenType.WORD:
          this.match((this as any).words);
          break;
        case TokenType.NUMBER:
          this.match((this as any).numbers);
          break;
        case TokenType.SYMBOL:
          this.match((this as any).symbols);
          break;
      }

      if (!this._isFinished && this.currentToken === initialToken) {
        this.skip(1);
      }
    }
  }
}
