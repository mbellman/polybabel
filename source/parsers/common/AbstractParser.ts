import chalk from 'chalk';
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
   * Disallow external/manual construction of subclass instances
   * unless they deliberately expose a public constructor.
   *
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

  public assertCurrentTokenValue (targetValue: string, errorMessage?: string): void {
    this.assert(this.currentToken.value === targetValue, errorMessage);
  }

  public abstract getDefault (): P;

  /**
   * Finishes parsing and ensures that the current token will be
   * advanced upon returning to the parent parser, stepping 'out'
   * of the parsed chunk.
   *
   * See: stop()
   */
  public finish (): void {
    this._isFinished = true;
  }

  public halt (tokenName?: string): void {
    const tokenType =
      tokenName ?
        tokenName :
      this.currentToken.type === TokenType.WORD ?
        'word' :
      this.currentToken.type === TokenType.NUMBER ?
        'number' :
      this.currentToken.type === TokenType.SYMBOL ?
        'symbol' :
      'token';

    this.throw(`Unexpected ${tokenType} '${this.currentToken.value}'`);
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
   * Attempts to find a matching {value} among an array of token
   * matchers, and fires the matcher's callback if successful.
   * If unsuccessful, the the parser halts.
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
          handler(this);
        }

        return;
      }
    }

    this.halt();
  }

  /**
   * A shorthand method for only skipping one character token.
   */
  public next (): void {
    this.skip(1);
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

    try {
      this._stream();
      this.onFinish();
    } catch (e) {
      // Catching errors here allows both intentional halting errors
      // and actual subclass design/runtime errors to be displayed,
      // properly attributed to the source. We then throw the error
      // again to propagate it up to the file compilation loop so
      // it can be displayed in the context of the source file,
      // which is unknown to parsers.
      const message = this._getNormalizedErrorMessage(e.message);

      throw new Error(message);
    }

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
   * A mechanism for skipping an arbitrary number of character tokens.
   * Newline tokens are skipped over without counting toward the total
   * number of skips.
   */
  public skip (steps: number): void {
    while (--steps >= 0) {
      if (!this.nextCharacterToken) {
        this._isFinished = true;

        break;
      }

      this.currentToken = this.nextCharacterToken;
    }
  }

  /**
   * Stops the parser without any error, but with the intent of letting
   * the parent parser continue from the current token.
   *
   * See: finish()
   */
  public stop (): void {
    this._isStopped = true;
  }

  public throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message}`);
  }

  public token (): IToken {
    return this.currentToken;
  }

  private _createParser <A extends AbstractParser>(ParserClass: Constructor<A>): A {
    return new (ParserClass as IConstructable<A>)();
  }

  private _getLocalLineContent (limit: number = 3): string {
    let n = limit;
    let localToken = this.currentToken;
    const localTokenValues: string[] = [];

    // Walk backward to the start of the limit, or the
    // beginning of the current line
    while (--n >= 0 && localToken.previousToken && isCharacterToken(localToken.previousToken)) {
      localToken = localToken.previousToken;
    }

    // Walk forward to the end of the limit, or the end
    // of the current line, adding each encountered token
    // to the list of local token values
    while (n++ < 2 * limit && localToken.nextToken && isCharacterToken(localToken)) {
      localTokenValues.push(localToken.value);
      localToken = localToken.nextToken;
    }

    return localTokenValues.join(' ');
  }

  /**
   * Returns a colorized, formatted, and source-attributed error message
   * from an arbitrary original error message.
   */
  private _getNormalizedErrorMessage (message: string): string {
    const messageIsAlreadyNormalized = message.indexOf(' -> ') > -1;
    const colorizedLineContent = chalk.red(`...${this._getLocalLineContent()}...`);

    return messageIsAlreadyNormalized
      ? message
      : ` ${chalk.blue(message)} ${chalk.cyan(`(${this.constructor.name})`)} -> ${colorizedLineContent}\n`;
  }

  /**
   * Performs a token search, starting from the current token, using a step
   * function to define how to change the lookup position on each search
   * step, and a {predicate} function to determine when a target token has
   * been found. If a token satisfying the predicate function is matched,
   * that token is returned.
   *
   * The current token will not be counted as a match even if it happens
   * to satisfy the predicate function.
   */
  private _findMatchingToken (stepFunction: Callback<IToken, IToken>, predicate: Callback<IToken, boolean>): IToken {
    let token = stepFunction(this.currentToken);

    while (token && !predicate(token)) {
      token = stepFunction(token);
    }

    return token;
  }

  /**
   * Steps through tokens starting from the current token until either
   * the subclass finishes, stops, or halts.
   */
  private _stream (): void {
    const statics = this.constructor as any;

    while (this.currentToken.type === TokenType.NEWLINE) {
      this.next();
    }

    this.onFirstToken();

    while (!this._isStopped && !this._isFinished && this.nextToken) {
      const tokenAtStepStart = this.currentToken;
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

      if (!this._isFinished && this.currentToken === tokenAtStepStart) {
        this.next();
      }
    }

    if (!this._isStopped && this.nextToken) {
      // Advance the token stream after finishing so that the next
      // token after the parsed chunk can be assigned back to the
      // parent parser instance
      this.next();
    }
  }
}
