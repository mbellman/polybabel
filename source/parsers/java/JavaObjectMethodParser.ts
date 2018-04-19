import AbstractParser from '../common/AbstractParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaParameterParser from './JavaParameterParser';
import JavaSequenceParser from './JavaSequenceParser';
import JavaTypeParser from './JavaTypeParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { TokenType } from '../../tokenizer/types';

export default class JavaObjectMethodParser extends AbstractParser<JavaSyntax.IJavaObjectMethod> {
  @Implements protected getDefault (): JavaSyntax.IJavaObjectMethod {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_METHOD,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      type: null,
      name: null,
      parameters: [],
      block: null
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaObjectMemberParser);
  }

  @Match('(')
  private onParametersStart (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.next();

    const parametersParser = new JavaSequenceParser({
      ValueParser: JavaParameterParser,
      terminator: ')'
    });

    const { values } = this.parseNextWith(parametersParser);

    this.parsed.parameters = values;
  }

  @Match(')')
  private onParametersEnd (): void {
    this.next();
  }

  @Match(JavaConstants.Keyword.THROWS)
  private onThrows (): void {
    this.assert(this.previousCharacterToken.value === ')');

    this.next();

    const throwsParser = new JavaSequenceParser({
      ValueParser: JavaTypeParser,
      terminator: /[;{]/
    });

    const { values } = this.parseNextWith(throwsParser);

    this.parsed.throws = values;
  }

  @Match('{')
  private onBlock (): void {
    this.next();
  }

  @Match(/[};]/)
  private onEnd (): void {
    this.finish();
  }
}
