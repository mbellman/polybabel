import AbstractParser from '../common/AbstractParser';
import JavaBlockParser from './JavaBlockParser';
import JavaTypeParser from './JavaTypeParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match, Eat, Allow } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> {
  @Implements protected getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      throws: [],
      block: null
    };
  }

  @Eat('(')
  protected onParametersStart (): void {
    this.assert(TokenUtils.isWord(this.previousTextToken));
    this.next();

    const parametersParser = new SequenceParser({
      ValueParser: JavaVariableDeclarationParser,
      delimiter: ',',
      terminator: ')'
    });

    const { values } = this.parseNextWith(parametersParser);

    this.parsed.parameters = values;
  }

  @Eat(')')
  protected onParametersEnd (): void {
    this.next();
  }

  @Allow(JavaConstants.Keyword.THROWS)
  protected onThrows (): void {
    this.next();

    const throwsParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: /[;{]/
    });

    const { values } = this.parseNextWith(throwsParser);

    this.parsed.throws = values;
  }

  @Allow('{')
  protected onBlock (): void {
    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }

  @Allow(';')
  protected onEnd (): void {
    this.assert(this.parsed.block === null);
    this.finish();
  }
}
