import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectBodyParser from './JavaObjectBodyParser';
import JavaTypeParser from './JavaTypeParser';
import { Allow, Expect } from '../common/parser-decorators';
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
      implemented: [],
      constructors: [],
      members: [],
      instanceInitializers: [],
      staticInitializers: []
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);
  }

  @Expect(JavaConstants.Keyword.INTERFACE)
  protected onInterfaceKeyword (): void {
    this.next();
  }

  @Expect(TokenUtils.isWord)
  protected onInterfaceName (): void {
    this.parsed.name = this.currentToken.value;
  }

  @Allow('<')
  protected onGenericTypes (): void {
    this.next();

    this.parsed.genericParameters = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '>'
    });

    this.next();
  }

  @Allow(JavaConstants.Keyword.EXTENDS)
  protected onExtends (): void {
    this.assert(this.parsed.extended.length === 0);
    this.next();

    this.parsed.extended = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '{'
    });
  }

  @Allow('{')
  protected onInterfaceBody (): void {
    this.next();
    this.emulate(JavaObjectBodyParser);
    this.stop();
  }
}
