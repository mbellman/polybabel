import AbstractTypeDefinition from '../../symbol-resolvers/common/AbstractTypeDefinition';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Dynamic, ISimpleType, TypeDefinition } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { ObjectType } from '../../symbol-resolvers/common/object-type';

export namespace TypeValidation {
  /**
   * Determines whether a source and comparison type are both
   * instances of the same type definition class.
   *
   * @internal
   */
  function typesHaveSameTypeDefinitionClass (sourceType: AbstractTypeDefinition, comparisonType: AbstractTypeDefinition): boolean {
    return sourceType.constructor === comparisonType.constructor;
  }

  /**
   * Perhaps the most important function in the entire program;
   * determines whether a provided source type matches a provided
   * comparison type. Matching is not determined by equivalence,
   * but by a condition of one-way substitutability. For example,
   * a source type might be a subtype of the comparison type, and
   * would thus satisfy the comparison's type constraint, though
   * the inverse would not apply.
   *
   * Matches are qualified if any of the following conditions are
   * met, given a source type S and a comparison type C:
   *
   *  1. S and C are identical
   *  2. C is a dynamic type
   *  3. S and C are equivalent simple types
   *  4. S and C are both objects, and S subtypes C (e.g. has a supertype identical to C)
   *
   * @todo individual object member comparison as a fallback for nominally non-matching types
   * @todo function type matching
   * @todo array type matching
   */
  export function typeMatches (sourceType: TypeDefinition, comparisonType: TypeDefinition): boolean {
    if (sourceType === comparisonType) {
      // If the source and compared types are equal, the
      // source type trivially matches (#1).
      return true;
    }

    const sourceAsSimpleType = sourceType as ISimpleType;
    const comparisonAsSimpleType = comparisonType as ISimpleType;

    if (comparisonAsSimpleType.type === Dynamic) {
      // If the comparison type is dynamic, the source type
      // automatically matches (#2).
      return true;
    }

    if (sourceAsSimpleType.type && comparisonAsSimpleType.type) {
      // If the source and comparison types are both simple
      // types with the same 'type' property value, they
      // are equivalent simple types (#3).
      return sourceAsSimpleType.type === comparisonAsSimpleType.type;
    }

    if (!typesHaveSameTypeDefinitionClass(sourceType as AbstractTypeDefinition, comparisonType as AbstractTypeDefinition)) {
      // If the source and comparison types are not of the
      // same class of type definition, the source cannot
      // match the comparison type.
      return false;
    }

    if (
      sourceType instanceof ObjectType.Definition &&
      sourceType.isSubtypeOf(comparisonType as ObjectType.Definition)
    ) {
      // If the source type subtypes the comparison type, the
      // comparison type may be substituted with the source
      // type; thus the source type matches (#4).
      return true;
    }

    return false;
  }
}
