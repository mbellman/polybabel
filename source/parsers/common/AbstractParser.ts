import { Callback, IConstructable } from '../../system/types';
import { getLastToken, getNextToken, isCharacterToken, isStartOfLine } from '../../tokenizer/token-utils';
import { ISyntaxNode, ISyntaxTree } from './syntax';
import { IToken, TokenType } from '../../tokenizer/types';
import { Matcher } from './parser-types';

export default abstract class AbstractParser<P extends ISyntaxTree | ISyntaxNode> {
  protected currentToken: IToken;
  protected parsed: P = this.getDefault();
  private _isFinished: boolean = false;

  protected get lastCharacterToken (): IToken {
    return this._findMatchingToken(getLastToken, isCharacterToken);
  }

  protected get lastToken (): IToken {
    return this.currentToken.lastToken;
  }

  protected get nextCharacterToken (): IToken {
    return this._findMatchingToken(getNextToken, isCharacterToken);
  }

  protected get nextToken (): IToken {
    return this.currentToken.nextToken;
  }

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): P {
    this._stream(token);

    return this.parsed;
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

  /**
   * Returns the default parsed value state which will be modified
   * during parsing.
   */
  protected abstract getDefault (): P;

  protected finish (): void {
    this._isFinished = true;
  }

  protected halt (tokenName: string = 'token'): void {
    this.throw(`Unexpected ${tokenName} '${this.currentToken.value}'`);
  }

  protected isStartOfLine (): boolean {
    return !!this.currentToken.lastToken || this.currentToken.lastToken.type === TokenType.NEWLINE;
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
  protected match (matchers: Matcher[] = []): void {
    this.matchValue(this.currentToken.value, matchers);
  }

  /**
   * Attempts to find a matching {value} among an array of {matchers},
   * and fires the matcher's callback if successful. If unsuccessful,
   * the parser halts.
   */
  protected matchValue (value: string, matchers: Matcher[] = []): void {
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
   * using a provided {Parser} class constructor, where Parser subclasses
   * AbstractParser. If successful, returns the parsed syntax tree or
   * syntax node and assigns the current token to the next token after
   * the parsed stream.
   */
  protected parseNextWith <T extends ISyntaxTree | ISyntaxNode>(Parser: IConstructable<AbstractParser<T>>): T {
    const parser = new Parser();
    const parsed = parser.parse(this.currentToken);

    this.currentToken = parser.token();

    this.skip(1);

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

  protected token (): IToken {
    return this.currentToken;
  }

  private _currentLineToString (): string {
    let lineString = '';
    let lineStartToken = this.currentToken;

    if (!isStartOfLine(lineStartToken)) {
      lineStartToken = this._findMatchingToken(getLastToken, isStartOfLine);
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
