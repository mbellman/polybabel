import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

@Parser({
  type: JavaParser,
  words: [
    [JavaConstants.Keyword.PACKAGE, 'onPackageDeclaration'],
    [JavaConstants.Keyword.IMPORT, 'onImportDeclaration'],
    [JavaConstants.Keyword.CLASS, 'onClassDeclaration'],
    [JavaConstants.Keyword.INTERFACE, 'onInterfaceDeclaration'],
    [
      [
        ...JavaConstants.AccessModifiers,
        ...JavaConstants.Modifiers
      ],
      'onModifierKeyword'
    ]
  ]
})
export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> {
  public constructor () {
    super();
  }

  public getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      lines: 0,
      nodes: []
    };
  }

  public onModifierKeyword (): void {
    const isModifyingClass = this.lineContains(JavaConstants.Keyword.CLASS);
    const isModifyingInterface = this.lineContains(JavaConstants.Keyword.INTERFACE);

    this.assert(
      isModifyingClass !== isModifyingInterface,
      'Invalid object declaration'
    );

    if (isModifyingClass) {
      this.onClassDeclaration();
    } else {
      this.onInterfaceDeclaration();
    }
  }

  public onClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nodes.push(javaClass);
  }

  public onImportDeclaration (): void {

  }

  public onInterfaceDeclaration (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    this.parsed.nodes.push(javaInterface);
  }

  public onPackageDeclaration (): void {

  }
}
