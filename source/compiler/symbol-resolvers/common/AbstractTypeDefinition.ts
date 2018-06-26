import SymbolDictionary from './SymbolDictionary';
import { ITypeConstraint } from './types';

export default abstract class AbstractTypeDefinition {
  protected symbolDictionary: SymbolDictionary;

  public constructor (symbolDictionary: SymbolDictionary) {
    this.symbolDictionary = symbolDictionary;
  }

  protected ensureConstraintHasDefinition (typeConstraint: ITypeConstraint): void {
    const { typeDefinition } = typeConstraint;

    if (typeDefinition instanceof Array) {
      typeConstraint.typeDefinition = this.symbolDictionary.getFirstDefinedSymbol(typeDefinition).constraint.typeDefinition;
    }
  }
}
