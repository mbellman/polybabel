import chalk from 'chalk';
import { BaseOf, Callback, Constructor, IConstructable, Without } from '../../system/types';
import { Bound } from 'trampoline-framework';
import { ISyntaxNode } from './syntax-types';
import { IToken, TokenType } from '../../tokenizer/types';
import { ParserUtils } from './parser-utils';
import { TokenMatch, TokenMatcher } from './parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

export default abstract class AbstractParser<P extends ISyntaxNode = ISyntaxNode> {
  protected currentToken: IToken;
  protected parsed: P = this.getDefault();
  private isFinished: boolean = false;
  private isStopped: boolean = false;

  protected get nextCharacterToken (): IToken {
    return this.findMatchingToken(TokenUtils.getNextToken, TokenUtils.isCharacterToken);
  }

  protected get nextToken (): IToken {
    return this.currentToken.nextToken;
  }

  protected get previousCharacterToken (): IToken {
    return this.findMatchingToken(TokenUtils.getPreviousToken, TokenUtils.isCharacterToken);
  }

  protected get previousToken (): IToken {
    return this.currentToken.previousToken;
  }

  /**
   * Disallow external/manual construction of subclass instances
   * unless they deliberately expose a public constructor.
   *
   * See: parseNextWith()
   */
  protected constructor () { }

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): P {
    this.currentToken = token;

    try {
      this.stream();
    } catch (e) {
      // Catching errors here allows both intentional halting errors
      // and actual subclass design/runtime errors to be displayed,
      // properly attributed to the source. We then throw the error
      // again to propagate it up to the file compilation loop so
      // it can be displayed in the context of the source file,
      // which is unknown to parsers.
      const message = this.getNormalizedErrorMessage(e.message);

      throw new Error(message);
    }

    return this.parsed;
  }

  protected assert (condition: boolean, errorMessage?: string): void {
    if (!condition) {
      if (errorMessage) {
        this.throw(errorMessage);
      } else {
        this.halt();
      }
    }
  }

  protected assertCurrentTokenMatch (tokenMatch: TokenMatch, errorMessage?: string): void {
    this.assert(this.currentTokenMatches(tokenMatch), errorMessage);
  }

  @Bound protected currentTokenMatches (tokenMatch: TokenMatch): boolean {
    return ParserUtils.tokenMatches(this.currentToken, tokenMatch);
  }

  /**
   * Parses over the incoming token stream with a parser class
   * and merges the parsed result onto this instance's parsed
   * syntax node object. Provided parser classes must parse a
   * syntax node whose type signature is a subset of the
   * instance's parsed syntax node.
   */
  protected emulate <T extends ISyntaxNode & BaseOf<Without<P, 'node'>, Without<T, 'node'>>>(ParserClass: Constructor<AbstractParser<T>>): void {
    const { node, ...parsed } = this.parseNextWith(ParserClass) as any;

    Object.assign(this.parsed, parsed);
  }

  protected abstract getDefault (): P;

  /**
   * Finishes parsing and ensures that the current token will be
   * advanced upon returning to the parent parser, stepping 'out'
   * of the parsed chunk.
   *
   * See: stop()
   */
  protected finish (): void {
    this.isFinished = true;
  }

  protected halt (tokenName?: string): void {
    const tokenType =
      tokenName ? tokenName :
      this.currentToken.type === TokenType.WORD ? 'word' :
      this.currentToken.type === TokenType.NUMBER ? 'number' :
      this.currentToken.type === TokenType.SYMBOL ? 'symbol' :
      'token';

    this.throw(`Unexpected ${tokenType} '${this.currentToken.value}'`);
  }

  protected isStartOfLine (): boolean {
    return !this.previousToken || this.previousToken.type === TokenType.NEWLINE;
  }

  /**
   * Determines whether a token match is contained within the
   * current parsing line.
   */
  @Bound protected lineContains (tokenMatch: TokenMatch): boolean {
    if (this.currentTokenMatches(tokenMatch)) {
      return true;
    }

    const targetToken = this.findMatchingToken(TokenUtils.getNextToken, token => {
      return ParserUtils.tokenMatches(token, tokenMatch) || token.type === TokenType.NEWLINE;
    });

    return targetToken.type !== TokenType.NEWLINE;
  }

  /**
   * A shorthand method for only skipping one character token.
   */
  protected next (): void {
    this.skip(1);
  }

  /**
   * An optionally overridable hook which runs on the first token
   * in the parsing stream.
   */
  protected onFirstToken (): void { }

  /**
   * An optionally overridable hook which runs on each new line in
   * the parsing stream.
   */
  protected onLineStart (): void { }

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
  protected parseNextWith <T extends ISyntaxNode>(parser: Constructor<AbstractParser<T>>): T;
  protected parseNextWith <T extends ISyntaxNode>(parser: AbstractParser<T>): T;
  protected parseNextWith <T extends ISyntaxNode>(parser: Constructor<AbstractParser<T>> | AbstractParser<T>): T {
    const parserInstance = parser instanceof AbstractParser
      ? parser
      : this.createParser(parser);

    const parsed = parserInstance.parse(this.currentToken);

    this.currentToken = parserInstance.token();

    return parsed;
  }

  /**
   * A mechanism for skipping an arbitrary number of character tokens.
   * Newline tokens are skipped over without counting toward the total
   * number of skips.
   */
  protected skip (steps: number): void {
    while (--steps >= 0) {
      if (!this.nextCharacterToken) {
        this.isFinished = true;

        break;
      }

      this.currentToken = this.nextCharacterToken;
    }
  }

  /**
   * Stops the parser without any errors, but with the intent of letting
   * the parent parser continue from the current token.
   *
   * See: finish()
   */
  protected stop (): void {
    this.isStopped = true;
  }

  protected throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message}`);
  }

  protected token (): IToken {
    return this.currentToken;
  }

  /**
   * @todo @description
   */
  private checkTokenMatchersWithPredicate (tokenMatchers: TokenMatcher[], predicate: Callback<TokenMatch, boolean>): boolean {
    const { value } = this.currentToken;

    if (tokenMatchers) {
      for (const [ tokenMatch, callback ] of tokenMatchers) {
        if (predicate(tokenMatch)) {
          callback.call(this);

          return true;
        }
      }
    }

    return false;
  }

  /**
   * @todo @description
   */
  private checkTokenMatchers (): void {
    const statics = this.constructor as any;
    const matches: TokenMatcher[] = statics.matches;
    const lookaheads: TokenMatcher[] = statics.lookaheads;
    const negativeLookaheads: TokenMatcher[] = statics.negativeLookaheads;

    if (this.checkTokenMatchersWithPredicate(matches, this.currentTokenMatches)) {
      return;
    }

    if (this.isStartOfLine()) {
      if (this.checkTokenMatchersWithPredicate(lookaheads, this.lineContains)) {
        return;
      }

      if (this.checkTokenMatchersWithPredicate(negativeLookaheads, tokenMatch => !this.lineContains(tokenMatch))) {
        return;
      }
    }

    this.halt();
  }

  private createParser <A extends AbstractParser>(ParserClass: Constructor<A>): A {
    return new (ParserClass as IConstructable<A>)();
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
  private findMatchingToken (stepFunction: Callback<IToken, IToken>, predicate: Callback<IToken, boolean>): IToken {
    let token = stepFunction(this.currentToken);

    while (token && !predicate(token)) {
      token = stepFunction(token);
    }

    return token;
  }

  private getColorizedLinePreview (range: number = 5): string {
    let n = range;
    let localToken = this.currentToken;
    const localTokenValues: string[] = [];

    // Walk backward to the start of the range, or the
    // beginning of the current line
    while (--n >= 0 && localToken.previousToken && TokenUtils.isCharacterToken(localToken.previousToken)) {
      localToken = localToken.previousToken;
    }

    // Walk forward to the end of the range, or the end
    // of the current line, adding each encountered token
    // to the list of local token values
    while (n++ < (2 * range) && localToken.nextToken && TokenUtils.isCharacterToken(localToken)) {
      const colorize = localToken === this.currentToken
        ? chalk.bold.red
        : chalk.gray;

      localTokenValues.push(colorize(localToken.value));

      localToken = localToken.nextToken;
    }

    return `...${localTokenValues.join(' ')}...`;
  }

  /**
   * Returns a colorized, formatted, and source-attributed error message
   * from an arbitrary original error message.
   */
  private getNormalizedErrorMessage (message: string): string {
    const messageIsAlreadyNormalized = message.indexOf('->') > -1;

    return messageIsAlreadyNormalized
      ? message
      : ` ${chalk.blueBright(message)} ${chalk.cyan(`(${this.constructor.name})`)} -> ${this.getColorizedLinePreview()}\n`;
  }

  /**
   * Steps through tokens starting from the current token until either
   * the subclass finishes, stops, or halts.
   */
  private stream (): void {
    if (this.currentToken.type === TokenType.NEWLINE) {
      this.currentToken = this.nextCharacterToken;
    }

    this.onFirstToken();

    while (!this.isStopped && !this.isFinished && this.nextToken) {
      const initialToken = this.currentToken;

      if (this.currentToken.type !== TokenType.NEWLINE) {
        this.checkTokenMatchers();
      } else {
        this.onLineStart();
      }

      if (this.isStopped) {
        // Break out of the token loop, keep the current token where it
        // is, and let the parent parser handle things from there
        break;
      }

      if (!this.isFinished && this.currentToken === initialToken) {
        this.next();
      }
    }

    if (!this.isStopped && this.nextToken) {
      // Advance the token stream after finishing so as to break 'out'
      // of the parsing chunk
      this.next();
    }
  }
}
