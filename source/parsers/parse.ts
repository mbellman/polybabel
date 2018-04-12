import JavaParser from './java/JavaParser';
import { ISyntaxTree } from './common/syntax';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';

/**
 * Parses a list of {tokens} into a syntax tree using a parser
 * class determined by {language}.
 */
export default function parse (tokens: IToken[], language: Language): ISyntaxTree {
  switch (language) {
    case Language.JAVA:
      return new JavaParser().parse(tokens[0]);
  }
}
