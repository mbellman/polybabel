import AbstractParser from '../common/AbstractParser';
import { isReservedWord } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Parser } from '../common/parser-decorators';

export default class JavaParameterParser extends AbstractParser<JavaSyntax.IJavaParameter> {
  public getDefault (): JavaSyntax.IJavaParameter {
    return {
      node: JavaSyntax.JavaSyntaxNode.PARAMETER,
      type: null,
      name: null
    };
  }

  public onFirstToken (): void {
    const isFinalParameter = this.currentToken.value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      this.skip(1);
    }

    const { value, nextToken } = this.currentToken;

    this.assert(
      !isReservedWord(nextToken.value),
      `Invalid parameter name '${nextToken.value}'`
    );

    this.parsed.type = value;
    this.parsed.name = nextToken.value;

    this.skip(2);
    this.stop();
  }
}
