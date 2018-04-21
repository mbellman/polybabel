import AbstractParser from '../common/AbstractParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';

export default class JavaLiteralParser extends AbstractParser<JavaSyntax.IJavaLiteral> {
  @Implements protected getDefault (): JavaSyntax.IJavaLiteral {
    return {
      node: JavaSyntax.JavaSyntaxNode.LITERAL,
      value: null
    };
  }
}
