import { Callback } from '../../system/types';
import { TokenMatch, TokenMatcher } from './parser-types';

/**
 * @todo @description
 * @internal
 */
function sortStringsBeforeArraysBeforeRegexes ([ tokenMatchA ]: TokenMatcher, [ tokenMatchB ]: TokenMatcher) {
  return typeof tokenMatchA === 'string'
    ? -1
    : Array.isArray(tokenMatchA) && typeof tokenMatchB !== 'string'
      ? -1
      : 1;
}

/**
 * @todo @description
 * @internal
 */
function createTokenMatcherManagerDecorator (tokenMatcherKey: string): Callback<TokenMatch, MethodDecorator> {
  return (tokenMatch: TokenMatch) => {
    return (target: any, methodName, propertyDescriptor: PropertyDescriptor) => {
      const { constructor } = target;

      if (!constructor[tokenMatcherKey]) {
        constructor[tokenMatcherKey] = [];
      }

      const tokenMatchers: TokenMatcher[] = constructor[tokenMatcherKey];

      tokenMatchers.push([ tokenMatch, propertyDescriptor.value ]);
      tokenMatchers.sort(sortStringsBeforeArraysBeforeRegexes);
    };
  };
}

/**
 * Marks a decorated method to be called if a token matching the
 * string, regex, or array of strings/regexes is encountered.
 */
export const Match = createTokenMatcherManagerDecorator('matches');

/**
 * Marks a decorated method to be called if a token matching the
 * string, regex, or array of strings/regexes exists further on
 * the current line.
 */
export const Lookahead = createTokenMatcherManagerDecorator('lookaheads');

/**
 * Marks a decorated method to be called if a token matching the
 * string, regex, or array of strings/regexes does not exist
 * further on the current line.
 */
export const NegativeLookahead = createTokenMatcherManagerDecorator('negativeLookaheads');
