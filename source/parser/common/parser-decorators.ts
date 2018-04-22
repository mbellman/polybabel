import { Callback } from '../../system/types';
import { TokenMatch, TokenMatcher } from './parser-types';

/**
 * A token matchers sorting comparator which sorts TokenMatchers
 * using the following order scheme:
 *
 *  1) string TokenMatchers
 *  2) string/regex array TokenMatchers
 *  3) token predicate function TokenMatchers
 *  4) regex TokenMatchers
 *
 * @internal
 */
function sortTokenMatchers ([ tokenMatchA ]: TokenMatcher, [ tokenMatchB ]: TokenMatcher) {
  return (
    typeof tokenMatchA === 'string'
      ? -1 :
    (Array.isArray(tokenMatchA) && typeof tokenMatchB !== 'string')
      ? -1 :
    (typeof tokenMatchA === 'function' && tokenMatchB instanceof RegExp)
      ? -1 :
    1
  );
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
      tokenMatchers.sort(sortTokenMatchers);
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