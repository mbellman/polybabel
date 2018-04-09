import AbstractParser from './common/AbstractParser';
import JavaParser from './java/JavaParser';
import { ISyntaxTree } from './common/syntax';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';

/**
 * Parses a stream of {tokens} into a syntax tree using a parser
 * class determined by {language}. A {file} is provided to aid
 * with error messaging.
 */
export default function parse (file: string, tokens: IToken[], language: Language): ISyntaxTree {
  switch (language) {
    case Language.JAVA:
      return new JavaParser(file).parse(tokens);
  }
}
