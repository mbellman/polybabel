import AbstractParser from '../../common/AbstractParser';
import JavaFunctionCallParser from './JavaFunctionCallParser';
import JavaStatementParser from '../JavaStatementParser';
import JavaTypeParser from '../JavaTypeParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { JavaUtils } from '../java-utils';
import { Match } from '../../common/parser-decorators';
import { ParserUtils } from '../../common/parser-utils';
import { TokenUtils } from '../../../tokenizer/token-utils';

/**
 * Parses property chains. Stops when a non-property chain or
 * non-function call is encountered, or after parsing a type
 * property (such as a type in a namespace).
 *
 * @example Property chains:
 *
 *  object.property.value
 *  Namespace.Type[]
 *  Namespace.Type<...>
 *  Namespace.Type<...>[]
 *  object.method(...).value
 *  object.<...>method(...).value
 *  object[...].value
 *  object[...][...].value
 *  object[...](...).value
 *  object[...]<...>method(...).value
 *  method(...).value
 *
 * @todo Handle non-static object instantiation properties, e.g. 'object.new ____()'
 */
export default class JavaPropertyChainParser extends AbstractParser<JavaSyntax.IJavaPropertyChain> {
  /**
   * Determines whether a [ token has been passed and the
   * current property is within brackets. This flag is
   * necessary to ensure that property chains parsed within
   * brackets of a parent property chain don't mistakenly
   * identify the terminating ] as their own.
   */
  private isInBracketProperty: boolean = false;

  @Implements protected getDefault (): JavaSyntax.IJavaPropertyChain {
    return {
      node: JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
      properties: []
    };
  }

  @Match(TokenUtils.isWord)
  protected onWord (): void {
    const didExitPropertyChain = (
      this.parsed.properties.length > 0 &&
      this.previousToken.value !== '.'
    );

    if (didExitPropertyChain) {
      this.stop();

      return;
    }

    if (this.currentTokenMatches(JavaUtils.isFunctionCall)) {
      this.parseFunctionCallProperty();
    } else if (this.currentTokenMatches(JavaUtils.isType)) {
      this.parseTypeProperty();
    } else {
      this.parseReferenceProperty();
    }
  }

  @Match('.')
  protected onDelimiter (): void {
    this.assert(
      TokenUtils.isText(this.nextToken) &&
      /[^.[]/.test(this.nextToken.value)
    );

    this.next();

    if (this.currentTokenMatches('<')) {
      // Parse the incoming property as a
      // generic-type method call
      this.parseFunctionCallProperty();
    }
  }

  @Match('[')
  protected onBracketProperty (): void {
    this.next();

    this.isInBracketProperty = true;

    const property = this.parseNextWith(JavaStatementParser);

    this.parsed.properties.push(property);
  }

  @Match(']')
  protected onEndBracketProperty (): void {
    const isLastProperty = !ParserUtils.tokenMatches(this.nextToken, /[.<[]/);

    if (!this.isInBracketProperty) {
      // This property chain may be a child inside a parent
      // property chain's brackets; stop here and let the
      // parent parser handle the ] token
      this.stop();
    } else if (isLastProperty) {
      this.finish();
    } else {
      this.next();
    }
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }

  private parseFunctionCallProperty (): void {
    const functionCall = this.parseNextWith(JavaFunctionCallParser);

    this.parsed.properties.push(functionCall);
  }

  /**
   * Types can exist on a property chain if the properties
   * correspond to nested namespaces, though the previous
   * properties must all be single-word references, and the
   * act of adding the type property immediately stops the
   * parser and terminates the chain.
   */
  private parseTypeProperty (): void {
    const nonReferenceProperties = this.parsed.properties
      .filter(({ node }) => node !== JavaSyntax.JavaSyntaxNode.REFERENCE);

    this.assert(nonReferenceProperties.length === 0);

    const type = this.parseNextWith(JavaTypeParser);

    this.parsed.properties.push(type);
    this.stop();
  }

  private parseReferenceProperty (): void {
    this.parsed.properties.push({
      node: JavaSyntax.JavaSyntaxNode.REFERENCE,
      value: this.currentToken.value,
      token: this.currentToken
    });
  }
}
