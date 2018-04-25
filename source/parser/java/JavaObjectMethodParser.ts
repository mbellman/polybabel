import AbstractParser from '../common/AbstractParser';
import JavaBlockParser from './JavaBlockParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaTypeParser from './JavaTypeParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
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

  @Override protected onFirstToken (): void {
    this.emulate(JavaObjectMemberParser);
  }

  @Match('(')
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

  @Match(')')
  protected onParametersEnd (): void {
    this.next();
  }

  @Match(JavaConstants.Keyword.THROWS)
  protected onThrows (): void {
    this.assert(this.previousTextToken.value === ')');
    this.next();

    const throwsParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: /[;{]/
    });

    const { values } = this.parseNextWith(throwsParser);

    this.parsed.throws = values;
  }

  @Match('{')
  protected onBlock (): void {
    this.parsed.block = this.parseNextWith(JavaBlockParser);

    this.stop();
  }

  @Match(';')
  protected onEnd (): void {
    this.assert(this.parsed.block === null);
    this.finish();
  }
}
