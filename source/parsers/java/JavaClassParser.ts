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

export default class JavaClassParser extends AbstractParser<JavaSyntax.IJavaClass> {
  @Implements protected getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extends: [],
      implements: [],
      nestedClasses: [],
      fields: [],
      methods: []
    };
  }

  @Override protected onFirstToken (): void {
    this.emulate(JavaModifiableParser);

    this.assertCurrentTokenMatch(
      JavaConstants.Keyword.CLASS,
      `Invalid class modifier ${this.currentToken.value}`
    );

    this.next();

    this.parsed.name = this.currentToken.value;

    this.next();
  }

  @Match(JavaConstants.Keyword.EXTENDS)
  private onExtends (): void {
    this.assert(this.parsed.extends.length === 0);
    this.next();

    const extendees = this.getIncomingTypeSequence();

    this.assert(
      extendees.length === 1,
      'Classes can only extend one base class'
    );

    this.parsed.extends = extendees;
  }

  @Match(JavaConstants.Keyword.IMPLEMENTS)
  private onImplements (): void {
    this.assert(this.parsed.implements.length === 0);
    this.next();

    const implementees = this.getIncomingTypeSequence();

    this.parsed.implements = implementees;
  }

  @Match('{')
  private onOpenBrace (): void {
    const { fields, methods } = this.parsed;

    this.assert(fields.length === 0 && methods.length === 0);
    this.next();
  }

  @NegativeLookahead('(')
  private onField (): void {
    const field = this.parseNextWith(JavaObjectFieldParser);

    this.parsed.fields.push(field);
  }

  @Lookahead('(')
  private onMethod (): void {
    const method = this.parseNextWith(JavaObjectMethodParser);

    this.parsed.methods.push(method);
  }

  @Lookahead(JavaConstants.Keyword.CLASS)
  private onNestedClass (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.parsed.nestedClasses.push(javaClass);
  }

  @Lookahead(JavaConstants.Keyword.INTERFACE)
  private onNestedInterface (): void {

  }

  private getIncomingTypeSequence (): JavaSyntax.IJavaType[] {
    const typesParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      terminator: [ ...JavaConstants.ReservedWords, '{' ],
      delimiter: ','
    });

    const { values } = this.parseNextWith(typesParser);

    return values;
  }
}
