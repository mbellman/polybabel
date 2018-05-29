import AbstractTypeDefinition from './AbstractTypeDefinition';

/**
 * A map of object member names to their type definitions.
 *
 * @internal
 */
interface IMemberTypeMap {
  [memberName: string]: IObjectMember;
}

/**
 * Generalizes object member access modifiers in a manner
 * reconcilable by all languages.
 */
export enum ObjectMemberVisibility {
  ALL = 'ALL',
  DERIVED = 'DERIVED',
  SELF = 'SELF'
}

/**
 * An object member definition.
 */
export interface IObjectMember<T extends TypeDefinition = TypeDefinition> {
  visibility: ObjectMemberVisibility;
  isStatic: boolean;
  isConstant: boolean;
  type: T;
}

/**
 * A constant representing a dynamic type. Providing both
 * a type form and string form allows us to use the constant
 * as either a type or a value.
 */
export type Dynamic = 'DYNAMIC';
export const Dynamic = 'DYNAMIC';

/**
 * A constant representing a void type (i.e., one without an
 * actual type signature). Providing both a type form and
 * string form allows us to use the constant as either a
 * type or a value.
 */
export type Void = 'VOID';
export const Void = 'VOID';

/**
 * Constants for primitive types common to all languages.
 */
export enum Primitive {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  REGEX = 'REGEX',
  OBJECT = 'OBJECT'
}

/**
 * A non-complex type definition for either a primitive type,
 * a dynamic type, or a void type.
 */
export interface ISimpleType {
  type: Primitive | Dynamic | Void;
}

/**
 * A type alias for a symbol's string identifier. Since a symbol
 * may, during resolution, contain types on its own type shape
 * corresponding to yet-unresolved symbols, we can provide a
 * symbol identifier, instead of a type, to use to look up the
 * symbol's corresponding type definition at validation time.
 */
export type SymbolIdentifier = string;

/**
 * A construct representing a type definition.
 */
export type TypeDefinition = SymbolIdentifier | ISimpleType | AbstractTypeDefinition;

/**
 * An AbstractTypeDefinition which can be constrained by one or
 * more generic type parameters.
 */
export interface IConstrainable {
  /**
   * Returns a new AbstractTypeDefinition representing a copy
   * of the constrainable, constrained to a specific type or
   * types as denoted by the type's generic parameters.
   */
  constrain (genericTypes: TypeDefinition[]): AbstractTypeDefinition;
}

/**
 * A symbol resolved from a syntax node, providing information
 * about its identifier and type structure (or an identifier
 * for an object-type symbol pending resolution).
 */
export interface ISymbol<T extends TypeDefinition = TypeDefinition> {
  identifier: SymbolIdentifier;
  type: T;
}
