import AbstractValidator from '../common/AbstractValidator';
import JavaClassValidator from './JavaClassValidator';
import JavaImportValidator from './JavaImportValidator';
import JavaInterfaceValidator from './JavaInterfaceValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaValidator extends AbstractValidator<JavaSyntax.IJavaSyntaxTree> {
  @Implements public validate (): void {
    const { package: javaPackage, nodes } = this.syntaxNode;

    this.check(
      javaPackage !== null,
      'Java files must contain a package'
    );

    nodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.IMPORT:
          this.validateNodeWith(JavaImportValidator, syntaxNode as JavaSyntax.IJavaImport);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.validateNodeWith(JavaClassValidator, syntaxNode as JavaSyntax.IJavaClass);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.validateNodeWith(JavaInterfaceValidator, syntaxNode as JavaSyntax.IJavaInterface);
          break;
      }
    });
  }
}
