import { IHashMap } from '../../system/types';
import { JavaSyntax } from './java-syntax';
import { Utils } from '../../system/utils';

export namespace JavaConstants {
  export enum Keyword {
    PACKAGE = 'package',
    IMPORT = 'import',
    CLASS = 'class',
    INTERFACE = 'interface',
    EXTENDS = 'extends',
    IMPLEMENTS = 'implements',
    PUBLIC = 'public',
    PROTECTED = 'protected',
    PRIVATE = 'private',
    STATIC = 'static',
    FINAL = 'final',
    ABSTRACT = 'abstract',
    NEW = 'new'
  }

  export const Keywords: string[] = Utils.objectToArray(Keyword);

  export const ModifierKeywords: string[] = [
    Keyword.STATIC,
    Keyword.FINAL,
    Keyword.ABSTRACT
  ];

  export enum Type {
    STRING = 'String',
    OBJECT = 'Object',
    BYTE = 'byte',
    SHORT = 'short',
    INT = 'int',
    LONG = 'long',
    FLOAT = 'float',
    DOUBLE = 'double',
    BOOLEAN = 'boolean',
    CHAR = 'char'
  }

  export const TypeKeywords: string[] = Utils.objectToArray(Type);

  export const ReservedWords: string[] = [
    ...Keywords,
    ...TypeKeywords
  ];

  export const AccessModifierKeywords: string[] = [
    Keyword.PUBLIC,
    Keyword.PROTECTED,
    Keyword.PRIVATE
  ];

  export const AccessModifierMap: IHashMap<JavaSyntax.JavaAccessModifier> = {
    [Keyword.PUBLIC]: JavaSyntax.JavaAccessModifier.PUBLIC,
    [Keyword.PROTECTED]: JavaSyntax.JavaAccessModifier.PROTECTED,
    [Keyword.PRIVATE]: JavaSyntax.JavaAccessModifier.PRIVATE
  };
}
