import { Constructor, IConstructable } from 'trampoline-framework';
import { IDecoratedParser, IDecoratedTokenMatcher, IParserError, IParseSequenceConfiguration, TokenMatch, TokenMatcherType } from './parser-types';
import { ISyntaxNode } from './syntax-types';
import { IToken } from '../../tokenizer/types';
import { ParserUtils } from './parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

export default abstract class AbstractParser<S extends ISyntaxNode = ISyntaxNode> {
  protected currentToken: IToken;
  protected indentation: number = 0;
  protected parsed: S = this.getDefault();

  private error: IParserError = {
    message: null,
    tokenRange: null
  };

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

  public getError (): IParserError {
    return this.error;
  }

  public hasError (): boolean {
    return !!this.error.message;
  }

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): S {
    this.currentToken = token;

    this.parsed.tokenRange = {
      start: token,
      end: null
    };

    try {
      this.stream();
    } catch ({ message }) {
      // Propagate the error up the parsing stack so we can stop
      // the current file's parsing stream
      this.throw(message);
    }

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
   * syntax node object.
   */
  protected emulate (ParserClass: Constructor<AbstractParser>): void {
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
   * Attempts to parse a token stream starting from the current
   * token using a provided AbstractParser subclass. If successful,
   * assigns the current token to the final token reached by the
   * parser and returns the parsed syntax object its parse()
   * returned. Otherwise the provided parser class will control
   * halting and error messaging behavior.
   *
   * This method is intended as the main API for parsing recursively.
   * Rather than requiring parent parser classes to be responsible
   * for instantiating child parsers, calling parse() to resolve
   * a parsed syntax object from the current token, and manually
   * reassigning their own current tokens to the final token of the
   * child parser, we just contain the work here.
   */
  protected parseNextWith <T extends ISyntaxNode>(parser: Constructor<AbstractParser<T>>): T {
    const parserInstance = this.createChildParser(parser);
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

  /**
   * Assigns a message and error to the current parsing error object, and
   * throws an error to propagate up the parsing stack. As soon as a parser
   * has reason to throw an error, the file's entire parsing stream must be
   * stopped to avoid a parsing error cascade following the erroneous token.
   * If an error has already been assigned, we need not reassign one.
   */
  protected throw (message: string): void {
    if (!this.error.message) {
      this.error.message = message;

      this.error.tokenRange = {
        start: this.currentToken,
        end: this.currentToken
      };
    }

    throw new Error();
  }

  protected token (): IToken {
    return this.currentToken;
  }

  /**
   * Runs during each cycle of the parsing stream, looping over each
   * token matcher generated by a @Match() decorator to see whether
   * the current token satisfies its token match. If a match is found,
   * the decorated method is called. If no matches are found, the
   * parser halts.
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

  /**
   * Instantiates a parser class and provides it with the necessary
   * instance or static values to maintain the parsing stream's
   * contextual information.
   */
  private createChildParser <A extends AbstractParser>(ParserClass: Constructor<A>): A {
    const parser = new (ParserClass as IConstructable<A>)();

    this.provideSanitizers(parser);

    parser.error = this.error;

    return parser;
  }

  /**
   * @todo @description
   */
  private getDecoratedField <K extends keyof IDecoratedParser>(field: K): IDecoratedParser[K] {
    return (this.constructor as any as IDecoratedParser)[field];
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

    this.handleSanitizers();
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

    this.parsed.tokenRange.end = this.currentToken;

    if (this.isFinished) {
      // Advance the token stream after finishing so as
      // to break 'out' of the parsed chunk
      this.next();
    }
  }
}
