import { Callback } from '../../system/types';
import { IHashMap } from 'trampoline-framework';

export namespace TypeResolution {
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
   * Constants determining the category of an IType object.
   */
  export enum TypeCategory {
    DYNAMIC = 'DYNAMIC',
    PRIMITIVE = 'PRIMITIVE',
    ARRAY = 'ARRAY',
    FUNCTION = 'FUNCTION',
    MEMBER = 'MEMBER',
    OBJECT = 'OBJECT'
  }

  /**
   * A base type definition.
   */
  export interface IType {
    category: TypeCategory;
    name: string;
  }

  /**
   * A dynamic type definition.
   */
  export interface IDynamicType extends IType {
    category: TypeCategory.DYNAMIC;
  }

  /**
   * A primitive type definition.
   */
  export interface IPrimitiveType extends IType {
    category: TypeCategory.PRIMITIVE;
    type: Primitive;
  }

  /**
   * An array type definition, also defining the type of the
   * elements it contains.
   */
  export interface IArrayType extends IType {
    category: TypeCategory.ARRAY;
    type: ResolvedType;
  }

  /**
   * An object member type definition.
   */
  export interface IObjectMember extends IType {
    category: TypeCategory.MEMBER;
    visibility: ObjectMemberVisibility;
    isConstant: boolean;
    type: ResolvedType;
  }

  /**
   * A function type definition.
   */
  export interface IFunctionType extends IType {
    category: TypeCategory.FUNCTION;
    genericParameters?: string[];
    parameterTypes: ResolvedType[];
    returnType: ResolvedType;
  }

  /**
   * An object type definition.
   */
  export interface IObjectType extends IType {
    category: TypeCategory.OBJECT;
    genericParameters?: string[];
    isExtensible: boolean;
    isConstructable: boolean;
    constructors: IObjectMember[];
    instanceMemberMap: IMemberTypeMap;
    staticMemberMap: IMemberTypeMap;
  }

  /**
   * Any type definition resolved from a particular file.
   */
  export type ResolvedType = IDynamicType | IPrimitiveType | IArrayType | IFunctionType | IObjectMember | IObjectType;

  /**
   * A map of type names to resolved types.
   */
  export type ResolvedTypeMap = IHashMap<ResolvedType>;

  /**
   * A function which receives a string corresponding to a
   * file name and returns the file's resolved type map.
   */
  export type ResolvedTypeMapLoader = Callback<string, ResolvedTypeMap>;
}
