import AbstractParser from './AbstractParser';
import { Callback, Constructor } from '../../system/types';
import { TokenMatcher } from './parser-types';

/**
 * @todo @description
 */
interface IParserConfiguration<P extends AbstractParser> {
  type?: Constructor<P>;
  words?: TokenMatcher<P>[];
  symbols?: TokenMatcher<P>[];
  numbers?: TokenMatcher<P>[];
}

/**
 * @todo @description
 */
export function Parser <P extends AbstractParser>(parserConfiguration: IParserConfiguration<P>): Callback<Constructor<P>> {
  const {
    words = [],
    symbols = [],
    numbers = []
  } = parserConfiguration;

  return (target: Constructor<P>) => {
    (target as any).words = words;
    (target as any).symbols = symbols;
    (target as any).numbers = numbers;
  };
}
