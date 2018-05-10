import AbstractParser from '../../common/AbstractParser';
import JavaLiteralParser from './JavaLiteralParser';
import JavaObjectBodyParser from '../JavaObjectBodyParser';
import JavaStatementParser from '../JavaStatementParser';
import JavaTypeParser from '../JavaTypeParser';
import SequenceParser from '../../common/SequenceParser';
import { Allow, Eat } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { TokenUtils } from '../../../tokenizer/token-utils';

/**
 * Parses instantiation statements, finishing when encountering
 * a ) token if the next token is not an opening { brace, and
 * stopping after parsing an anonymous object or array allocation
 * statement and finishing parsing the block or array literal.
 *
 * @example
 *
 *  new String('Hello')
 *  new String[5]
 *  new Number[2]{ 1, 2 }
 *
 *  new String() {
 *    ...
 *  }
 */
export default class JavaInstantiationParser extends AbstractParser<JavaSyntax.IJavaInstantiation> {
  /**
   * Determines whether the instance being created is that of an
   * object, such as a class or interface, as opposed to an array
   * literal. Set to true upon encountering a ( token. This cannot
   * be derived merely based on the number of arguments, since
   * objects may be instantiated without any.
   */
  private isObjectInstantiation: boolean;

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

  @Allow('[')
  protected onStartArrayAllocation (): void {
    this.parsed.arrayAllocationCount = this.eatNext(TokenUtils.isNumber);
  }

  @Allow(']')
  protected onEndArrayAllocation (): void {
    const isArrayLiteral = this.nextTextToken.value === '{';

    if (!isArrayLiteral) {
      this.finish();
    }
  }

  @Allow('(')
  protected onStartArguments (): void {
    this.assert(!this.parsed.arrayAllocationCount);
    this.next();

    const argumentsParser = new SequenceParser({
      ValueParser: JavaStatementParser,
      delimiter: ',',
      terminator: ')'
    });

    const { values } = this.parseNextWith(argumentsParser);

    this.parsed.arguments = values;
    this.isObjectInstantiation = true;
  }

  @Allow(')')
  protected onEndArguments (): void {
    const isAnonymousObject = this.nextTextToken.value === '{';

    if (!isAnonymousObject) {
      this.finish();
    }
  }

  @Allow('{')
  protected onBrace (): void {
    if (this.isObjectInstantiation) {
      this.parsed.anonymousObjectBody = this.parseNextWith(JavaObjectBodyParser);
    } else {
      this.parsed.arrayLiteral = this.parseNextWith(JavaLiteralParser);
    }

    this.stop();
  }
}
