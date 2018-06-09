import chalk from 'chalk';
import { BaseOf, Without } from '../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { IDecoratedTokenMatcher, IParseSequenceConfiguration, TokenMatch, TokenMatcherType, ISanitizer, IDecoratedParser } from './parser-types';
import { ISyntaxNode } from './syntax-types';
import { IToken, TokenType } from '../../tokenizer/types';
import { ParserUtils } from './parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

export default abstract class AbstractParser<S extends ISyntaxNode = ISyntaxNode> {
  protected currentToken: IToken;
  protected indentation: number = 0;
  protected parsed: S = this.getDefault();
  private isFinished: boolean = false;
  private isStopped: boolean = false;

  protected get nextTextToken (): IToken {
    return this.currentToken.nextTextToken;
  }

  protected get nextToken (): IToken {
    return this.currentToken.nextToken;
  }

  protected get previousTextToken (): IToken {
    return this.currentToken.previousTextToken;
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
  public parse (token: IToken): S {
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

    this.parsed.token = token;

    return this.parsed;
  }

  protected allow (tokenMatch: TokenMatch): void {
    if (this.currentTokenMatches(tokenMatch)) {
      this.next();
    }
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

  protected currentTokenMatches (tokenMatch: TokenMatch): boolean {
    return ParserUtils.tokenMatches(this.currentToken, tokenMatch);
  }

  /**
   * If the current token satisfies a provided token match,
   * proceeds to the next text token in the stream and returns
   * the initial token value. Halts otherwise.
   */
  protected eat (tokenMatch: TokenMatch): string {
    const token = this.currentToken;

    this.assertCurrentTokenMatch(tokenMatch);
    this.next();

    return token.value;
  }

  /**
   * Skips to the next text token and eats it with a provided
   * token match, abiding by the rules of eat().
   */
  protected eatNext (tokenMatch: TokenMatch): string {
    this.next();

    return this.eat(tokenMatch);
  }

  /**
   * Parses over the incoming token stream with a parser class
   * and merges the parsed result onto this instance's parsed
   * syntax node object. Provided parser classes must parse a
   * syntax node whose type signature is a subset of that of
   * this one's.
   *
   * Note: Partial<P> doesn't work for enforcing a type signature
   * subset here. Since we purposely remove the 'node' key from
   * P and T to avoid syntax node type collisions (which would
   * render this feature useless), we still need to add back
   * a constraint of ISyntaxNode & ... to satisfy the constraint
   * on AbstractParser<T>. This would effectively permit any
   * object with *at least* the interface of ISyntaxNode and
   * *at least* the interface of Partial<P> without 'node',
   * yielding a false positive for many invalid objects.
   */
  protected emulate <T extends ISyntaxNode & BaseOf<Without<S, 'node'>, Without<T, 'node'>>>(ParserClass: Constructor<AbstractParser<T>>): void {
    const { node, ...parsed } = this.parseNextWith(ParserClass) as any;

    Object.assign(this.parsed, parsed);
  }

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

  protected abstract getDefault (): S;

  protected halt (tokenName?: string): void {
    const { currentToken } = this;

    const tokenType =
      tokenName ? tokenName :
      TokenUtils.isWord(currentToken) ? 'word' :
      TokenUtils.isNumber(currentToken) ? 'number' :
      TokenUtils.isSymbol(currentToken) ? 'symbol' :
      'token';

    this.throw(`Unexpected ${tokenType} '${currentToken.value}'`);
  }

  protected isEOF (): boolean {
    return this.currentTokenMatches(TokenUtils.isEOF);
  }

  /**
   * Skips to the next token of type WORD, NUMBER, or SYMBOL in the
   * token stream, stopping at the final EOF token in the stream.
   * Also tracks indentation level.
   */
  protected next (): void {
    this.handleSingleLineParsers();

    this.currentToken = this.nextTextToken;

    if (this.isEOF()) {
      this.finish();

      return;
    }

    if (TokenUtils.isIndentation(this.previousToken)) {
      this.indentation = this.previousToken.value.length;
    }
  }

  /**
   * An optionally overridable hook which runs on the first token
   * in the parsing stream.
   */
  protected onFirstToken (): void { }

  /**
   * Attempts to parse a token stream starting from the current token
   * using a provided parser class which subclasses AbstractParser, or
   * instance thereof. If successful, assigns the current token to the
   * final token reached by the parser and returns the parsed syntax
   * object its parse() returned. Otherwise the provided parser class
   * will control halting and error messaging behavior.
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

    this.provideSanitizers(parserInstance);

    const parsed = parserInstance.parse(this.currentToken);

    this.currentToken = parserInstance.token();

    return parsed;
  }

  /**
   * Parses a sequence of one or multiple repeated syntactic forms into
   * an array of syntax nodes using a provided configuration object.
   */
  protected parseSequence <T extends ISyntaxNode>(configuration: IParseSequenceConfiguration<T>): T[] {
    const { terminator, ValueParser, delimiter } = configuration;
    const values: T[] = [];

    if (!this.currentTokenMatches(terminator)) {
      while (!this.isEOF()) {
        const nextValue = this.parseNextWith(ValueParser);

        values.push(nextValue);

        if (this.currentTokenMatches(terminator)) {
          break;
        }

        this.assertCurrentTokenMatch(delimiter);
        this.next();
      }
    }

    return values;
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
    throw new Error(message);
  }

  protected token (): IToken {
    return this.currentToken;
  }

  /**
   * Runs during each cycle of the parsing stream, looping over each token
   * matcher generated by a @Match() decorator to see whether the current
   * token satisfies its token match. If a match is found, the decorated
   * method is called. If no matches are found, the parser halts.
   */
  private checkStreamMatchers (): void {
    const matchers: IDecoratedTokenMatcher[] = (this.constructor as any).streamMatchers || [];

    for (const { tokenMatcher } of matchers) {
      const [ tokenMatch, methodName ] = tokenMatcher;

      if (this.currentTokenMatches(tokenMatch)) {
        (this as any)[methodName].call(this);

        return;
      }
    }

    this.halt();
  }

  private createParser <A extends AbstractParser>(ParserClass: Constructor<A>): A {
    return new (ParserClass as IConstructable<A>)();
  }

  /**
   * @todo @description
   */
  private getDecoratedField <K extends keyof IDecoratedParser>(field: K): IDecoratedParser[K] {
    return (this.constructor as any as IDecoratedParser)[field];
  }

  /**
   * Returns a formatted and source-attributed error message from an
   * arbitrary original error message. The formatting mimics that of
   * a validation-time error as closely as possible.
   */
  private getNormalizedErrorMessage (message: string): string {
    const messageIsAlreadyNormalized = message.indexOf('->') > -1;

    return messageIsAlreadyNormalized
      ? message
      : `Line ${this.currentToken.line}: ${message} (${this.constructor.name})\n${chalk.white(` -> ${TokenUtils.createLinePreview(this.currentToken)}`)}`;
  }

  private handleSanitizers (): void {
    const sanitizers = this.getDecoratedField('sanitizers') || [];

    for (const { match, parser } of sanitizers) {
      if (this.currentTokenMatches(match) && !(this instanceof parser)) {
        this.parseNextWith(parser);
      }
    }
  }

  private handleSingleLineParsers (): void {
    const isSingleLineParser = this.getDecoratedField('isSingleLineParser');
    const isBreakingLine = this.nextTextToken.line > this.currentToken.line;

    if (!this.isFinished && isSingleLineParser && isBreakingLine) {
      this.throw('Expected line termination');
    }
  }

  /**
   * Loops through each token matcher generated by @Eat() and @Allow()
   * decorators, calling the decorated methods on each step of the
   * loop and halting if a required match is not satisfied.
   */
  private handleStarterMatchers (): void {
    const starterMatchers = this.getDecoratedField('starterMatchers') || [];

    for (const { tokenMatcher, type } of starterMatchers) {
      const [ tokenMatch, methodName ] = tokenMatcher;
      const isOptionalStarter = type === TokenMatcherType.ALLOW;
      const initialToken = this.currentToken;

      this.handleSanitizers();

      if (this.currentTokenMatches(tokenMatch)) {
        (this as any)[methodName].call(this);

        if (this.isDone()) {
          break;
        }

        if (this.currentToken === initialToken) {
          this.next();
        }
      } else if (!isOptionalStarter) {
        this.halt();
      }
    }
  }

  private isDone (): boolean {
    return this.isStopped || this.isFinished || this.isEOF();
  }

  private provideSanitizers (parserInstance: AbstractParser): void {
    const parserDecoratedFields = parserInstance.constructor as any as IDecoratedParser;

    if (!parserDecoratedFields.sanitizers) {
      parserDecoratedFields.sanitizers = this.getDecoratedField('sanitizers');
    }
  }

  /**
   * Steps through tokens starting from the current token until either
   * the parser finishes, stops, or halts.
   */
  private stream (): void {
    if (!this.currentTokenMatches(TokenUtils.isText)) {
      this.next();
    }

    this.onFirstToken();
    this.handleStarterMatchers();

    while (!this.isStopped && !this.isFinished && !this.isEOF()) {
      const initialToken = this.currentToken;

      this.handleSanitizers();
      this.checkStreamMatchers();

      if (this.isDone()) {
        break;
      }

      if (this.currentToken === initialToken) {
        this.next();
      }
    }

    if (this.isFinished) {
      // Advance the token stream after finishing so as
      // to break 'out' of the parsed chunk
      this.next();
    }
  }
}
