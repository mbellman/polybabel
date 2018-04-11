import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import { AbstractParser, IWordParser, Matcher } from '../common/parsers';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> implements IWordParser {
  public readonly words: Matcher[] = [
    [JavaConstants.Keyword.PACKAGE, this._onPackageDeclaration],
    [JavaConstants.Keyword.IMPORT, this._onImportDeclaration],
    [
      [
        JavaConstants.Keyword.CLASS,
        JavaConstants.Keyword.FINAL,
        JavaConstants.Keyword.ABSTRACT
      ],
      this._onClassDeclaration
    ],
    [JavaConstants.Keyword.INTERFACE, this._onInterfaceDeclaration],
    [JavaConstants.AccessModifierKeywords, this._onAccessModifier]
  ];

  protected getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: 0,
      nodes: []
    };
  }

  private _onAccessModifier (): void {
    const { nextToken } = this.currentToken;

    this.match(nextToken.value, [
      [JavaConstants.Keyword.CLASS, this._onClassDeclaration],
      [JavaConstants.Keyword.INTERFACE, this._onInterfaceDeclaration]
    ]);
  }

  private _onClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nodes.push(javaClass);
  }

  private _onImportDeclaration (): void {

  }

  private _onInterfaceDeclaration (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    console.log(javaInterface);

    this.parsed.nodes.push(javaInterface);
  }

  private _onPackageDeclaration (): void {

  }
}
