import AbstractValidator from '../common/AbstractValidator';
import JavaClassValidator from './JavaClassValidator';
import JavaInterfaceValidator from './JavaInterfaceValidator';
import JavaObjectMethodValidator from './JavaObjectMethodValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaObjectValidator extends AbstractValidator<JavaSyntax.IJavaObject> {
  @Implements public validate (): void {
    const { members } = this.syntaxNode;

    members.forEach(member => {
      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
          this.validateObjectField(member as JavaSyntax.IJavaObjectField);
          break;
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
          this.validateNodeWith(JavaObjectMethodValidator, member as JavaSyntax.IJavaObjectMethod);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.validateNodeWith(JavaClassValidator, member);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.validateNodeWith(JavaInterfaceValidator, member);
          break;
      }
    });
  }

  private validateObjectField (objectField: JavaSyntax.IJavaObjectField): void {
    const { type } = objectField;
  }
}
