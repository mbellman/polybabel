import AbstractType from './AbstractType';
import ObjectType from './ObjectType';
import SymbolDictionary from './SymbolDictionary';
import { Callback } from '../../system/types';
import { IHashMap } from 'trampoline-framework';

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
 * Constants defining the object 'side' a member exists on.
 */
export enum ObjectMemberSide {
  STATIC = 'STATIC',
  INSTANCE = 'INSTANCE'
}

/**
 * A constant representing a dynamic type.
 */
export type Dynamic = 'DYNAMIC';

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
 * An object member definition.
 */
export interface IObjectMember<T extends TypeDefinition = TypeDefinition> {
  visibility: ObjectMemberVisibility;
  side: ObjectMemberSide;
  isConstant: boolean;
  type: T | SymbolIdentifier;
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
export type TypeDefinition = Dynamic | Primitive | AbstractType;

/**
 * A symbol resolved from a syntax node, providing information
 * about its identifier and type structure (or an identifier
 * for an object-type symbol pending resolution).
 */
export interface ISymbol<T extends TypeDefinition = TypeDefinition> {
  identifier: SymbolIdentifier;
  type: T;
}
