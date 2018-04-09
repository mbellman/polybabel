import { IHashMap } from '../../system/types';

export namespace JavaConstants {
  export const enum ParsingBody {
    FILE,
    CLASS,
    METHOD,
    INTERFACE
  }

  export const enum Keyword {
    PACKAGE = 'package',
    IMPORT = 'import',
    CLASS = 'class',
    INTERFACE = 'interface',
    PUBLIC = 'public',
    PROTECTED = 'protected',
    PRIVATE = 'private',
    STATIC = 'static'
  }

  export const AccessModifierKeywords: string[] = [
    Keyword.PUBLIC,
    Keyword.PROTECTED,
    Keyword.PRIVATE,
    Keyword.PACKAGE
  ];
}
