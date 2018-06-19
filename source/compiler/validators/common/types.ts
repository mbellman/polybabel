import { IParserError } from '../../../parser/common/parser-types';
import { TypeDefinition } from '../../symbol-resolvers/common/types';

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
 */
export const enum TypeExpectation {
  RETURN = 'return type',
  ASSIGNMENT = 'assignment type',
  OPERAND = 'operand type',
  ARGUMENT = 'argument type'
}

/**
 * An object containing an expected type definition queued up
 * for validation at some future point, and a TypeExpectation
 * constant describing the nature of the type.
 *
 * @see AbstractValidator.expectType()
 */
export interface IExpectedType {
  type: TypeDefinition;
  expectation: TypeExpectation;
}

/**
 * @todo @description
 *
 * @internal
 */
export interface IValidatorContextFlags {
  shouldAllowAnyType: boolean;
  shouldAllowReturn: boolean;
  shouldAllowReturnValue: boolean;
  mustReturnValue: boolean;
  didReturnInCurrentBlock: boolean;
  didReportUnreachableCode: boolean;
  shouldAllowInstanceKeywords: boolean;
}
