import { IConstructable, Constructor } from '../../system/types';
import { IToken } from '../../tokenizer/types';
import { ParsedSyntax } from './parser-types';
import { TokenMatcher } from './parser-types';

export default abstract class AbstractParser<P extends ParsedSyntax = ParsedSyntax> {
  protected abstract currentToken: IToken;
  protected abstract parsed: P;

  protected abstract get nextCharacterToken (): IToken;
  protected abstract get nextToken (): IToken;
  protected abstract get previousToken (): IToken;
  protected abstract get previousCharacterToken (): IToken;

  /**
   * Constructs and returns a new instance of a {ParserClass}
   * implementing AbstractParser.
   *
   * Many implementations of AbstractParser may themselves be
   * abstract, relying on @Composes() to assimilate behaviors
   * from other parser classes, and otherwise prohibiting free
   * construction aside from parseNextWith(). This method provides
   * the mechanism for constructing them anyway.
   */
  protected createParser <A extends AbstractParser>(ParserClass: Constructor<A>): A {
    return new (ParserClass as IConstructable<A>)();
  }

  public abstract parse (token: IToken): P;
  public abstract token (): IToken;
  protected abstract assert (condition: boolean, errorMessage: string): void;
  protected abstract assertCurrentTokenValue (targetValue: string, errorMessage: string): void;
  protected abstract getDefault (): P;
  protected abstract finish (): void;
  protected abstract halt (): void;
  protected abstract isStartOfLine (): boolean;
  protected abstract lineContains (targetValue: string | RegExp): boolean;
  protected abstract match (matchers: TokenMatcher[]): void;
  protected abstract matchValue (value: string, matchers: TokenMatcher[]): void;
  protected abstract onFirstToken (): void;
  protected abstract parseNextWith <T extends ParsedSyntax>(parser: Constructor<AbstractParser<T>>): T;
  protected abstract skip (steps: number): void;
  protected abstract throw (message: string): void;
}
