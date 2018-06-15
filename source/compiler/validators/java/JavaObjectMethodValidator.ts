import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory } from '../../symbol-resolvers/common/types';
import { TypeExpectation } from '../common/types';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  @Implements public validate (): void {
    const { type, name, isAbstract, block } = this.syntaxNode;
    const parentObjectType = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectType.category === ObjectCategory.INTERFACE;
    const identifier = `${parentObjectType.name}.${name}`;

    this.focusToken(type.token);

    const returnTypeDefinition = this.findTypeDefinition(type.namespaceChain);

    this.expectType({
      type: returnTypeDefinition,
      expectation: TypeExpectation.RETURN
    });

    if (isAbstract) {
      const abstractKeywordToken = ValidatorUtils.findKeywordToken(JavaConstants.Keyword.ABSTRACT, type.token, token => token.previousTextToken);

      this.focusToken(abstractKeywordToken);

      this.check(
        !isInterfaceMethod,
        `Interface method '${identifier}' cannot be abstract`
      );

      this.check(
        block === null,
        `Abstract method '${identifier}' cannot have an implementation`
      );
    } else {
      this.check(
        block !== null || isInterfaceMethod,
        `Non-abstract method '${identifier}' must have an implementation`
      );
    }

    if (block) {
      this.validateNodeWith(JavaBlockValidator, block);
    }

    this.resetExpectedType();
  }
}
