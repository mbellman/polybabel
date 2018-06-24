import AbstractParser from '../common/AbstractParser';
import JavaBlockParser from './JavaBlockParser';
import JavaTypeParser from './JavaTypeParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import { Allow, Expect } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
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

  @Expect('(')
  protected onParametersStart (): void {
    this.assert(TokenUtils.isWord(this.previousTextToken));
    this.next();

    this.parsed.parameters = this.parseSequence({
      ValueParser: JavaVariableDeclarationParser,
      delimiter: ',',
      terminator: ')'
    });
  }

  @Expect(')')
  protected onParametersEnd (): void {
    this.next();
  }

  @Allow(JavaConstants.Keyword.THROWS)
  protected onThrows (): void {
    this.next();

    this.parsed.throws = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: /[;{]/
    });
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
