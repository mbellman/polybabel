import AbstractParser from '../common/AbstractParser';
import { JavaSyntax } from './java-syntax';
import { Implements } from 'trampoline-framework';

export default class JavaInstantiationParser extends AbstractParser<JavaSyntax.IJavaInstantiation> {
  @Implements protected getDefault (): JavaSyntax.IJavaInstantiation {
    return {
      node: JavaSyntax.JavaSyntaxNode.INSTANTIATION,
      constructor: null,
      arguments: []
    };
  }
}
