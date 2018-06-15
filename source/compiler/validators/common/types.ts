import ObjectVisitor from './ObjectVisitor';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { IParserError } from '../../../parser/common/parser-types';
import { IToken } from '../../../tokenizer/types';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

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
 * Constants describing the nature of expected types, used to
 * provide helpful error messaging when expected types are
 * not matched.
 *
 * Type expectations can also be used to invalidate certain
 * statements/expressions altogether. For example, assignment
 * and operand type expectations constrain the set of valid
 * statements/expressions to those which a language allows
 * to be assigned or operated on.
 *
 *  1. 'Any' type expectations
 *  2. Return type expectations enforce return statement/expression types
 *  3. Assignment type expectations enforce the type of an assigned statement/expression value
 *  4. Operand type expectations enforce the type of operand statements/expressions
 */
export const enum TypeExpectation {
  ANY = 'any type',
  RETURN = 'return type',
  ASSIGNMENT = 'assignment type',
  OPERAND = 'operand type'
}

/**
 * An object containing an expected type definition queued up
 * for validation at some future point, and a TypeExpectation
 * constant describing the nature of the type.
 *
 * @see ValidatorContext.expectType()
 */
export interface IExpectedType {
  type: TypeDefinition;
  expectation: TypeExpectation;
}
