import { IToken, TokenType } from '../../tokenizer/types';
import { TokenMatch, TokenPredicate } from './parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

export namespace ParserUtils {
  export function tokenMatches (token: IToken, tokenMatch: TokenMatch): boolean {
    const { value } = token;

    return (
      // Literal token match
      value === tokenMatch ||
      // Token is matched by a value within an array of token matches
      (Array.isArray(tokenMatch) && tokenMatch.some(match => tokenMatches(token, match))) ||
      // Token satisfies a token predicate function
      typeof tokenMatch === 'function' && tokenMatch(token) ||
      // Token value matches a regex pattern
      tokenMatch instanceof RegExp && tokenMatch.test(value)
    );
  }
}
