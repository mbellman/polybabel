import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import JavaTypeParser from './JavaTypeParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Lookahead, Match, NegativeLookahead } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';
import JavaInterfaceParser from './JavaInterfaceParser';

export default class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  @Implements protected getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extends: [],
      implements: [],
      fields: [],
      methods: [],
      nestedClasses: [],
      nestedInterfaces: []
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);

    this.assertCurrentTokenMatch(
      JavaConstants.Keyword.CLASS,
      `Invalid class modifier ${this.currentToken.value}`
    );

    this.next();
    this.assert(TokenUtils.isWord(this.currentToken));

    this.parsed.name = this.currentToken.value;

    this.next();
  }

  @Match(JavaConstants.Keyword.EXTENDS)
  protected onExtends (): void {
    this.assert(this.parsed.extends.length === 0);
    this.next();

    const extendees = this.getClauseTypeSequence();

    this.assert(
      extendees.length === 1,
      `Derived class '${this.parsed.name}' can only extend one base class`
    );

    this.parsed.extends = extendees;
  }

  @Match(JavaConstants.Keyword.IMPLEMENTS)
  protected onImplements (): void {
    this.assert(this.parsed.implements.length === 0);
    this.next();

    const implementees = this.getClauseTypeSequence();

    this.parsed.implements = implementees;
  }

  @Match('{')
  protected onEnterClassBody (): void {
    const { fields, methods } = this.parsed;

    this.assert(fields.length === 0 && methods.length === 0);
  }

  @NegativeLookahead('(')
  protected onField (): void {
    const field = this.parseNextWith(JavaObjectFieldParser);

    this.parsed.fields.push(field);
  }

  @Lookahead('(')
  protected onMethod (): void {
    const method = this.parseNextWith(JavaObjectMethodParser);

    this.parsed.methods.push(method);
  }

  @Lookahead(JavaConstants.Keyword.CLASS)
  protected onNestedClass (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }

  @Lookahead(JavaConstants.Keyword.INTERFACE)
  protected onNestedInterface (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    this.parsed.nestedInterfaces.push(javaInterface);
  }

  @Match('}')
  protected onExit(): void {
    this.finish();
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
