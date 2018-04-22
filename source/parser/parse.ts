import JavaParser from './java/JavaParser';
import { ISyntaxTree } from './common/syntax-types';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';
import { IHashMap, Constructor } from 'trampoline-framework';
import AbstractParser from './common/AbstractParser';
import { IConstructable } from 'system/types';

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
