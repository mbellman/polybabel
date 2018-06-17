import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory, TypeDefinition } from '../../symbol-resolvers/common/types';
import { TypeExpectation } from '../common/types';
import { ValidatorUtils } from '../common/validator-utils';
import { ArrayType } from '../../symbol-resolvers/common/array-type';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  @Implements public validate (): void {
    const { type, name, isAbstract, block } = this.syntaxNode;
    const parentObjectType = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectType.category === ObjectCategory.INTERFACE;
    const identifier = `${parentObjectType.name}.${name}`;
    const returnTypeDefinition = this.getReturnTypeDefinition();

    this.focusToken(type.token);

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

  private getReturnTypeDefinition (): TypeDefinition {
    const { type } = this.syntaxNode;
    const { symbolDictionary } = this.context;
    let returnType = this.findTypeDefinition(type.namespaceChain);
    let remainingArrayDimensions = type.arrayDimensions;

    while (remainingArrayDimensions-- > 0) {
      const arrayType = new ArrayType.Definer(symbolDictionary);

      arrayType.defineElementType(returnType);

      returnType = arrayType;
    }

    return returnType;
  }
}
