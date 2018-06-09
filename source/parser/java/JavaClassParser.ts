import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectBodyParser from './JavaObjectBodyParser';
import JavaTypeParser from './JavaTypeParser';
import { Allow, Expect } from '../common/parser-decorators';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenUtils } from '../../tokenizer/token-utils';

export default class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  @Implements protected getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extended: [],
      implemented: [],
      members: [],
      instanceInitializers: [],
      staticInitializers: []
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);
  }

  @Expect(JavaConstants.Keyword.CLASS)
  protected onClassKeyword (): void {
    this.next();
  }

  @Expect(TokenUtils.isWord)
  protected onClassName (): void {
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

    const extended = [ this.parseNextWith(JavaTypeParser) ];

    this.parsed.extended = extended;
  }

  @Allow(JavaConstants.Keyword.IMPLEMENTS)
  protected onImplements (): void {
    this.assert(this.parsed.implemented.length === 0);
    this.next();

    this.parsed.implemented = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '{'
    });
  }

  @Expect('{')
  protected onStartClassBody (): void {
    this.next();
    this.emulate(JavaObjectBodyParser);
    this.stop();
  }
}
