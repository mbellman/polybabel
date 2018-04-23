import AbstractParser from './common/AbstractParser';
import JavaParser from './java/JavaParser';
import { IConstructable } from 'system/types';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from './common/syntax-types';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';

/**
 * Maps language constants to their root parser classes.
 *
 * @internal
 */
const ParserMap: IHashMap<IConstructable<AbstractParser<ISyntaxTree>>> = {
  [Language.JAVA]: JavaParser
};

/**
 * Parses a list of {tokens} into a syntax tree using a parser
 * class determined by {language}.
 */
export default function parse (tokens: IToken[], language: Language): ISyntaxTree {
  const Parser = ParserMap[language];

  if (Parser) {
    return new Parser().parse(tokens[0]);
  }

  return null;
}
