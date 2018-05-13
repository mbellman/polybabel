import { Language } from '../system/constants';
import { LanguageSpecificationMap } from '../system/language-spec';

/**
 * Sanitizes {code} using the sanitizer function provided
 * by a {language} specification. If no sanitizer exists,
 */
export default function sanitize (code: string, language: Language): string {
  const languageSpecification = LanguageSpecificationMap[language];
  let { sanitizer } = languageSpecification;

  if (!sanitizer) {
    sanitizer = input => input;
  }

  return sanitizer(code);
}
