import AbstractParser from '../parser/common/AbstractParser';
import AbstractTranslator from '../compiler/common/AbstractTranslator';
import AbstractTypeReconciler from '../compiler/common/AbstractTypeReconciler';
import AbstractValidator from '../compiler/common/AbstractValidator';
import JavaParser from '../parser/java/JavaParser';
import JavaTranslator from '../compiler/translators/java/JavaTranslator';
import JavaTypeReconciler from '../compiler/type-reconcilers/JavaTypeReconciler';
import JavaValidator from '../compiler/validators/JavaValidator';
import sanitizeJava from '../sanitizer/sanitizeJava';
import { Callback } from '../system/types';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { Language } from '../system/constants';

/**
 * An object providing all of the top-level classes for
 * parsing and compiling code from a given language.
 *
 * @internal
 */
interface ILanguageSpecification {
  sanitizer: Callback<string, string>;
  Parser: IConstructable<AbstractParser<ISyntaxTree>>;
  TypeReconciler: IConstructable<AbstractTypeReconciler>;
  Validator: IConstructable<AbstractValidator>;
  Translator: IConstructable<AbstractTranslator>;
}

export const LanguageSpecificationMap: IHashMap<ILanguageSpecification> = {
  [Language.JAVA]: {
    sanitizer: sanitizeJava,
    Parser: JavaParser,
    TypeReconciler: JavaTypeReconciler,
    Validator: JavaValidator,
    Translator: JavaTranslator
  }
};
