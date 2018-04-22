import AbstractParser from '../../common/AbstractParser';
import JavaStatementParser from '../JavaStatementParser';
import SequenceParser from '../../common/SequenceParser';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../java-syntax';
import { JavaUtils } from '../java-utils';
import { Match } from '../../common/parser-decorators';
import { TokenUtils } from '../../../tokenizer/token-utils';
import JavaTypeParser from '../JavaTypeParser';

/**
 * Parses function calls. Finishes when a ) token is encountered.
 *
 * @example Function calls:
 *
 *  method(...)
 *  <...>method(...)
 *  ](...)
 *  )(...)
 */
export default class JavaFunctionCallParser extends AbstractParser<JavaSyntax.IJavaFunctionCall> {
  @Implements protected getDefault (): JavaSyntax.IJavaFunctionCall {
    return {
      node: JavaSyntax.JavaSyntaxNode.FUNCTION_CALL,
      name: null,
      genericArguments: [],
      arguments: []
    };
  }

  /**
   * JavaUtils.isFunctionCall does not normally anticipate
   * that a function call may start with <, which otherwise
   * denotes a block for generic type arguments. It is up to
   * parent parsers to decide, depending on context, when a
   * < token represents the beginning of a function call and
   * parse the incoming stream with JavaFunctionCallParser.
   * Otherwise, having JavaUtils.isFunctionCall walk through
   * the incoming token stream at a < to determine whether a
   * ( is eventually reached without hitting whitespace or a
   * newline would be prohibitively expensive.
   *
   * Where appropriate, parent parsers can @Match() both <
   * and JavaUtils.isFunctionCall if it is safe to assume
   * the < would only be used in the context of a function
   * call.
   *
   * Suffice it to say, that we match < here does not imply
   * that a < always represents the beginning or part of a
   * function call.
   */
  @Match('<')
  protected onGenericArgumentsStart (): void {
    this.next();

    const genericArgumentsParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '>'
    });

    const { values } = this.parseNextWith(genericArgumentsParser);

    this.parsed.genericArguments = values;

    this.next();
  }

  @Match(TokenUtils.isWord)
  protected onFunctionName (): void {
    this.parsed.name = this.currentToken.value;
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
