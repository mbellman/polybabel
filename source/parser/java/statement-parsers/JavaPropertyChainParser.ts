import AbstractParser from '../../common/AbstractParser';
import JavaFunctionCallParser from './JavaFunctionCallParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { JavaUtils } from '../java-utils';
import { Match } from '../../common/parser-decorators';
import JavaStatementParser from '../JavaStatementParser';

/**
 * Parses property chains. Stops when a non-property chain or
 * non-function call is encountered.
 *
 * @example Property chains:
 *
 *  object.property.value
 *  object.method(...).value
 *  object.<...>method(...).value
 *  object[...].value
 *  object[...](...).value
 *  object[...]<...>method(...).value
 */
export default class JavaPropertyChainParser extends AbstractParser<JavaSyntax.IJavaPropertyChain> {
  @Implements protected getDefault (): JavaSyntax.IJavaPropertyChain {
    return {
      node: JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
      properties: []
    };
  }

  @Match(JavaUtils.isPropertyChain)
  protected onPropertyChainStream (): void {
    const isDelimiter = this.currentTokenMatches(/[.\]]/);

    if (!isDelimiter) {
      this.parsed.properties.push(this.currentToken.value);
    }
  }

  @Match('[')
  protected onBracketProperty (): void {
    this.next();

    const property = this.parseNextWith(JavaStatementParser);

    this.parsed.properties.push(property);

    this.next();
  }

  @Match('<')
  @Match(JavaUtils.isFunctionCall)
  protected onFunctionCall (): void {
    const functionCall = this.parseNextWith(JavaFunctionCallParser);

    this.parsed.properties.push(functionCall);
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }
}
