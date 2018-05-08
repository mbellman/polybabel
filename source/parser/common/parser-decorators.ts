import { Callback } from '../../system/types';
import { TokenMatch, TokenMatcher, TokenMatcherType, IDecoratedTokenMatcher } from './parser-types';

/**
 * A decorated token matchers sorting comparator which sorts by
 * token matcher weights, using the following order scheme:
 *
 *  1) string TokenMatchers
 *  2) string/regex array TokenMatchers
 *  3) token predicate function TokenMatchers
 *  4) regex TokenMatchers
 *
 * This allows token matchers with more specific values to be
 * given priority over those with more generalized matching
 * conditions.
 *
 * @internal
 */
function sortDecoratedTokenMatchers (decoratedTokenMatcherA: IDecoratedTokenMatcher, decoratedTokenMatcherB: IDecoratedTokenMatcher) {
  const [ tokenMatchA ] = decoratedTokenMatcherA.tokenMatcher;
  const [ tokenMatchB ] = decoratedTokenMatcherB.tokenMatcher;

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
 * Creates a decorator which can apply token matchers to a parser
 * class, stored on a static token matcher key, and using a specific
 * token matcher type. An optional third boolean argument, false by
 * default, determines whether the token matchers list should be
 * sorted after each new token matcher is added.
 */
function createTokenMatcherDecorator (tokenMatcherKey: string, tokenMatcherType: TokenMatcherType, shouldSort: boolean = false): Callback<TokenMatch, MethodDecorator> {
  return (tokenMatch: TokenMatch): MethodDecorator => {
    return (target: any, methodName: string) => {
      const { constructor } = target;

      if (!constructor[tokenMatcherKey]) {
        constructor[tokenMatcherKey] = [];
      }

      const decoratedTokenMatchers: IDecoratedTokenMatcher[] = target.constructor[tokenMatcherKey];

      decoratedTokenMatchers.push({
        tokenMatcher: [ tokenMatch, methodName ],
        type: tokenMatcherType
      });

      if (shouldSort) {
        decoratedTokenMatchers.sort(sortDecoratedTokenMatchers);
      }
    };
  };
}

/**
 * Marks a decorated method to be called if a token satisfying the
 * provided token match is encountered next in the parsing stream,
 * halting the parser otherwise. Applying @Eat() decorators in a
 * desired order defines an expected sequence of token matches
 * starting from the parser's initial token (or that reached after
 * onFirstToken()), and how to handle each step in the sequence.
 */
export const Eat = createTokenMatcherDecorator('starterMatchers', TokenMatcherType.EAT);

/**
 * A variant of @Eat() which allows, but does not require, the
 * next token in the parsing stream to satisfy the provided token
 * match. If it does match, the decorated method is called; if
 * it does not, the next in the list of starters is checked until
 * none remain.
 */
export const Allow = createTokenMatcherDecorator('starterMatchers', TokenMatcherType.ALLOW);

/**
 * Marks a decorated method to be called if a token satisfying
 * the token match is encountered after all @Eat() and @Allow()
 * token matches are passed. Order-independent. The collection
 * of token matchers generated by all @Match() decorators is
 * analagous to cases in a switch statement handling each new
 * token in the parsing stream, where the default case - that
 * of no matches - causes the parser to halt.
 */
export const Match = createTokenMatcherDecorator('streamMatchers', TokenMatcherType.MATCH, true);

/**
 * Marks a decorated parser class as restricted to parsing one
 * line at a time, halting if any newline tokens are passed.
 */
export function SingleLineParser (target: any): void {
  target.isSingleLineParser = true;
}
