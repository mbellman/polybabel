import AbstractParser from '../common/AbstractParser';
import JavaStatementParser from './JavaStatementParser';
import { Allow, Expect } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaAnnotationParser extends AbstractParser<JavaSyntax.IJavaAnnotation> {
  @Implements protected getDefault (): JavaSyntax.IJavaAnnotation {
    return {
      node: JavaSyntax.JavaSyntaxNode.ANNOTATION,
      name: null,
      arguments: []
    };
  }

  @Expect('@')
  protected onStart (): void {
    this.next();
  }

  @Expect(TokenUtils.isWord)
  protected onAnnotationName (): void {
    this.parsed.name = this.currentToken.value;
  }

  @Allow('(')
  protected onStartAnnotationArguments (): void {
    this.next();

    this.parsed.arguments = this.parseSequence({
      ValueParser: JavaStatementParser,
      delimiter: ',',
      terminator: ')'
    });

    this.finish();
  }

  @Allow(/./)
  protected onAfterZeroArgumentAnnotation (): void {
    this.stop();
  }
}
