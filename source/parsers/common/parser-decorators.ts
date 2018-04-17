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
function createTokenMatchManagerDecorator (matcherKey: string): Callback<TokenMatch, MethodDecorator> {
  return (tokenMatch: TokenMatch) => {
    return (target: any, methodName, propertyDescriptor: PropertyDescriptor) => {
      const { constructor } = target;

      if (!constructor[matcherKey]) {
        constructor[matcherKey] = [];
      }

      const tokenMatchers: TokenMatcher[] = constructor[matcherKey];

      tokenMatchers.push([tokenMatch, propertyDescriptor.value]);
      tokenMatchers.sort(sortStringsBeforeArraysBeforeRegexes);
    };
  };
}

/**
 * Marks a decorated method to be called if a token matching the
 * string, regex, or array of strings/regexes is encountered.
 */
export const Match = createTokenMatchManagerDecorator('matches');

/**
 * Marks a decorated method to be called if a token matching the
 * string, regex, or array of strings/regexes exists further on
 * the current line.
 */
export const Lookahead = createTokenMatchManagerDecorator('lookaheads');

/**
 * Marks a decorated method to be called if a token matching the
 * string, regex, or array of strings/regexes does not exist
 * further on the current line.
 */
export const NegativeLookahead = createTokenMatchManagerDecorator('negativeLookaheads');
