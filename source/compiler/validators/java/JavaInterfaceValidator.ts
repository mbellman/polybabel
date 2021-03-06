import AbstractValidator from '../common/AbstractValidator';
import JavaObjectValidator from './JavaObjectValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';

export default class JavaInterfaceValidator extends AbstractValidator<JavaSyntax.IJavaInterface> {
  private ownTypeDefinition: ObjectType.Definition;

  @Implements public validate (): void {
    const { name, constructors } = this.syntaxNode;
    const { objectVisitor } = this.context;
    const { typeDefinition } = this.findTypeConstraintByName(name) as ObjectType.Constraint;

    this.ownTypeDefinition = typeDefinition;

    objectVisitor.visitObject(this.ownTypeDefinition);

    if (constructors.length > 0) {
      this.focusTokenRange(constructors[0].type.tokenRange);
      this.report(`Interface '${name}' cannot have any constructors`);
    }

    this.validateNodeWith(JavaObjectValidator, this.syntaxNode);

    objectVisitor.leaveObject();
  }
}
