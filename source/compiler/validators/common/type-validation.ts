import AbstractTypeDefinition from '../../symbol-resolvers/common/AbstractTypeDefinition';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Dynamic, ISimpleType, TypeDefinition, ITypeConstraint } from '../../symbol-resolvers/common/types';
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
   * Determines whether a provided type definition corresponds
   * to a dynamic type.
   */
  export function isDynamic (typeDefinition: TypeDefinition): boolean {
    return (typeDefinition as ISimpleType).type === Dynamic;
  }

  /**
   * @todo @description
   */
  export function allTypeConstraintsMatch (sources: ITypeConstraint[], comparisons: ITypeConstraint[]): boolean {
    if (sources.length !== comparisons.length) {
      return false;
    }

    for (let i = 0; i < comparisons.length; i++) {
      if (!typeConstraintMatches(sources[i], comparisons[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * @todo @description
   */
  export function functionTypeMatches (source: FunctionType.Definition, comparison: FunctionType.Definition): boolean {
    return (
      typeConstraintMatches(source.getReturnTypeConstraint(), comparison.getReturnTypeConstraint()) &&
      allTypeConstraintsMatch(source.getParameterTypeConstraints(), comparison.getParameterTypeConstraints())
    );
  }

  /**
   * Perhaps the most important function in the entire program;
   * determines whether a provided source type constraint matches
   * a provided comparison type constraint. A match doesn't imply
   * type equivalence, but a condition of one-way substitutability.
   * For example, a source type constraint might be a subtype of
   * the comparison type constraint, and would thus 'match' the
   * comparison, though the inverse would not apply.
   *
   * Matches are qualified if any of the following conditions are
   * met, given a source type constraint S and a comparison type
   * constraint C:
   *
   *  1. S and C are identical, or have identical type definitions where S is not an original type
   *  2. C's type definition is dynamic
   *  3. S and C are constraints of equal simple types
   *  4. S and C are both object type constraints, and S subtypes C (e.g. has a supertype identical to C)
   *  5. S and C are both function type constraints, and S and C share parameter type and return type constraints
   *  6. S and C are both array type constraints, and S's element type constraint matches C's
   *
   * @todo individual object member comparison as a fallback for nominally non-matching types
   */
  export function typeConstraintMatches (source: ITypeConstraint, comparison: ITypeConstraint): boolean {
    if (
      source === comparison || (
        source.typeDefinition === comparison.typeDefinition &&
        !source.isOriginal
      )
    ) {
      // If the source and comparison are identical, the
      // source trivially matches the comparison. If the
      // source has an identical type definition to the
      // comparison and is not original (e.g. an instance
      // of an original class type constraint), the source
      // is also considered to match the comparison. (#1)
      return true;
    }

    if (isDynamic(comparison.typeDefinition)) {
      // If the comparison's type definition is dynamic, the
      // source automatically matches the comparison (#2)
      return true;
    }

    const { typeDefinition: sourceTypeDefinition } = source;
    const { typeDefinition: comparisonTypeDefinition } = comparison;
    const sourceAsSimpleType = sourceTypeDefinition as ISimpleType;
    const comparisonAsSimpleType = comparisonTypeDefinition as ISimpleType;

    if (sourceAsSimpleType.type && comparisonAsSimpleType.type) {
      // If the source and comparison types are both simple
      // types with the same 'type' property value, they
      // are equivalent simple types (#3)
      return sourceAsSimpleType.type === comparisonAsSimpleType.type;
    }

    if (
      !typesHaveSameTypeDefinitionClass(sourceTypeDefinition as AbstractTypeDefinition, comparisonTypeDefinition as AbstractTypeDefinition) ||
      source.isOriginal && !comparison.isOriginal
    ) {
      // If the source and comparison types are not of the
      // same class of type definition, or if the source is
      // an original type constraint while the comparison
      // is not, the source cannot match the comparison type
      return false;
    }

    if (
      sourceTypeDefinition instanceof ObjectType.Definition &&
      sourceTypeDefinition.isSubtypeOf(comparison.typeDefinition)
    ) {
      // If the source type subtypes the comparison type, the
      // comparison type may be substituted with the source
      // type; thus the source type matches (#4)
      return true;
    }

    if (sourceTypeDefinition instanceof FunctionType.Definition) {
      // If the source type is a function type which matches a
      // comparison function type, the source type matches (#5)
      return functionTypeMatches(sourceTypeDefinition, comparisonTypeDefinition as FunctionType.Definition);
    }

    if (sourceTypeDefinition instanceof ArrayType.Definition) {
      // If the source type is an array of a given type which
      // matches the element type of the comparison array type,
      // the source type matches (#6)
      const sourceElementTypeConstraint = sourceTypeDefinition.getElementTypeConstraint();
      const comparisonElementTypeConstraint = (comparisonTypeDefinition as ArrayType.Definition).getElementTypeConstraint();

      return typeConstraintMatches(sourceElementTypeConstraint, comparisonElementTypeConstraint);
    }

    return false;
  }
}
