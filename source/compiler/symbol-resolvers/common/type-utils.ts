import { Dynamic, ISimpleType, Primitive, Void, TypeDefinition } from './types';
import { ArrayType } from './array-type';
import SymbolDictionary from './SymbolDictionary';

export namespace TypeUtils {
  export function createSimpleType (type: Primitive | Dynamic | Void): ISimpleType {
    return { type };
  }

  export function createArrayType (symbolDictionary: SymbolDictionary, elementType: TypeDefinition, dimensions: number = 1): ArrayType.Definition {
    let type = elementType;

    while (dimensions-- > 0) {
      const arrayType = new ArrayType.Definer(symbolDictionary);

      arrayType.defineElementType(type);

      type = arrayType;
    }

    return type as ArrayType.Definition;
  }
}
