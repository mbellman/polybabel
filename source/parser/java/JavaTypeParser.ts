import AbstractParser from '../common/AbstractParser';
import { Allow, Eat, Match } from '../common/parser-decorators';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { ParserUtils } from '../common/parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * Parses type declarations and stops when a token other
 * than a word, [, ], <, or > is encountered.
 *
 * @example Types:
 *
 *  Type
 *  Type[]
 *  Type<...>
 *  Type<...>[]
 *  Namespaced...Type
 *  Namespaced...Type[]
 *  Namespaced...Type<...>
 *  Namespaced...Type<...>[]
 *  ? extends ...
 */
export default class JavaTypeParser extends AbstractParser<JavaSyntax.IJavaType> {
  @Implements protected getDefault (): JavaSyntax.IJavaType {
    return {
      node: JavaSyntax.JavaSyntaxNode.TYPE,
      namespaceChain: [],
      genericTypes: [],
      arrayDimensions: 0
    };
  }

  /**
   * Exclusively within generic blocks, wildcard types can be
   * specified with the ? symbol. In the majority of cases in
   * which Java types are parsed, i.e. those in variable/method
   * parameter declarations, types will be parsed with the
   * requirement that the initial token is a word. Exceptions
   * apply in the following cases:
   *
   *  1) throws/extends/implements clause type sequences
   *  2) catch statement exception types
   *  3) parameter bound types or intersection type sequences
   *
   * For additional security, we assert that the token preceding
   * a ? is either < or , and that the token following a whole
   * wildcard type is > or ,. This narrows down potentially
   * erroneous wildcard type usages to the following cases only:
   *
   *  1) throws/extends/implements clause type sequences
   *
   * Therefore, the validation stage will have to verify that
   * types within these sequences are not wildcard types.
   */
  @Allow('?')
  protected onWildcardType (): void {
    this.assert(/[<,]/.test(this.previousTextToken.value));
    this.next();

    this.parsed.isWildcard = true;

    if (this.currentTokenMatches('>')) {
      this.stop();

      return;
    }

    const wildcardBoundKeyword = this.eat([
      JavaConstants.Keyword.EXTENDS,
      JavaConstants.Keyword.SUPER
    ]);

    const wildcardBound = wildcardBoundKeyword === JavaConstants.Keyword.EXTENDS
      ? JavaSyntax.JavaWildcardBound.UPPER
      : JavaSyntax.JavaWildcardBound.LOWER;

    this.assertCurrentTokenMatch(TokenUtils.isWord);

    const wildcardBoundType = this.parseNextWith(JavaTypeParser);

    this.parsed.wildcardBound = wildcardBound;
    this.parsed.wildcardBoundType = wildcardBoundType;

    this.assertCurrentTokenMatch(/[>,]/);
    this.stop();
  }

  @Eat(TokenUtils.isWord)
  protected onTypeName (): void {
    const isParameterBoundType = this.nextTextToken.value === JavaConstants.Keyword.EXTENDS;

    const isNamespacedType = (
      this.nextToken.value === '.' &&
      TokenUtils.isWord(this.nextToken.nextToken)
    );

    if (isNamespacedType) {
      this.parseTypeNamespaceChain();
    } else if (isParameterBoundType) {
      this.parseParameterBoundType();

      return;
    } else {
      this.parsed.namespaceChain.push(this.currentToken.value);
    }

    this.next();
  }

  @Allow('<')
  protected onGenericBlockStart (): void {
    this.next();

    if (this.currentTokenMatches('>')) {
      // Diamond notation generic, e.g. List<>
      this.next();
    } else {
      this.parsed.genericTypes = this.parseSequence({
        ValueParser: JavaTypeParser,
        delimiter: ',',
        terminator: '>'
      });

      if (this.nextToken.value !== '[') {
        this.finish();
      }
    }
  }

  @Allow('>')
  protected onGenericBlockEnd (): void {
    const hasGenericTypes = this.parsed.genericTypes.length > 0;

    if (this.nextToken.value !== '[' || !hasGenericTypes) {
      // If the type isn't a [], we stop here. If the type
      // doesn't have generic types, we stop without halting
      // since A) this could be a child type parser handling
      // an argument to a generic, and B) if it isn't, and
      // the > was typed improperly, the parent parser will
      // encounter the erroneous token and halt.
      this.stop();
    }
  }

  @Match('[')
  protected onOpenBracket (): void {
    const isArrayType = this.nextToken.value === ']';

    if (isArrayType) {
      this.next();
    } else {
      // This type may have been parsed in the context of an
      // array allocation instantiation statement, in which
      // case we stop here and let JavaInstantiationParser
      // handle the rest. If a character is incorrectly typed
      // after an open bracket in any other context, the
      // parent parser will halt, as no other Java parsers
      // which parse types have a contingency for types of
      // this form.
      this.stop();
    }
  }

  @Match(']')
  protected onCloseBracket (): void {
    this.assert(this.previousToken.value === '[');

    this.parsed.arrayDimensions++;
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }

  /**
   * Parses the namespace chain of a namespaced type. This is
   * actually one of two places where namespaced types may be
   * parsed; when parsing statements, a namespaced type will
   * will appear to, and be, parsed as a property chain before
   * an actual type is found at the end of the chain and the
   * property chain is retroactively turned into the type side
   * of a variable declaration.
   *
   * See: JavaPropertyChainParser.parseTypeProperty()
   */
  private parseTypeNamespaceChain (): void {
    while (!this.isEOF()) {
      if (this.currentTokenMatches(TokenUtils.isWord)) {
        this.parsed.namespaceChain.push(this.currentToken.value);

        if (!ParserUtils.tokenMatches(this.nextToken, '.')) {
          // End of namespace chain
          break;
        }
      } else if (this.currentTokenMatches('.')) {
        this.assert(TokenUtils.isWord(this.nextToken));
      }

      this.next();
    }
  }

  /**
   * Parses (generic) parameter bound types, i.e. type variants
   * of the form:
   *
   *  T extends ...
   *  T extends ... & ...
   *
   * Since these types are only allowed within generic blocks,
   * we assert that their preceding token is < or , and that the
   * token following the bound is > or ,. This restricts the
   * erroneous use of parameter bound types to throws/extends/
   * implements clause type sequences only. The validation stage
   * will have to verify that parameter bounds are not used in
   * these cases.
   */
  private parseParameterBoundType (): void {
    this.assert(/[<,]/.test(this.previousTextToken.value));

    this.parsed.parameterBoundName = this.currentToken.value;

    this.next();
    this.next();
    this.assertCurrentTokenMatch(TokenUtils.isWord);

    this.parsed.parameterBoundTypes = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: '&',
      terminator: /[>,]/
    });

    this.stop();
  }
}
