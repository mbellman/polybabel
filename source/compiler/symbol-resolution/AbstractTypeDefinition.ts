import SymbolDictionary from './SymbolDictionary';
import { TypeDefinition } from './types';

export default abstract class AbstractTypeDefinition {
  protected symbolDictionary: SymbolDictionary;

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }
}
