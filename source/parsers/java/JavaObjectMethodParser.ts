import AbstractParser from '../common/AbstractParser';
import JavaBlockParser from './JavaBlockParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaParameterParser from './JavaParameterParser';
import JavaTypeParser from './JavaTypeParser';
import SequenceParser from '../common/SequenceParser';
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
  protected onParametersStart (): void {
    this.assert(this.previousCharacterToken.type === TokenType.WORD);
    this.next();

    const parametersParser = new SequenceParser({
      ValueParser: JavaParameterParser,
      terminator: ')',
      delimiter: ','
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
    this.assert(this.previousCharacterToken.value === ')');

    this.next();

    const throwsParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      terminator: /[;{]/,
      delimiter: ','
    });

    const { values } = this.parseNextWith(throwsParser);

    this.parsed.throws = values;
  }

  @Match('{')
  protected onBlock (): void {
    this.next();
  }

  @Match(/[};]/)
  protected onEnd (): void {
    this.finish();
  }
}
