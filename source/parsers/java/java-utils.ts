import { JavaConstants } from './java-constants';

export function isAccessModifierKeyword (word: string): boolean {
  return JavaConstants.AccessModifiers.indexOf(word) > -1;
}

export function isModifierKeyword (word: string): boolean {
  return JavaConstants.Modifiers.indexOf(word) > -1;
}

export function isReservedWord (word: string): boolean {
  return JavaConstants.ReservedWords.indexOf(word) > -1;
}

export function isClauseKeyword (word: string): boolean {
  return JavaConstants.Clauses.indexOf(word) > -1;
}
