import AbstractTypeDefinition from './AbstractTypeDefinition';
import { ObjectType } from './object-type';

/**
 * Generalizes object member access modifiers in a manner
 * reconcilable by all languages.
 */
export enum ObjectMemberVisibility {
  ALL = 2,
  DERIVED = 1,
  SELF = 0
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
export interface IObjectMember<T extends ITypeConstraint = ITypeConstraint> {
  name: string;
  visibility: ObjectMemberVisibility;
  constraint: T;
  parent?: ObjectType.Constraint;
  isConstant?: boolean;
  isStatic?: boolean;
  requiresImplementation?: boolean;
}

/**
 * An in-scope reference containing information about the
 * reference's type constraint and whether or not it can be
 * reassigned.
 */
export interface IScopedReference {
  constraint: ITypeConstraint;
  isConstant?: boolean;
}

/**
 * An expanded description of a symbol or identifier's type,
 * containing information about its actual type definition and
 * whether or not the symbol or identifier is the original
 * symbol which defined the type. For example, original type
 * constraints might correspond to the static side of a class,
 * or an original function type definition rather than a
 * function matching the type definition's constraint.
 */
export interface ITypeConstraint<T extends TypeDefinition = TypeDefinition> {
  typeDefinition: T;
  isOriginal?: boolean;
}

/**
 * A constant representing a dynamic type. Providing both
 * a type form and string form allows us to use the constant
 * as either a type or a value.
 */
export type Dynamic = 'dynamic';
export const Dynamic = 'dynamic';

/**
 * A constant representing a void type (i.e., one without an
 * actual type constraint). Providing both a type form and
 * string form allows us to use the constant as either a
 * type or a value.
 */
export type Void = 'void';
export const Void = 'void';

/**
 * Constants for primitive types common between languages.
 */
export enum Primitive {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  REGEX = 'regex',
  OBJECT = 'object literal',
  NULL = 'null'
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
  constraint: ITypeConstraint<T>;
}
