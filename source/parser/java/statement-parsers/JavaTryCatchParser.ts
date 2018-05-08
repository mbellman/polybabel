import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaTypeParser from '../JavaTypeParser';
import SequenceParser from '../../common/SequenceParser';
import { Allow, Eat, Match } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { TokenUtils } from '../../../tokenizer/token-utils';
import JavaReferenceParser from './JavaReferenceParser';

export default class JavaTryCatchParser extends AbstractParser<JavaSyntax.IJavaTryCatch> {
  @Implements protected getDefault (): JavaSyntax.IJavaTryCatch {
    return {
      node: JavaSyntax.JavaSyntaxNode.TRY_CATCH,
      tryBlock: null,
      exceptionSets: [],
      exceptionReferences: [],
      catchBlocks: []
    };
  }

  @Eat(JavaConstants.Keyword.TRY)
  protected onTry (): void {
    this.next();
  }

  @Eat('{')
  protected onTryBlock (): void {
    this.parsed.tryBlock = this.parseNextWith(JavaBlockParser);
  }

  @Match(JavaConstants.Keyword.CATCH)
  protected onCatch (): void {
    this.eatNext('(');

    const exceptionSequenceParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: '|',
      terminator: token => token.nextTextToken.value === ')'
    });

    const { values: exceptionTypes } = this.parseNextWith(exceptionSequenceParser);
    const exceptionReference = this.parseNextWith(JavaReferenceParser);

    this.parsed.exceptionSets.push(exceptionTypes);
    this.parsed.exceptionReferences.push(exceptionReference);
    this.eat(')');
    this.eat('{');

    const catchBlock = this.parseNextWith(JavaBlockParser);

    this.parsed.catchBlocks.push(catchBlock);
  }

  @Match(JavaConstants.Keyword.FINALLY)
  protected onFinally (): void {
    this.eatNext('{');

    this.parsed.finallyBlock = this.parseNextWith(JavaBlockParser);

    this.stop();
  }

  @Match(/./)
  protected onAfterExitTryCatch (): void {
    this.assert(
      this.parsed.catchBlocks.length > 0,
      'Invalid missing catch block'
    );

    this.stop();
  }
}
