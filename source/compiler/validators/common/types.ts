import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

export interface IValidationHelper {
  symbolDictionary: SymbolDictionary;
  findTypeDefinition: (namespaceChain: string[]) => TypeDefinition;
}
