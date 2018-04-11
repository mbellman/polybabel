import { JavaConstants } from './java-constants';

export function isAccessModifierKeyword (word: string): boolean {
  return JavaConstants.AccessModifierKeywords.indexOf(word) > -1;
}

export function isModifierKeyword (word: string): boolean {
  return JavaConstants.ModifierKeywords.indexOf(word) > -1;
}

export function isReservedWord (word: string): boolean {
  return JavaConstants.ReservedWords.indexOf(word) > -1;
}
