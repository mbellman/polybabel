import AbstractParser from './common/AbstractParser';
import assert from '../system/assert';
import JavaParser from './java/JavaParser';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from './common/syntax-types';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';
import { LanguageSpecificationMap } from '../system/language-spec';
import { TokenUtils } from '../tokenizer/token-utils';

/**
 * Parses a list of {tokens} into a syntax tree using a parser
 * class determined by {language}.
 */
export default function parse (firstToken: IToken, language: Language): ISyntaxTree {
  if (TokenUtils.isEOF(firstToken)) {
    return null;
  }

  const languageSpecification = LanguageSpecificationMap[language];

  assert(
    !!languageSpecification,
    `The included ${language} language specification does not provide a parser`
  );

  const { Parser } = languageSpecification;

  return new Parser().parse(firstToken);
}
