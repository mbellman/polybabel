import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IToken } from '../../../tokenizer/types';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

/**
 * @todo @description
 */
export interface IValidationHelper {
  readonly symbolDictionary: SymbolDictionary;
  readonly findTypeDefinition: (namespaceChain: string[]) => TypeDefinition;
}

/**
 * @todo @description
 */
export interface IValidationError {
  message: string;
  token?: IToken;
}

/**
 * An object containing an expected type definition queued up
 * for validation at some future point, and a short 'expectation'
 * message explaining the nature of the type.
 *
 * @see ValidatorContext.expectType()
 */
export interface IExpectedType {
  type: TypeDefinition;
  expectation: string;
}
