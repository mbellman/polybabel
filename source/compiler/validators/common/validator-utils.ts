import { Dynamic, ISimpleType, ObjectCategory, Primitive, TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';

export namespace ValidatorUtils {
  export function isDynamicType (typeDefinition: TypeDefinition): boolean {
    return (typeDefinition as ISimpleType).type === Dynamic;
  }

  export function isSimpleTypeOf ( type: Primitive | Dynamic | Void, typeDefinition: TypeDefinition): boolean {
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

  /**
   * @todo @description
   */
  export function typeMatches (sourceType: TypeDefinition, comparedType: TypeDefinition): boolean {
    if (sourceType === comparedType) {
      // If the source and compared types are equal,
      // the two trivially match.
      return true;
    }

    const sourceAsSimpleType = sourceType as ISimpleType;
    const comparedAsSimpleType = comparedType as ISimpleType;

    if (sourceAsSimpleType.type && comparedAsSimpleType.type) {
      // If the source and compared types are both simple
      // types with the same 'type' property value, they
      // are equivalent simple types.
      return sourceAsSimpleType.type === comparedAsSimpleType.type;
    }

    return false;
  }
}
