import { ISyntaxTree } from './syntax';
import { IToken } from '../../tokenizer/types';

export function parse (
  tokens: IToken[]
): ISyntaxTree {
  return {
    leftNode: null,
    rightNode: null
  };
}
