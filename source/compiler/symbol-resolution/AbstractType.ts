import SymbolDictionary from './SymbolDictionary';

export default abstract class AbstractType {
  protected symbolDictionary: SymbolDictionary;

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  /**
   * Returns a new AbstractType representing a copy of this
   * one, constrained to a specific type or types as denoted
   * by the type's generic parameters.
   */
  public abstract constrain (genericParameterTypes: AbstractType[]): AbstractType;
}
