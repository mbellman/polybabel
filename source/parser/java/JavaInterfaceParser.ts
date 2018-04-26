import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectBodyParser from './JavaObjectBodyParser';
import JavaTypeParser from './JavaTypeParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';

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

    this.assertCurrentTokenMatch(
      JavaConstants.Keyword.INTERFACE,
      `Invalid interface modifier '${this.currentToken.value}'`
    );

    this.next();

    this.parsed.name = this.currentToken.value;

    this.next();
  }

  @Match(JavaConstants.Keyword.EXTENDS)
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

  @Match('{')
  protected onInterfaceBody (): void {
    this.emulate(JavaObjectBodyParser);
    this.stop();
  }
}
