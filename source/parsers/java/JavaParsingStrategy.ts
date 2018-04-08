import AbstractParsingStrategy from '../common/AbstractParsingStrategy';
import { IJavaSyntaxTree } from './syntax';
import { IToken } from '../../tokenizer/types';

export default class JavaParsingStrategy extends AbstractParsingStrategy<IJavaSyntaxTree> {
  public parse (tokens: IToken[]): IJavaSyntaxTree {
    return {
      leftNode: null,
      rightNode: null
    };
  }
}
