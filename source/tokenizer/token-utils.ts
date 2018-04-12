import { Callback } from '../system/types';
import { IToken, TokenType } from './types';

/**
 * @internal
 */
type TokenStepFunction = Callback<IToken, IToken>;

/**
 * @internal
 */
type TokenPredicate = Callback<IToken, boolean>;

export const getLastToken: TokenStepFunction = ({ lastToken }) => lastToken;

export const getNextToken: TokenStepFunction = ({ nextToken }) => nextToken;

export const isCharacterToken: TokenPredicate = ({ type }) => type !== TokenType.NEWLINE;
