import { Dynamic, IObjectMember, ISimpleType, ObjectMemberVisibility, TypeDefinition } from './types';

export namespace TypeUtils {
  export function createDynamicType (): ISimpleType {
    return {
      type: Dynamic
    };
  }

  export function createDynamicObjectMember (): IObjectMember<ISimpleType> {
    return {
      isConstant: false,
      isStatic: false,
      visibility: ObjectMemberVisibility.ALL,
      type: createDynamicType()
    };
  }
}
