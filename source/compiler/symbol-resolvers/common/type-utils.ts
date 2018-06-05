import { Dynamic, IObjectMember, ISimpleType, ObjectMemberVisibility, Primitive, TypeDefinition, Void } from './types';

export namespace TypeUtils {
  export function createDynamicObjectMember (): IObjectMember<ISimpleType> {
    return {
      visibility: ObjectMemberVisibility.ALL,
      type: createSimpleType(Dynamic)
    };
  }

  export function createSimpleType (type: Primitive | Dynamic | Void): ISimpleType {
    return { type };
  }
}
