import AbstractParser from '../../common/AbstractParser';
import JavaFunctionCallParser from './JavaFunctionCallParser';
import JavaStatementParser from '../JavaStatementParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { JavaUtils } from '../java-utils';
import { Match } from '../../common/parser-decorators';
import { TokenUtils } from '../../../tokenizer/token-utils';
import { ParserUtils } from '../../common/parser-utils';

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

  @Match(TokenUtils.isWord)
  protected onStringProperty (): void {
    this.parsed.properties.push(this.currentToken.value);
  }

  @Match('.')
  protected onDelimiter (): void {
    this.assert(TokenUtils.isCharacterToken(this.nextToken));
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
    const isContinuing = ParserUtils.tokenMatches(this.nextToken, /[.<[]/);

    if (isContinuing) {
      this.next();
    } else {
      this.finish();
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
