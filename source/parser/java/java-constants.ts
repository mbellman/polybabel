import { IHashMap } from '../../system/types';
import { JavaSyntax } from './java-syntax';
import { Utils } from '../../system/utils';

export namespace JavaConstants {
  export enum Keyword {
    PACKAGE = 'package',
    IMPORT = 'import',
    CLASS = 'class',
    INTERFACE = 'interface',
    ENUM = 'enum',
    EXTENDS = 'extends',
    IMPLEMENTS = 'implements',
    THROWS = 'throws',
    PUBLIC = 'public',
    PROTECTED = 'protected',
    PRIVATE = 'private',
    STATIC = 'static',
    FINAL = 'final',
    ABSTRACT = 'abstract',
    NEW = 'new',
    TRUE = 'true',
    FALSE = 'false',
    NULL = 'null',
    IF = 'if',
    ELSE = 'else',
    WHILE = 'while',
    FOR = 'for',
    TRY = 'try',
    CATCH = 'catch',
    FINALLY = 'finally'
  }

  export enum Type {
    STRING = 'String',
    NUMBER = 'Number',
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

  export const Keywords: string[] = Utils.objectToArray(Keyword);
  export const Types: string[] = Utils.objectToArray(Type);

  export const ReservedWords: string[] = [
    ...Keywords,
    ...Types
  ];

  export const Clauses: string[] = [
    JavaConstants.Keyword.EXTENDS,
    JavaConstants.Keyword.IMPLEMENTS,
    JavaConstants.Keyword.THROWS
  ];

  export const Modifiers: string[] = [
    Keyword.STATIC,
    Keyword.FINAL,
    Keyword.ABSTRACT
  ];

  export const AccessModifiers: string[] = [
    Keyword.PUBLIC,
    Keyword.PROTECTED,
    Keyword.PRIVATE
  ];

  export const AccessModifierMap: IHashMap<JavaSyntax.JavaAccessModifier> = {
    [Keyword.PUBLIC]: JavaSyntax.JavaAccessModifier.PUBLIC,
    [Keyword.PROTECTED]: JavaSyntax.JavaAccessModifier.PROTECTED,
    [Keyword.PRIVATE]: JavaSyntax.JavaAccessModifier.PRIVATE
  };

  export const ModifiableKeyMap: IHashMap<keyof JavaSyntax.IJavaModifiable> = {
    [JavaConstants.Keyword.ABSTRACT]: 'isAbstract',
    [JavaConstants.Keyword.FINAL]: 'isFinal',
    [JavaConstants.Keyword.STATIC]: 'isStatic'
  };
}
