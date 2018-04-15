import { Callback, Constructor, IConstructable } from '../../system/types';
import { getNextToken, getPreviousToken, isCharacterToken, isStartOfLine } from '../../tokenizer/token-utils';
import { IToken, TokenType } from '../../tokenizer/types';
import { ParsedSyntax, TokenMatcher } from './parser-types';

export default abstract class AbstractParser<P extends ParsedSyntax = ParsedSyntax> {
  public currentToken: IToken;
  public parsed: P = this.getDefault();
  private _isFinished: boolean = false;
  private _isStopped: boolean = false;

  public get nextCharacterToken (): IToken {
    return this._findMatchingToken(getNextToken, isCharacterToken);
  }

  public get nextToken (): IToken {
    return this.currentToken.nextToken;
  }

  public get previousCharacterToken (): IToken {
    return this._findMatchingToken(getPreviousToken, isCharacterToken);
  }

  public get previousToken (): IToken {
    return this.currentToken.previousToken;
  }

  /**
   * Disallow external/manual construction of subclass instances.
   * See: parseNextWith()
   */
  protected constructor () { }

  public assert (condition: boolean, errorMessage?: string): void {
    if (!condition) {
      if (errorMessage) {
        this.throw(errorMessage);
      } else {
        this.halt();
      }
    }
  }

  public assertCurrentTokenValue (targetValue: string, errorMessage: string): void {
    if (this.currentToken.value !== targetValue) {
      this.throw(errorMessage);
    }
  }

  public abstract getDefault (): P;

  public finish (): void {
    this._isFinished = true;
  }

  public halt (tokenName: string = 'token'): void {
    this.throw(`Unexpected ${tokenName} '${this.currentToken.value}'`);
  }

  public isStartOfLine (): boolean {
    return !!this.previousToken || this.previousToken.type === TokenType.NEWLINE;
  }

  /**
   * Determines whether a target value or regex is contained within the
   * current parsing line.
   */
  public lineContains (targetValue: string | RegExp): boolean {
    const targetToken = this._findMatchingToken(getNextToken, ({ value, type }) => {
      return (
        value === targetValue ||
        targetValue instanceof RegExp && targetValue.test(value) ||
        type === TokenType.NEWLINE
      );
    });

    return targetToken.type !== TokenType.NEWLINE;
  }

  /**
   * A shorthand method for parsing the current token value using a
   * set of {matchers}.
   */
  public match (matchers: TokenMatcher<this>[] = []): void {
    this.matchValue(this.currentToken.value, matchers);
  }

  /**
   * Attempts to find a matching {value} among an array of {matchers},
   * and fires the matcher's callback if successful. If unsuccessful,
   * the parser halts.
   */
  public matchValue (value: string, matchers: TokenMatcher<this>[] = []): void {
    for (const [ match, handler ] of matchers) {
      const valueHasMatch =
        value === match ||
        Array.isArray(match) && match.indexOf(value) > -1 ||
        match instanceof RegExp && match.test(value);

      if (valueHasMatch) {
        if (typeof handler === 'string') {
          (this as any)[handler](this);
        } else {
          (handler as Callback<this>)(this);
        }

        return;
      }
    }

    this.halt('token');
  }

  /**
   * An optionally overridable hook which runs after the last
   * token in the parsing stream.
   */
  public onFinish (): void { }

  /**
   * An optionally overridable hook which runs on the first token
   * in the parsing stream.
   */
  public onFirstToken (): void { }

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): P {
    this.currentToken = token;

    this._stream();
    this.onFinish();

    return this.parsed;
  }

  /**
   * Attempts to parse a token stream starting from the current token
   * using a provided parser class which subclasses AbstractParser.
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
  public parseNextWith <T extends ParsedSyntax>(ParserClass: Constructor<AbstractParser<T>>): T {
    const parser = this._createParser(ParserClass);
    const parsed = parser.parse(this.currentToken);

    this.currentToken = parser.token();

    return parsed;
  }

  /**
   * A mechanism for skipping an arbitrary number of tokens. Newlines
   * should automatically be skipped through and not counted.
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

  public stop (): void {
    this._isStopped = true;
  }

  public throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message} (${this.constructor.name}) | ...${this._currentLineToString()}...`);
  }

  public token (): IToken {
    return this.currentToken;
  }

  private _createParser <A extends AbstractParser>(ParserClass: Constructor<A>): A {
    return new (ParserClass as IConstructable<A>)();
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

  private _stream (): void {
    const statics = this.constructor as any;

    while (this.currentToken.type === TokenType.NEWLINE) {
      this.skip(1);
    }

    this.onFirstToken();

    while (!this._isStopped && !this._isFinished && this.nextToken) {
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

      if (this._isStopped) {
        break;
      }

      if (!this._isFinished && this.currentToken === initialToken) {
        this.skip(1);
      }
    }

    if (!this._isStopped && this.nextToken) {
      // Advance the token stream after finishing so that the next
      // token after the parsed stream can be assigned back to the
      // parent parser instance
      this.skip(1);
    }
  }
}
