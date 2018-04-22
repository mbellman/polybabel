import AbstractParser from '../common/AbstractParser';
import JavaFunctionCallParser from './JavaFunctionCallParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';

export default class JavaPropertyChainParser extends AbstractParser<JavaSyntax.IJavaPropertyChain> {
  @Implements protected getDefault (): JavaSyntax.IJavaPropertyChain {
    return {
      node: JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN,
      properties: []
    };
  }

  @Match(JavaUtils.isPropertyChain)
  protected onPropertyChainStream (): void {
    const property = this.currentToken.value;

    if (property !== '.') {
      this.parsed.properties.push(property);
    }
  }

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
