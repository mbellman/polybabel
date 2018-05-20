import JavaParser from '../parser/java/JavaParser';
import JavaTranslator from '../compiler/translators/java/JavaTranslator';
import JavaTypeResolver from '../compiler/type-resolvers/JavaTypeResolver';
import JavaValidator from '../compiler/validators/JavaValidator';
import { ILanguageSpecification } from './types';

export const JavaSpecification: ILanguageSpecification = {
  Parser: JavaParser,
  TypeResolver: JavaTypeResolver,
  Validator: JavaValidator,
  Translator: JavaTranslator
};
