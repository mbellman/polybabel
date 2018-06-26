import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Callback } from '../../../system/types';
import { Dynamic, ISimpleType, ObjectCategory, Primitive, TypeDefinition, Void, ITypeConstraint } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { IToken } from '../../../tokenizer/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TokenUtils } from '../../../tokenizer/token-utils';

export namespace ValidatorUtils {
  export function isSimpleType (typeDefinition: TypeDefinition): boolean {
    return !!(typeDefinition as ISimpleType).type;
  }

  export function isSimpleTypeOf (type: Primitive | Dynamic | Void, typeDefinition: TypeDefinition): boolean {
    return (typeDefinition as ISimpleType).type === type;
  }

  export function isInterfaceType (typeDefinition: TypeDefinition): boolean {
    return (
      typeDefinition instanceof ObjectType.Definition &&
      typeDefinition.category === ObjectCategory.INTERFACE
    );
  }

  export function isClassType (typeDefinition: TypeDefinition): boolean {
    return (
      typeDefinition instanceof ObjectType.Definition &&
      typeDefinition.category === ObjectCategory.CLASS
    );
  }

  export function getTypeConstraintDescription ({ typeDefinition, isOriginal }: ITypeConstraint): string {
    let description = isOriginal ? 'Type: ' : '';

    if (typeDefinition instanceof ObjectType.Definition) {
      description += typeDefinition.name || 'Object';
    } else if (typeDefinition instanceof ArrayType.Definition) {
      const elementTypeDescription = getTypeConstraintDescription(typeDefinition.getElementTypeConstraint());

      description += `${elementTypeDescription}[]`;
    } else if (typeDefinition instanceof FunctionType.Definition) {
      const parameterTypeConstraints = typeDefinition.getParameterTypeConstraints();
      const parameterTypeDescriptions = parameterTypeConstraints.map(constraint => `'${getTypeConstraintDescription(constraint)}'`);
      const returnTypeDescription = getTypeConstraintDescription(typeDefinition.getReturnTypeConstraint());

      description += `(${parameterTypeDescriptions.join(', ')}) => ${returnTypeDescription}`;
    } else {
      description += (typeDefinition as ISimpleType).type;
    }

    return description;
  }

  /**
   * Finds a token corresponding to a provided keyword, given a
   * starting token and token step function. This is a special
   * contingency to retrieve keyword tokens so they can be focused
   * during error reporting when the original token reference is
   * unavailable.
   *
   * Found tokens must be on the same line as the starting token.
   */
  export function findKeywordToken (keyword: string, startingToken: IToken, tokenStepFunction: Callback<IToken, IToken>): IToken {
    const searchKeywordToken = TokenUtils.createTokenSearcher(
      tokenStepFunction,
      token => token.value === keyword,
      token => TokenUtils.isStartOfLine(token)
    );

    return searchKeywordToken(startingToken);
  }
}
