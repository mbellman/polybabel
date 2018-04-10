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
  protected isFirstToken: boolean = true;
  protected isStartOfLine: boolean = true;
  protected parsed: P = this.getDefault();
  private _isFinished: boolean = false;

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

  protected parseNextWith <T extends ISyntaxTree | ISyntaxNode>(Parser: IConstructable<AbstractParser<T>>): T {
    const parser = new Parser();
    const parsed = parser.parse(this.currentToken);

    this.currentToken = parser.token();

    return parsed;
  }

  protected skip (n: number): void {
    while (--n >= 0) {
      this._advanceToken();
    }
  }

  protected throw (message: string): void {
    throw new Error(`Line ${this.currentToken.line}: ${message} (${this.constructor.name})`);
  }

  private _match (matchers: Matcher[] = []): void {
    const { value } = this.currentToken;

    for (const [ match, handler ] of matchers) {
      const isMatching =
        value === match ||
        Array.isArray(match) && match.indexOf(value) > -1 ||
        match instanceof RegExp && match.test(value);

      if (isMatching) {
        handler.call(this);

        return;
      }
    }

    this.throw(`Unexpected token '${value}'`);
  }

  private _advanceToken (): void {
    this.currentToken = this.currentToken.nextToken;
  }

  private _stream (token: IToken): void {
    this.currentToken = token;

    while (!this._isFinished && this.currentToken) {
      switch (this.currentToken.type) {
        case TokenType.WORD:
          this._match((this as any).words);
          break;
        case TokenType.NUMBER:
          this._match((this as any).numbers);
          break;
        case TokenType.SYMBOL:
          this._match((this as any).symbols);
          break;
      }

      this.isFirstToken = false;
      this.isStartOfLine = this.currentToken.type === TokenType.NEWLINE;

      this._advanceToken();
    }
  }
}

export abstract class AbstractBlockParser<P extends ISyntaxTree | ISyntaxNode> extends AbstractParser<P> {
  private _blockLevel: number = 0;

  protected onBlockEnter (): void {
    this._blockLevel++;
  }

  protected onBlockExit (): void {
    if (--this._blockLevel === 0) {
      this.finish();
    }
  }
}
