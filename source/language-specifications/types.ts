import AbstractParser from '../parser/common/AbstractParser';
import AbstractSymbolResolver from '../compiler/symbol-resolution/AbstractSymbolResolver';
import AbstractTranslator from '../compiler/translators/common/AbstractTranslator';
import AbstractValidator from '../compiler/validators/common/AbstractValidator';
import { Callback } from '../system/types';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';

/**
 * An object providing all of the top-level classes and
 * utilities for compiling code from a given language.
 *
 * @internal
 */
export interface ILanguageSpecification {
  Parser: IConstructable<AbstractParser<ISyntaxTree>>;
  SymbolResolver: IConstructable<AbstractSymbolResolver>;
  Validator: IConstructable<AbstractValidator>;
  Translator: IConstructable<AbstractTranslator>;
}
