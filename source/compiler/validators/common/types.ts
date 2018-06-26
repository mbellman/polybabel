import { IParserError } from '../../../parser/common/parser-types';
import { TypeDefinition, ITypeConstraint } from '../../symbol-resolvers/common/types';

/**
 * A function which determines whether a source type matches
 * a comparison type.
 *
 * @see type-validation.ts
 */
export type TypeMatcher = (sourceType: TypeDefinition, comparisonType: TypeDefinition) => void;

/**
 * An error raised during validation. Aliased from IParserError
 * for contextual purposes.
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
 * An object containing an expected type constraint queued up
 * for validation at some future point, and a TypeExpectation
 * constant describing the nature of the type constraint.
 *
 * @see AbstractValidator.expectTypeConstraint()
 */
export interface IExpectedTypeConstraint {
  constraint: ITypeConstraint;
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
