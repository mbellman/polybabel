import { IHashMap } from 'trampoline-framework';
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
    SWITCH = 'switch',
    CASE = 'case',
    DEFAULT = 'default',
    RETURN = 'return',
    BREAK = 'break',
    CONTINUE = 'continue',
    THROW = 'throw',
    TRY = 'try',
    CATCH = 'catch',
    FINALLY = 'finally'
  }

  export enum Type {
    STRING = 'String',
    NUMBER = 'Number',
    INTEGER = 'Integer',
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

  export enum Operator {
    EQUAL = '=',
    PLUS = '+',
    MINUS = '-',
    STAR = '*',
    SLASH = '/',
    EXCLAMATION = '!',
    QUESTION = '?',
    COLON = ':',
    PERCENT = '%',
    LESS_THAN = '<',
    GREATER_THAN = '>',
    PIPE = '|',
    AND = '&',
    CARET = '^',
    TILDE = '~',
    INSTANCEOF = 'instanceof'
  }

  export const Keywords: string[] = Utils.objectToArray(Keyword);
  export const Types: string[] = Utils.objectToArray(Type);
  export const Operators: string[] = Utils.objectToArray(Operator);

  export const ReservedWords: string[] = [
    ...Keywords,
    ...Types
  ];

  export const Clauses: string[] = [
    JavaConstants.Keyword.EXTENDS,
    JavaConstants.Keyword.IMPLEMENTS,
    JavaConstants.Keyword.THROWS
  ];

  export const AccessModifiers: string[] = [
    Keyword.PUBLIC,
    Keyword.PROTECTED,
    Keyword.PRIVATE
  ];

  export const Modifiers: string[] = [
    Keyword.STATIC,
    Keyword.FINAL,
    Keyword.ABSTRACT
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
