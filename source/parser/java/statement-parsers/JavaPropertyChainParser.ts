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

  @Match(token => (
    TokenUtils.isWord(token) &&
    !JavaUtils.isType(token) &&
    !JavaUtils.isFunctionCall(token)
  ))
  protected onWordProperty (): void {
    this.parsed.properties.push(this.currentToken.value);
  }

  /**
   * Types can exist on a property chain if the properties
   * correspond to nested namespaces, though the previous
   * properties must all be strings, and the act of adding
   * the type property immediately stops the parser and
   * terminates the chain.
   */
  @Match(JavaUtils.isType)
  protected onTypeProperty (): void {
    const nonStringProperties = this.parsed.properties
      .filter(property => typeof property !== 'string');

    this.assert(nonStringProperties.length === 0);

    const type = this.parseNextWith(JavaTypeParser);

    this.parsed.properties.push(type);
    this.stop();
  }

  @Match('.')
  protected onDelimiter (): void {
    this.assert(TokenUtils.isText(this.nextToken));
    this.next();

    if (this.currentTokenMatches('<')) {
      // Parse the incoming property as a generic-type method call
      this.onFunctionCallProperty();
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

  @Match(JavaUtils.isFunctionCall)
  protected onFunctionCallProperty (): void {
    const functionCall = this.parseNextWith(JavaFunctionCallParser);

    this.parsed.properties.push(functionCall);
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }
}
