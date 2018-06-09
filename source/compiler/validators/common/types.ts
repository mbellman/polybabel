import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IToken } from '../../../tokenizer/types';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

/**
 * @todo @description
 */
export interface IValidationHelper {
  symbolDictionary: SymbolDictionary;
  findTypeDefinition: (namespaceChain: string[]) => TypeDefinition;
}

/**
 * @todo @description
 */
export interface IValidationError {
  message: string;
  token?: IToken;
}
