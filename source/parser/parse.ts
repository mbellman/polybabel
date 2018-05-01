import AbstractParser from './common/AbstractParser';
import JavaParser from './java/JavaParser';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from './common/syntax-types';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';
import { TokenUtils } from '../tokenizer/token-utils';

/**
 * Parses a list of {tokens} into a syntax tree using a parser
 * class determined by {language}.
 *
 * Both the omission of an explicit return type and the use of
 * a switch statement over a simpler language-to-parser map are
 * deliberate; this allows the returned syntax tree type to be
 * properly inferred from language constant alone via static
 * analysis of the method.
 */
export default function parse (firstToken: IToken, language: Language) {
  if (TokenUtils.isEOF(firstToken)) {
    return null;
  }

  switch (language) {
    case Language.JAVA:
      return new JavaParser().parse(firstToken);
  }

  return null;
}
