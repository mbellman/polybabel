import JavaParser from '../parser/java/JavaParser';
import JavaSymbolResolver from '../compiler/symbol-resolvers/JavaSymbolResolver';
import JavaTranslator from '../compiler/translators/java/JavaTranslator';
import JavaValidator from '../compiler/validators/java/JavaValidator';
import { ILanguageSpecification } from './types';
import { JavaTypeConstraintMap } from '../compiler/native-type-constraints/java';

export const JavaSpecification: ILanguageSpecification = {
  Parser: JavaParser,
  SymbolResolver: JavaSymbolResolver,
  Validator: JavaValidator,
  Translator: JavaTranslator,
  TypeConstraintMap: JavaTypeConstraintMap
};
