import { IToken } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { ParserUtils } from '../common/parser-utils';
import { TokenPredicate, TokenMatch } from '../common/parser-types';
import { TokenUtils } from '../../tokenizer/token-utils';

export namespace JavaUtils {
  /**
   * An array of token matches disqualifying a token from being
   * contained within a generic block. Used by isGenericBlock()
   * to rule out generic type declarations in situations where
   * less-than comparisons are valid alternatives.
   *
   * @internal
   */
  const InvalidGenericTokens: TokenMatch = [
    /[^?>,\w]/,
    TokenUtils.isNumber,
    TokenUtils.isEOF
  ];

  /**
   * Determines whether a token corresponds to the beginning of a
   * generic block. Walks through the token sequence following the
   * provided token until either a token indicating or not indicating
   * a generic block 'signature' is encountered, or the end of the
   * token stream is reached.
   *
   * During statement parsing, consideration must be made for whether
   * a < symbol indicates a generic type or a less-than comparison,
   * since the two can potentially share the same form:
   *
   * ```
   *  List<String>
   *  x<y
   * ```
   *
   * In trivial cases a closing > or the presence of certain tokens
   * before a closing > can quickly qualify or rule out generic blocks,
   * but for namespaced types or comparisons between property chains
   * a higher number of lookaheads may be required:
   *
   * ```
   *  while (GenericType<Namespaced.Utils.Thing, Vendor.Tools.Type[]> value = getValue()) { ... }
   *
   *  int a;
   *  while (a<this.properties.chain.value) { ... }
   * ```
   *
   * The computational expense of performing lookaheads to distinguish
   * statements like these will in most cases be mitigated by their
   * rarity; many generic blocks end after only a few tokens and many
   * less-than comparisons introduce tokens invalid in a generic on
   * their right side within a similarly reasonable range.
   *
   * @internal
   */
  function isGenericBlock (token: IToken): boolean {
    while ((token = token.nextToken) && !TokenUtils.isEOF(token)) {
      if (ParserUtils.tokenMatches(token, '>')) {
        return true;
      } else if (ParserUtils.tokenMatches(token, InvalidGenericTokens)) {
        return false;
      }
    }

    return false;
  }

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

  /**
   * Determines whether a token corresponds to an isolated
   * value reference. Uses a potentially large number of
   * lookaheads to distinguish references on the left side
   * of less-than comparisons from generic types, though
   * these cases should be rare (see isGenericBlock()),
   * and can be mitigated entirely as long as less-than
   * comparisons include whitespace in between the reference
   * and the < operator.
   *
   * @example
   *
   *  name
   */
  export function isReference (token: IToken): boolean {
    const isWord = TokenUtils.isWord(token);

    if (!isWord) {
      // Optimize for non-words; return false immediately
      return false;
    }

    const { INSTANCEOF } = JavaConstants.Operator;

    // Flanked tokens are those which have tokens on both
    // sides isolating them as singular syntactic units
    const isFlanked = (
      !TokenUtils.isWord(token.previousTextToken) ||
      ParserUtils.tokenMatches(token.previousTextToken, INSTANCEOF)
    ) && (
      ParserUtils.tokenMatches(token.nextTextToken, INSTANCEOF) ||
      !TokenUtils.isWord(token.nextTextToken) &&
      ParserUtils.tokenMatches(token.nextTextToken, /[^.(]/)
    );

    if (!isFlanked) {
      // Optimize for non-flanked tokens; return false before
      // any additional logic checks have to be made
      return false;
    }

    const isPotentialGenericType = ParserUtils.tokenMatches(token.nextToken, '<');

    return !isPotentialGenericType || !isGenericBlock(token.nextToken);
  }

  /**
   * Determines whether a token corresponds to the beginning of
   * a type. Uses one lookahead for types with single-word names,
   * two lookaheads to distinguish [] types from bracket properties,
   * and a potentially large number of lookaheads to distinguish
   * generic types from less-than comparisons (see: isGenericBlock()).
   *
   * @example
   *
   *  Type type
   *  Type[]
   *  Type<...>
   *  Type<...>[]
   */
  export function isType (token: IToken): boolean {
    return (
      TokenUtils.isWord(token) &&
      // Type type
      TokenUtils.isWord(token.nextTextToken) ||
      // Type[]
      ParserUtils.tokenMatches(token.nextToken, '[') &&
      ParserUtils.tokenMatches(token.nextToken.nextToken, ']') ||
      // Type<...> OR Type<...>[]
      ParserUtils.tokenMatches(token.nextToken, '<') &&
      isGenericBlock(token.nextToken)
    );
  }

  /**
   * Determines whether a token corresponds to the beginning or
   * part of a property chain. Uses two token lookaheads to
   * distinguish bracket properties from [] types.
   *
   * @example
   *
   *  object.
   *  object[
   */
  export function isPropertyChain (token: IToken): boolean {
    return (
      // object. OR object[
      TokenUtils.isWord(token) &&
      ParserUtils.tokenMatches(token.nextToken, /[.[]/) &&
      // Avoid confusion with token patterns of the form
      // Object[], which signify array types
      !ParserUtils.tokenMatches(token.nextToken.nextToken, ']')
    );
  }

  /**
   * Determines whether a token corresponds to the beginning of
   * a function call. Uses one token lookahead and potentially
   * one token lookbehind.
   *
   * @example
   *
   *  callFunction(
   *  ](
   *  )(
   */
  export function isFunctionCall (token: IToken): boolean {
    if (ParserUtils.tokenMatches(token, [
      JavaConstants.Keyword.IF,
      JavaConstants.Keyword.FOR,
      JavaConstants.Keyword.WHILE
    ])) {
      // Avoid confusion between method names and
      // if/while/for statements
      return false;
    }

    return (
      // callFunction(
      TokenUtils.isWord(token) &&
      ParserUtils.tokenMatches(token.nextToken, '(')
    ) || (
      // ]( OR )(
      ParserUtils.tokenMatches(token.previousToken, /[\])]/) &&
      ParserUtils.tokenMatches(token, '(')
    );
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of a literal declaration.
   *
   * @example
   *
   *  5
   *  '
   *  "
   *  {
   *  true
   *  false
   *  null
   */
  export function isLiteral (token: IToken): boolean {
    return (
      TokenUtils.isNumber(token) ||
      ParserUtils.tokenMatches(token, /["'{]/) ||
      ParserUtils.tokenMatches(token, [
        JavaConstants.Keyword.TRUE,
        JavaConstants.Keyword.FALSE,
        JavaConstants.Keyword.NULL,
      ])
    );
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of an instantiation.
   *
   * @example
   *
   *  new
   */
  export function isInstantiation (token: IToken): boolean {
    return ParserUtils.tokenMatches(token, JavaConstants.Keyword.NEW);
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of an if-else conditional statement.
   *
   * @example
   *
   *  if
   */
  export function isIfElse (token: IToken): boolean {
    return ParserUtils.tokenMatches(token, JavaConstants.Keyword.IF);
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of an operator.
   *
   * See: JavaConstants.Operator
   */
  export function isOperator (token: IToken): boolean {
    return ParserUtils.tokenMatches(token, JavaConstants.Operators);
  }

  /**
   * Determines whether a token corresponds to the beginning
   * of an instruction.
   */
  export function isInstruction (token: IToken): boolean {
    return ParserUtils.tokenMatches(token, [
      JavaConstants.Keyword.RETURN,
      JavaConstants.Keyword.THROW,
      JavaConstants.Keyword.CONTINUE,
      JavaConstants.Keyword.BREAK
    ]);
  }
}
