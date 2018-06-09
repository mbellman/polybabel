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
 * Constants representing the category of object an object
 * type definition corresponds to.
 *
 * While type definitions are designed to be as agnostic as
 * possible to language-specific constructs, some object type
 * validations simply wouldn't be possible without information
 * regarding object categories. Languages with classes and
 * interfaces may have particular rules about which categories
 * of objects can be extended or implemented, languages with
 * traits or mixins might impose similar restrictions, and so
 * on. This list represents the set of all object variants
 * which need to be differentiated for validation.
 */
export enum ObjectCategory {
  CLASS = 'CLASS',
  INTERFACE = 'INTERFACE',
  TRAIT = 'TRAIT'
}

/**
 * An object member definition.
 */
export interface IObjectMember<T extends TypeDefinition = TypeDefinition> {
  visibility: ObjectMemberVisibility;
  type: T;
  isConstant?: boolean;
  isStatic?: boolean;
  requiresImplementation?: boolean;
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
  OBJECT = 'OBJECT',
  NULL = 'NULL'
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
 * A type definition object. Alternatively, type definitions
 * can be tentative symbol identifier lists which represent
 * potential symbol names to look up and resolve the actual
 * type definition for retroactively. The first identifier
 * in the list with a symbol definition determines the type
 * definition ultimately resolved.
 */
export type TypeDefinition = ISimpleType | AbstractTypeDefinition | SymbolIdentifier[];

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
 * about its original name and its type definition (or a symbol
 * identifier for a symbol pending resolution).
 */
export interface ISymbol<T extends TypeDefinition = TypeDefinition> {
  identifier: SymbolIdentifier;
  name: string;
  type: T;
}
