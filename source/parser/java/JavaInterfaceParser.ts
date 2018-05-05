import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectBodyParser from './JavaObjectBodyParser';
import JavaTypeParser from './JavaTypeParser';
import SequenceParser from '../common/SequenceParser';
import { Allow, Eat, Match } from '../common/parser-decorators';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaInterfaceParser extends AbstractParser<JavaSyntax.IJavaInterface> {
  @Implements protected getDefault (): JavaSyntax.IJavaInterface {
    return {
      node: JavaSyntax.JavaSyntaxNode.INTERFACE,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extended: [],
      members: []
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);
  }

  @Eat(JavaConstants.Keyword.INTERFACE)
  protected onInterfaceKeyword (): void {
    this.next();
  }

  @Eat(TokenUtils.isWord)
  protected onInterfaceName (): void {
    // TODO: Parse as a type
    this.parsed.name = this.currentToken.value;
  }

  @Allow(JavaConstants.Keyword.EXTENDS)
  protected onExtends (): void {
    this.assert(this.parsed.extended.length === 0);
    this.next();

    const extendsParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '{'
    });

    const { values } = this.parseNextWith(extendsParser);

    this.parsed.extended = values;
  }

  @Allow('{')
  protected onInterfaceBody (): void {
    this.emulate(JavaObjectBodyParser);
    this.stop();
  }
}
