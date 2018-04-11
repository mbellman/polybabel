import JavaParameterParser from './JavaParameterParser';
import { AbstractParser } from '../common/parsers';
import { JavaSyntax } from './java-syntax';

export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> {
  protected getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      nodes: []
    };
  }

  protected onFirstToken (): void {
    const { value } = this.currentToken;
  }
}
