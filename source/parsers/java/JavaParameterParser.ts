import { AbstractParser, ISymbolParser, Matcher } from '../common/parsers';
import { isReservedWord } from './java-utils';
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
    let { value, nextToken } = this.currentToken;
    const isFinalParameter = value === JavaConstants.Keyword.FINAL;

    if (isFinalParameter) {
      this.parsed.isFinal = true;

      nextToken = this.currentToken.nextToken;
      value = nextToken.value;
    }

    if (isReservedWord(nextToken.value)) {
      this.halt('reserved word parameter name');
    }

    this.parsed.type = value;
    this.parsed.name = nextToken.value;

    this.skip(isFinalParameter ? 3 : 2);
  }
}
