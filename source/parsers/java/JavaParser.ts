import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import { IWordParser, Matcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> implements IWordParser {
  public readonly words: Matcher[] = [
    [JavaConstants.Keyword.PACKAGE, this._onPackageDeclaration],
    [JavaConstants.Keyword.IMPORT, this._onImportDeclaration],
    [JavaConstants.Keyword.CLASS, this._onClassDeclaration],
    [JavaConstants.Keyword.INTERFACE, this._onInterfaceDeclaration],
    [
      [
        ...JavaConstants.AccessModifiers,
        ...JavaConstants.Modifiers
      ],
      this._onModifierKeyword
    ]
  ];

  protected getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: 0,
      nodes: []
    };
  }

  private _onModifierKeyword (): void {
    const isModifyingClass = this.lineContains(JavaConstants.Keyword.CLASS);
    const isModifyingInterface = this.lineContains(JavaConstants.Keyword.INTERFACE);

    this.assert(
      isModifyingClass !== isModifyingInterface,
      'Invalid object declaration'
    );

    if (isModifyingClass) {
      this._onClassDeclaration();
    } else {
      this._onInterfaceDeclaration();
    }
  }

  private _onClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nodes.push(javaClass);
  }

  private _onImportDeclaration (): void {

  }

  private _onInterfaceDeclaration (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    this.parsed.nodes.push(javaInterface);
  }

  private _onPackageDeclaration (): void {

  }
}
