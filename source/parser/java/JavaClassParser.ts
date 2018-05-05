import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectBodyParser from './JavaObjectBodyParser';
import JavaTypeParser from './JavaTypeParser';
import SequenceParser from '../common/SequenceParser';
import { Allow, Eat } from '../common/parser-decorators';
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
      members: []
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);
  }

  @Eat(JavaConstants.Keyword.CLASS)
  protected onClassKeyword (): void {
    this.next();
  }

  @Eat(TokenUtils.isWord)
  protected onClassName (): void {
    // TODO: Parse as a type
    this.parsed.name = this.currentToken.value;
  }

  @Allow(JavaConstants.Keyword.EXTENDS)
  protected onExtends (): void {
    this.assert(this.parsed.extended.length === 0);
    this.next();

    const extended = this.getClauseTypeSequence();

    this.assert(
      extended.length === 1,
      `Derived class '${this.parsed.name}' can only extend one base class`
    );

    this.parsed.extended = extended;
  }

  @Allow(JavaConstants.Keyword.IMPLEMENTS)
  protected onImplements (): void {
    this.assert(this.parsed.implemented.length === 0);
    this.next();

    this.parsed.implemented = this.getClauseTypeSequence();
  }

  @Eat('{')
  protected onStartClassBody (): void {
    this.emulate(JavaObjectBodyParser);
    this.stop();
  }

  private getClauseTypeSequence (): JavaSyntax.IJavaType[] {
    const typesParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: [ ...JavaConstants.ReservedWords, '{' ]
    });

    const { values } = this.parseNextWith(typesParser);

    return values;
  }
}
