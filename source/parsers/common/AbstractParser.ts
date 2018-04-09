import Logger from '../../system/Logger';
import SyntaxNodeBuilder from './SyntaxNodeBuilder';
import { ISyntaxNode, ISyntaxTree } from './syntax';
import { IToken, TokenType } from '../../tokenizer/types';

export default abstract class AbstractParser<P extends ISyntaxTree | ISyntaxNode> {
  protected currentLine: number = 1;
  protected currentTokenIndex: number = 0;
  protected file: string;
  protected isFirstLine: boolean = true;
  protected isStartOfLine: boolean = true;
  protected logger: Logger = new Logger();
  private _isFinished: boolean = false;

  public constructor (file: string) {
    this.file = file;
  }

  public getCurrentLine (): number {
    return this.currentLine;
  }

  public getCurrentTokenIndex (): number {
    return this.currentTokenIndex;
  }

  public parse (tokens: IToken[], lineOffset: number = 0, tokenIndexOffset: number = 0): P {
    this.currentLine += lineOffset;
    this.currentTokenIndex += tokenIndexOffset;

    this.processTokens(tokens);

    return this.getParsed();
  }

  protected finish (): void {
    this._isFinished = true;
  }

  protected abstract getParsed (): P;

  protected haltWithMessage (message: string): void {
    this.logger.warn(`[${this.file}] Line ${this.currentLine}:`);
    this.logger.error(` ${this.constructor.name}: ${message}`);
  }

  protected abstract handleNumber (token: IToken, index: number, tokens: IToken[]): void;
  protected abstract handleSymbol (token: IToken, index: number, tokens: IToken[]): void;
  protected abstract handleWord (token: IToken, index: number, tokens: IToken[]): void;

  protected processTokens (tokens: IToken[]): void {
    let token: IToken;

    while (!this._isFinished && (token = tokens[this.currentTokenIndex])) {
      if (token.type === TokenType.NEWLINE) {
        this._handleNewline();
      } else {
        switch (token.type) {
          case TokenType.WORD:
            this.handleWord(token, this.currentTokenIndex, tokens);
            break;
          case TokenType.NUMBER:
            this.handleNumber(token, this.currentTokenIndex, tokens);
            break;
          case TokenType.SYMBOL:
            this.handleSymbol(token, this.currentTokenIndex, tokens);
            break;
        }

        this.isStartOfLine = false;
      }

      this.currentTokenIndex++;
    }
  }

  private _handleNewline (): void {
    this.currentLine++;
    this.isFirstLine = false;
    this.isStartOfLine = true;
  }
}
