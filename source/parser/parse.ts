import AbstractParser from './common/AbstractParser';
import JavaParser from './java/JavaParser';
import { IConstructable } from 'system/types';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from './common/syntax-types';
import { IToken } from '../tokenizer/types';
import { Language } from '../system/constants';
import { TokenUtils } from '../tokenizer/token-utils';

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
export default function parse (firstToken: IToken, language: Language): ISyntaxTree {
  if (TokenUtils.isEOF(firstToken)) {
    return null;
  }

  const Parser = ParserMap[language];

  if (Parser) {
    return new Parser().parse(firstToken);
  }

  return null;
}
