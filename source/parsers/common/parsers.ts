import { Callback, IConstructable, IHashMap } from '../../system/types';
import { ISyntaxNode, ISyntaxTree } from './syntax';
import { IToken, TokenType } from '../../tokenizer/types';

export type Matcher = [string | RegExp | (RegExp | string)[], Callback];

export interface INumberParser {
  readonly numbers: Matcher[];
}

export interface ISymbolParser {
  readonly symbols: Matcher[];
}

export interface IWordParser {
  readonly words: Matcher[];
}

export abstract class AbstractParser<P extends ISyntaxTree | ISyntaxNode> {
  protected currentToken: IToken;
  protected isStartOfLine: boolean = true;
  protected parsed: P = this.getDefault();
  private _isFinished: boolean = false;

  /**
   * Receives a single {token} and attempts to parse and return a
   * syntax tree or syntax node object by streaming through the
   * next tokens in the token sequence.
   */
  public parse (token: IToken): P {
    this._stream(token);

    return this.parsed;
  }

  public token (): IToken {
    return this.currentToken;
  }

  protected abstract getDefault (): P;

  protected finish (): void {
    this._isFinished = true;
  }

  protected halt (tokenName: string = 'token'): void {
    this.throw(`Unexpected ${tokenName} '${this.currentToken.value}'`);
  }

  protected lineContains (value: string | number | RegExp): boolean {
    let token = this.currentToken;

    while ((token = token.nextToken) && token.type !== TokenType.NEWLINE) {
      const tokenValueMatches =
        value === token.value ||
        value instanceof RegExp && value.test(token.value);

      if (tokenValueMatches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Attempts to find a Matcher for a provided {value} among an array
   * of {matchers}, and fires its callback. If no matching value is
   * found, the parser halts.
   */
  protected match (value: string, matchers: Matcher[] = []): void {
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

  protected nextNumber (): string {
    return this._getNextTokenValueByType(TokenType.NUMBER);
  }

  protected nextSymbol (): string {
    return this._getNextTokenValueByType(TokenType.SYMBOL);
  }

  protected nextToken (): IToken {
    while (this.currentToken && this.currentToken.type === TokenType.NEWLINE) {
      if (!this.currentToken.nextToken) {
        this.halt('end of file');
      }

      this.currentToken = this.currentToken.nextToken;
    }

    return this.currentToken;
  }

  protected nextWord (): string {
    return this._getNextTokenValueByType(TokenType.WORD);
  }

  /**
   * An optionally overridable hook for parsing the first received token.
   */
  protected onFirstToken (): void { }

  /**
   * Attempts to parse a token stream starting from the current token
   * using a provided {Parser}, where Parser subclasses AbstractParser.
   * If successful, returns the parsed syntax tree or syntax node and
   * assigns the current token to the last token handled by the Parser.
   */
  protected parseNextWith <T extends ISyntaxTree | ISyntaxNode>(Parser: IConstructable<AbstractParser<T>>): T {
    const parser = new Parser();
    const parsed = parser.parse(this.currentToken);

    this.currentToken = parser.token();

    return parsed;
  }

  protected skip (n: number): void {
    while (--n >= 0) {
      if (!this.currentToken.nextToken) {
        this.throw('End of file reached');
      }

      this.currentToken = this.currentToken.nextToken;

      while (this.currentToken.type === TokenType.NEWLINE) {
        this.currentToken = this.currentToken.nextToken;
      }
    }
  }

  protected throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message} (${this.constructor.name})`);
  }

  private _getNextTokenValueByType (tokenType: TokenType): string {
    let token = this.currentToken;

    while (token.nextToken.type !== tokenType) {
      token = token.nextToken;
    }

    return token ? token.value : null;
  }

  private _stream (token: IToken): void {
    let isFirstToken = true;

    this.currentToken = token;

    while (!this._isFinished && this.currentToken) {
      if (isFirstToken && this.currentToken.type !== TokenType.NEWLINE) {
        this.onFirstToken();

        isFirstToken = false;
      }

      this.isStartOfLine = this.currentToken.lastToken
        ? this.currentToken.lastToken.type === TokenType.NEWLINE
        : true;

      const { type, value } = this.currentToken;

      switch (type) {
        case TokenType.WORD:
          this.match(value, (this as any).words);
          break;
        case TokenType.NUMBER:
          this.match(value, (this as any).numbers);
          break;
        case TokenType.SYMBOL:
          this.match(value, (this as any).symbols);
          break;
      }

      this.skip(1);
    }
  }
}

export abstract class AbstractBlockParser<P extends ISyntaxTree | ISyntaxNode> extends AbstractParser<P> {
  protected blockLevel: number = 0;

  protected onBlockEnter (): void {
    this.blockLevel++;
  }

  protected onBlockExit (): void {
    if (--this.blockLevel === 0) {
      this.finish();
    }
  }
}
