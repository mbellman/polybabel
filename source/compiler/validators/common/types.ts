import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IParserError } from '../../../parser/common/parser-types';
import { IToken } from '../../../tokenizer/types';
import { TypeDefinition } from '../../symbol-resolvers/common/types';
import ObjectVisitor from './ObjectVisitor';

/**
 * @todo @description
 */
export interface IValidatorHelper {
  readonly objectVisitor: ObjectVisitor;
  readonly symbolDictionary: SymbolDictionary;
  findTypeDefinition (namespaceChain: string[]): TypeDefinition;
  focusToken (token: IToken): void;
  report (message: string): void;
}

/**
 * @todo @description
 */
export interface IValidatorError extends IParserError { }

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
