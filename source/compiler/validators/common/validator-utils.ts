import { Dynamic, ISimpleType, ObjectCategory, Primitive, TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { FunctionType } from '../../symbol-resolvers/common/function-type';

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

  export function getTypeDescription (typeDefinition: TypeDefinition): string {
    if (typeDefinition instanceof ObjectType.Definition) {
      return typeDefinition.name || 'Object';
    } else if (typeDefinition instanceof ArrayType.Definition) {
      const elementTypeDescription = getTypeDescription(typeDefinition.getElementType());

      return `${elementTypeDescription}[]`;
    } else if (typeDefinition instanceof FunctionType.Definition) {
      const returnTypeDescription = getTypeDescription(typeDefinition.getReturnType());

      return `Function => ${returnTypeDescription}`;
    } else {
      return (typeDefinition as ISimpleType).type;
    }
  }
}
