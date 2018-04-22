import AbstractParser from '../common/AbstractParser';
import JavaStatementParser from './JavaStatementParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaFunctionCallParser extends AbstractParser<JavaSyntax.IJavaFunctionCall> {
  @Implements protected getDefault (): JavaSyntax.IJavaFunctionCall {
    return {
      node: JavaSyntax.JavaSyntaxNode.FUNCTION_CALL,
      function: null,
      arguments: []
    };
  }

  @Override protected onFirstToken (): void {
    this.assert(TokenUtils.isWord(this.currentToken));

    this.parsed.function = this.currentToken.value;

    this.next();
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

  @Match(')')
  protected onArgumentsEnd (): void {
    this.finish();
  }
}
