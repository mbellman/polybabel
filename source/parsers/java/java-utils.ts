import { JavaConstants } from './java-constants';

export function isAccessModifierKeyword (keyword: string): boolean {
  return JavaConstants.AccessModifierKeywords.indexOf(keyword) > -1;
}
