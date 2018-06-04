import { Dynamic, ISimpleType, ObjectCategory, Primitive, TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';

export namespace ValidationUtils {
  export function isDynamicType (typeDefinition: TypeDefinition): boolean {
    return (typeDefinition as ISimpleType).type === Dynamic;
  }

  export function isSimpleTypeOf (typeDefinition: TypeDefinition, type: Primitive | Dynamic | Void): boolean {
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
}
