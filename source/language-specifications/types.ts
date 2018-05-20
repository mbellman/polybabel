import AbstractParser from '../parser/common/AbstractParser';
import AbstractTranslator from '../compiler/common/AbstractTranslator';
import AbstractTypeResolver from '../compiler/common/AbstractTypeResolver';
import AbstractValidator from '../compiler/common/AbstractValidator';
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
  TypeResolver: IConstructable<AbstractTypeResolver>;
  Validator: IConstructable<AbstractValidator>;
  Translator: IConstructable<AbstractTranslator>;
}
