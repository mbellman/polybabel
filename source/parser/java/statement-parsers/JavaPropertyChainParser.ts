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
  @Implements protected getDefault (): JavaSyntax.IJavaPropertyChain {
    return {
      node: JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
      properties: []
    };
  }

  @Match(token => (
    TokenUtils.isWord(token) &&
    !JavaUtils.isType(token)
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
  }

  @Match('[')
  protected onBracketProperty (): void {
    this.next();

    const property = this.parseNextWith(JavaStatementParser);

    this.parsed.properties.push(property);
  }

  @Match(']')
  protected onEndBracketProperty (): void {
    const isLastProperty = !ParserUtils.tokenMatches(this.nextToken, /[.<[]/);

    if (isLastProperty) {
      this.finish();
    } else {
      this.next();
    }
  }

  @Match('<')
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
