import AbstractParser from '../common/AbstractParser';
import { isReservedWord } from './java-utils';
import { ISymbolParser, Matcher } from '../common/parser-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';

export default class JavaParameterParser extends AbstractParser<JavaSyntax.IJavaParameter> implements ISymbolParser {
  public readonly symbols: Matcher[] = [
    [/[,)]/, this.finish]
  ];

  public getDefault (): JavaSyntax.IJavaParameter {
    return {
      node: JavaSyntax.JavaSyntaxNode.PARAMETER,
      type: null,
      name: null
    };
  }

  protected onFirstToken (): void {
    const isFinalParameter = this.currentToken.value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      this.skip(1);
    }

    const { value, nextToken } = this.currentToken;

    if (isReservedWord(nextToken.value)) {
      this.halt('reserved word parameter name');
    }

    this.parsed.type = value;
    this.parsed.name = nextToken.value;

    this.skip(2);
  }
}
