import AbstractParser from './AbstractParser';
import { Callback, IConstructable, Constructor } from '../../system/types';
import { getNextToken, getPreviousToken, isCharacterToken, isStartOfLine } from '../../tokenizer/token-utils';
import { IToken, TokenType } from '../../tokenizer/types';
import { ParsedSyntax, TokenMatcher } from './parser-types';

export default abstract class Parser extends AbstractParser {
  private _isFinished: boolean = false;

  protected get nextCharacterToken (): IToken {
    return this._findMatchingToken(getNextToken, isCharacterToken);
  }

  protected get nextToken (): IToken {
    return this.currentToken.nextToken;
  }

  protected get previousCharacterToken (): IToken {
    return this._findMatchingToken(getPreviousToken, isCharacterToken);
  }

  protected get previousToken (): IToken {
    return this.currentToken.previousToken;
  }

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): ParsedSyntax {
    this._stream(token);

    return this.parsed;
  }

  public token (): IToken {
    return this.currentToken;
  }

  protected assert (condition: boolean, errorMessage: string): void {
    if (!condition) {
      this.throw(errorMessage);
    }
  }

  protected assertCurrentTokenValue (targetValue: string, errorMessage: string): void {
    if (this.currentToken.value !== targetValue) {
      this.throw(errorMessage);
    }
  }

  protected finish (): void {
    this._isFinished = true;
  }

  protected halt (tokenName: string = 'token'): void {
    this.throw(`Unexpected ${tokenName} '${this.currentToken.value}'`);
  }

  protected isStartOfLine (): boolean {
    return !!this.previousToken || this.previousToken.type === TokenType.NEWLINE;
  }

  /**
   * Determines whether a target value or regex is contained within the
   * current parsing line.
   */
  protected lineContains (targetValue: string | RegExp): boolean {
    const targetToken = this._findMatchingToken(
      getNextToken,
      ({ value, type }) => (
        value === targetValue ||
        targetValue instanceof RegExp && targetValue.test(value) ||
        type === TokenType.NEWLINE
      )
    );

    return targetToken.type !== TokenType.NEWLINE;
  }

  /**
   * A shorthand method for parsing the current token value using a
   * set of {matchers}.
   */
  protected match (matchers: TokenMatcher[] = []): void {
    this.matchValue(this.currentToken.value, matchers);
  }

  /**
   * Attempts to find a matching {value} among an array of {matchers},
   * and fires the matcher's callback if successful. If unsuccessful,
   * the parser halts.
   */
  protected matchValue (value: string, matchers: TokenMatcher[] = []): void {
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
  protected onFirstToken (): void { }

  /**
   * Attempts to parse a token stream starting from the current token
   * using a provided {ParserClass} which implements AbstractParser.
   * If successful, assigns the current token to the final token
   * reached by the parser and returns the parsed syntax object its
   * own parse() returned. Otherwise the parser class will control
   * halting and error messaging behavior.
   *
   * This method is intended as the main API for parsing recursively.
   * Rather than requiring parent parser classes to be responsible
   * for instantiating child parsers, calling parse() to resolve
   * a parsed syntax object from the current token, and manually
   * reassigning their own current tokens to the final token of the
   * child parser, we just contain the work here.
   */
  protected parseNextWith <T extends ParsedSyntax>(ParserClass: Constructor<AbstractParser<T>>): T {
    const parser = this.createParser(ParserClass);
    const parsed = parser.parse(this.currentToken);

    this.currentToken = parser.token();

    return parsed;
  }

  /**
   * A failsafe mechanism for skipping an arbitrary number of tokens.
   * Newlines are automatically skipped through and not counted.
   */
  protected skip (steps: number): void {
    while (--steps >= 0) {
      if (!this.nextToken) {
        this._isFinished = true;

        break;
      }

      this.currentToken = this.nextCharacterToken;
    }
  }

  protected throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message} (${this.constructor.name}) | ...${this._currentLineToString()}...`);
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
    const statics = this.constructor as any;

    this.currentToken = token;

    while (this.currentToken.type === TokenType.NEWLINE) {
      this.skip(1);
    }

    this.onFirstToken();

    while (!this._isFinished && this.nextToken) {
      const initialToken = this.currentToken;
      const { previousToken, type, value } = this.currentToken;

      switch (type) {
        case TokenType.WORD:
          this.match(statics.words);
          break;
        case TokenType.NUMBER:
          this.match(statics.numbers);
          break;
        case TokenType.SYMBOL:
          this.match(statics.symbols);
          break;
      }

      if (!this._isFinished && this.currentToken === initialToken) {
        this.skip(1);
      }
    }

    if (this.nextToken) {
      // Advance the token stream after finishing so that the next
      // token after the parsed stream can be assigned back to the
      // parent parser instance
      this.skip(1);
    }
  }
}
