import AbstractParser from '../../common/AbstractParser';
import JavaStatementParser from '../JavaStatementParser';
import JavaTypeParser from '../JavaTypeParser';
import SequenceParser from '../../common/SequenceParser';
import { Eat, Match } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { TokenUtils } from '../../../tokenizer/token-utils';

export default class JavaInstantiationParser extends AbstractParser<JavaSyntax.IJavaInstantiation> {
  @Implements protected getDefault (): JavaSyntax.IJavaInstantiation {
    return {
      node: JavaSyntax.JavaSyntaxNode.INSTANTIATION,
      constructor: null,
      arguments: []
    };
  }

  @Eat(JavaConstants.Keyword.NEW)
  protected onNew (): void {
    this.next();
  }

  @Eat(TokenUtils.isWord)
  protected onConstructor (): void {
    this.parsed.constructor = this.parseNextWith(JavaTypeParser);
  }

  @Match('(')
  protected onArgumentsStart (): void {
    this.next();

    const argumentsParser = new SequenceParser({
      ValueParser: JavaStatementParser,
      delimiter: ',',
      terminator: ')'
    });

    const { values } = this.parseNextWith(argumentsParser);

    this.parsed.arguments = values;
  }

  /**
   * TODO: Add support for anonymous classes/instance overrides
   */
  @Match(')')
  protected onEnd (): void {
    this.finish();
  }
}
