import AbstractValidator from '../common/AbstractValidator';
import JavaClassValidator from './JavaClassValidator';
import JavaImportValidator from './JavaImportValidator';
import JavaInterfaceValidator from './JavaInterfaceValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaValidator extends AbstractValidator<JavaSyntax.IJavaSyntaxTree> {
  @Implements public validate (javaSyntaxTree: JavaSyntax.IJavaSyntaxTree): void {
    const { package: javaPackage, nodes } = javaSyntaxTree;

    this.assertAndContinue(
      javaPackage !== null,
      'Java files must contain a package'
    );

    nodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.IMPORT:
          this.validateNodeWith(JavaImportValidator, syntaxNode);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.validateNodeWith(JavaClassValidator, syntaxNode);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.validateNodeWith(JavaInterfaceValidator, syntaxNode);
          break;
      }
    });
  }
}
