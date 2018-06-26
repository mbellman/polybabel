import { Dynamic, ISimpleType, Primitive, Void, TypeDefinition, ITypeConstraint } from './types';
import { ArrayType } from './array-type';
import SymbolDictionary from './SymbolDictionary';

export namespace TypeUtils {
  export function createSimpleType (type: Primitive | Dynamic | Void): ISimpleType {
    return { type };
  }

  export function createArrayTypeConstraint (symbolDictionary: SymbolDictionary, elementTypeConstraint: ITypeConstraint, dimensions: number = 1): ArrayType.Constraint {
    let constraint = elementTypeConstraint;

    while (dimensions-- > 0) {
      const arrayType = new ArrayType.Definer(symbolDictionary);

      arrayType.defineElementTypeConstraint(constraint);

      constraint = {
        typeDefinition: arrayType
      };
    }

    return constraint as ArrayType.Constraint;
  }
}
