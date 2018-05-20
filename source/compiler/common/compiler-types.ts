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
   * reconcilable to all languages.
   */
  export enum ObjectMemberVisibility {
    ALL = 'ALL',
    SUPERS = 'SUPERS',
    SELF = 'SELF'
  }

  /**
   * A dynamic type constant.
   */
  export type Dynamic = 'DYNAMIC TYPE';

  /**
   * Constants for primitive types common to all languages.
   */
  export enum Primitive {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    REGEX = 'REGEX'
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
  }

  /**
   * A dynamic type definition.
   */
  export interface IDynamicType {
    category: TypeCategory.DYNAMIC;
  }

  /**
   * A primitive type definition.
   */
  export interface IPrimitiveType {
    category: TypeCategory.PRIMITIVE;
    type: Primitive;
  }

  export interface IArrayType {
    category: TypeCategory.ARRAY;
    type: IType;
  }

  /**
   * An object member type definition.
   */
  export interface IObjectMember {
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
  export interface IObjectType {
    category: TypeCategory.OBJECT;
    name: string;
    genericParameters?: string[];
    isExtensible: boolean;
    isConstructable: boolean;
    constructors: IFunctionType[];
    instanceMemberMap: IMemberTypeMap;
    staticMemberMap: IMemberTypeMap;
  }

  /**
   * Any type resolved from a particular file.
   */
  export type ResolvedType = IDynamicType | IPrimitiveType | IArrayType | IFunctionType | IObjectType;
}
