import { Dynamic, ISimpleType, Primitive, Void } from './types';

export namespace TypeUtils {
  export function createSimpleType (type: Primitive | Dynamic | Void): ISimpleType {
    return { type };
  }
}
