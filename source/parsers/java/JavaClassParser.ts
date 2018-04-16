import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import { Implements, Override } from 'trampoline-framework';
import { isAccessModifierKeyword, isModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';
import JavaObjectFieldParser from './JavaObjectFieldParser';

@Parser({
  type: JavaClassParser,
  words: [
    [/./, 'onClassMemberDeclaration']
  ],
  symbols: [
    ['{', 'onOpenBrace']
  ]
})
export default class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  @Implements public getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      nestedClasses: [],
      fields: [],
      methods: []
    };
  }

  public onClassMemberDeclaration (): void {
    const isNestedClassDeclaration = this.lineContains(JavaConstants.Keyword.CLASS);
    const isNestedInterfaceDeclaration = this.lineContains(JavaConstants.Keyword.INTERFACE);
    const isMethodDeclaration = this.lineContains('(');
    const isFieldDeclaration = !isMethodDeclaration && !isNestedClassDeclaration && !isNestedInterfaceDeclaration;

    this.halt();
  }

  @Override public onFirstToken (): void {
    this.emulate(JavaModifiableParser);

    this.assertCurrentTokenValue(
      JavaConstants.Keyword.CLASS,
      `Invalid class modifier ${this.currentToken.value}`
    );

    this.next();

    this.parsed.name = this.currentToken.value;

    this.next();
  }

  public onNestedClassDeclaration (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }

  public onOpenBrace (): void {
    const { fields, methods } = this.parsed;

    this.assert(fields.length === 0 && methods.length === 0);
    this.next();
  }
}
