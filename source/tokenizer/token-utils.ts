import { Callback } from '../system/types';
import { IToken, TokenType } from './types';

export function getPreviousToken ({ previousToken }: IToken) {
  return previousToken;
}

export function getNextToken ({ nextToken }: IToken): IToken {
  return nextToken;
}

export function isCharacterToken ({ type }: IToken): boolean {
  return type !== TokenType.NEWLINE;
}

export function isStartOfLine ({ type, previousToken }: IToken) {
  return !previousToken || previousToken.type === TokenType.NEWLINE;
}
