import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory, TypeDefinition } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { JavaValidatorUtils } from './java-validator-utils';
import { ValidatorUtils } from '../common/validator-utils';
import { JavaConstants } from '../../../parser/java/java-constants';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  @Implements public validate (): void {
    const { type, name, isAbstract, block } = this.syntaxNode;
    const parentObjectType = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectType.category === ObjectCategory.INTERFACE;
    const identifier = `${parentObjectType.name}.${name}`;
    const returnTypeDefinition = JavaValidatorUtils.getTypeDefinition(type, this.validationHelper);

    this.focus(type.token);

    if (returnTypeDefinition instanceof FunctionType.Definition) {
      const returnTypeDescription = ValidatorUtils.getTypeDescription(returnTypeDefinition);

      this.report(`Method '${identifier}' cannot return '${returnTypeDescription}'`);
    }

    this.context.expectType({
      type: returnTypeDefinition,
      expectation: 'return type'
    });

    if (isAbstract) {
      const abstractKeywordToken = ValidatorUtils.findKeywordToken(JavaConstants.Keyword.ABSTRACT, type.token, token => token.previousTextToken);

      this.focus(abstractKeywordToken);

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

    this.context.resetExpectedType();
  }
}
