import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import SyntaxNodeBuilder from '../common/SyntaxNodeBuilder';
import { IConstructable } from '../../system/types';
import { IHashMap } from '../../system/types';
import { IToken, TokenType } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

/**
 * @internal
 */
type JavaSyntaxNodeParser = JavaClassParser | JavaInterfaceParser;

export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> {
  public static readonly AcceptedKeywords: string[] = [
    JavaConstants.Keyword.PACKAGE,
    JavaConstants.Keyword.IMPORT,
    JavaConstants.Keyword.CLASS,
    JavaConstants.Keyword.INTERFACE,
    JavaConstants.Keyword.PUBLIC,
    JavaConstants.Keyword.PROTECTED,
    JavaConstants.Keyword.PRIVATE
  ];

  public static readonly ParserMap: IHashMap<IConstructable<JavaSyntaxNodeParser>> = {
    [JavaConstants.Keyword.CLASS]: JavaClassParser,
    [JavaConstants.Keyword.INTERFACE]: JavaInterfaceParser
  };

  private _syntaxNodes: JavaSyntax.IJavaSyntaxNode[] = [];

  protected getParsed (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: this.currentLine,
      nodes: this._syntaxNodes
    };
  }

  protected handleNumber ({ value }: IToken): void {
    this.haltWithMessage(`Unexpected number '${value}'`);
  }

  protected handleSymbol ({ value }: IToken): void {
    this.haltWithMessage(`Unexpected character '${value}'`);
  }

  protected handleWord (token: IToken, index: number, tokens: IToken[]): void {
    const { value } = token;

    if (this.isStartOfLine) {
      const isValidStartingKeyword = JavaParser.AcceptedKeywords.indexOf(value) > -1;

      if (!isValidStartingKeyword) {
        this.haltWithMessage(`Invalid start of line keyword '${value}'`);
      }
    }

    const Parser = this._getParser(token);

    if (Parser) {
      const parser = new Parser(this.file);
      const syntaxNode = parser.parse(tokens, this.currentLine, this.currentTokenIndex);

      this._syntaxNodes.push(syntaxNode);

      this.currentLine = parser.getCurrentLine();
      this.currentTokenIndex = parser.getCurrentTokenIndex();
    } else {
      this.haltWithMessage(`Unexpected word '${value}'`);
    }
  }

  private _getParser ({ value, nextToken }: IToken): IConstructable<JavaSyntaxNodeParser> {
    switch (value) {
      case JavaConstants.Keyword.CLASS:
        return JavaClassParser;
      case JavaConstants.Keyword.INTERFACE:
        return JavaInterfaceParser;
      default:
        const isAccessModifier = JavaConstants.AccessModifierKeywords.indexOf(value) > -1;

        if (isAccessModifier) {
          const isNextTokenClassKeyword = nextToken.value === JavaConstants.Keyword.CLASS;
          const isNextTokenInterfaceKeyword = nextToken.value === JavaConstants.Keyword.INTERFACE;

          if (isNextTokenClassKeyword) {
            return JavaClassParser;
          } else if (isNextTokenInterfaceKeyword) {
            return JavaInterfaceParser;
          }
        }
    }

    this.haltWithMessage(`Unexpected expression '${value} ${nextToken.value}'`);
  }
}
