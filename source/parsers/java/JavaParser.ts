import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import { AbstractParser, IWordParser, Matcher } from '../common/parsers';
import { IConstructable } from '../../system/types';
import { IHashMap } from '../../system/types';
import { IToken, TokenType } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> implements IWordParser {
  public readonly words: Matcher[] = [
    [JavaConstants.Keyword.PACKAGE, this._onPackageDeclaration],
    [JavaConstants.Keyword.IMPORT, this._onImportDeclaration],
    [JavaConstants.Keyword.CLASS, this._onClassDeclaration],
    [JavaConstants.Keyword.INTERFACE, this._onInterfaceDeclaration]
  ];

  protected getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: 0,
      nodes: []
    };
  }

  private _onPackageDeclaration (): void {

  }

  private _onImportDeclaration (): void {

  }

  private _onClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nodes.push(javaClass);
  }

  private _onInterfaceDeclaration (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    this.parsed.nodes.push(javaInterface);
  }
}
