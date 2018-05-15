import JavaParser from '../parser/java/JavaParser';
import JavaTranslator from '../compiler/translators/java/JavaTranslator';
import JavaTypeReconciler from '../compiler/type-reconcilers/JavaTypeReconciler';
import JavaValidator from '../compiler/validators/JavaValidator';
import { ILanguageSpecification } from './types';

export const JavaSpecification: ILanguageSpecification = {
  Parser: JavaParser,
  TypeReconciler: JavaTypeReconciler,
  Validator: JavaValidator,
  Translator: JavaTranslator
};
