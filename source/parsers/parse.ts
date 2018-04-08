import AbstractParsingStrategy from './common/AbstractParsingStrategy';
import JavaParsingStrategy from './java/JavaParsingStrategy';
import { IJavaSyntaxTree } from './java/syntax';
import { ISyntaxTree } from './common/syntax';
import { IToken } from '../tokenizer/types';
import { Language } from '../constants';

/**
 * Parses a stream of tokens using a parsing strategy determined
 * by {language}.
 */
export default function parse (tokens: IToken[], language: Language): ISyntaxTree {
  let parsingStrategy: AbstractParsingStrategy;

  switch (language) {
    case Language.JAVA:
      parsingStrategy = new JavaParsingStrategy();
  }

  return parsingStrategy.parse(tokens);
}
