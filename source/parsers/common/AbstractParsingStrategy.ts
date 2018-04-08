import { ISyntaxTree } from './syntax';
import { IToken } from '../../tokenizer/types';

export default abstract class AbstractParsingStrategy<S extends ISyntaxTree = ISyntaxTree> {
  public abstract parse (tokens: IToken[]): S;
}
