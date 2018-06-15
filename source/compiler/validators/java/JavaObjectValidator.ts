import AbstractValidator from '../common/AbstractValidator';
import JavaClassValidator from './JavaClassValidator';
import JavaInterfaceValidator from './JavaInterfaceValidator';
import JavaObjectMethodValidator from './JavaObjectMethodValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';

export default class JavaObjectValidator extends AbstractValidator<JavaSyntax.IJavaObject> {
  @Implements public validate (): void {
    const { name, members } = this.syntaxNode;
    const { scopeManager, objectVisitor } = this.context;
    const ownType = this.findTypeDefinitionByName(name) as ObjectType.Definition;

    objectVisitor.visitObject(ownType);
    scopeManager.addToScope(name, ownType);
    scopeManager.enterScope();

    this.enterNamespace(name);

    members.forEach(member => {
      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
          this.validateObjectField(member as JavaSyntax.IJavaObjectField);
          break;
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
          this.validateNodeWith(JavaObjectMethodValidator, member as JavaSyntax.IJavaObjectMethod);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.validateNodeWith(JavaClassValidator, member as JavaSyntax.IJavaClass);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.validateNodeWith(JavaInterfaceValidator, member as JavaSyntax.IJavaInterface);
          break;
      }
    });

    scopeManager.exitScope();
    objectVisitor.leaveObject();

    this.exitNamespace();
  }

  /**
   * @todo
   */
  private validateObjectField (objectField: JavaSyntax.IJavaObjectField): void {
    const { type } = objectField;
  }
}
