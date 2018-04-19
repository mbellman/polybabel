import AbstractParser from '../common/AbstractParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import JavaSequenceParser from './JavaSequenceParser';
import JavaTypeParser from './JavaTypeParser';
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

    this.assertCurrentTokenValue(
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

    const extendsTypes = this.getIncomingTypeSequence();

    this.assert(
      extendsTypes.length === 1,
      'Classes can only extend one base class'
    );

    this.parsed.extends = extendsTypes;
  }

  @Match(JavaConstants.Keyword.IMPLEMENTS)
  private onImplements (): void {
    this.assert(this.parsed.implements.length === 0);
    this.next();

    const implementsTypes = this.getIncomingTypeSequence();

    this.parsed.implements = implementsTypes;
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
    const typesParser = new JavaSequenceParser({
      ValueParser: JavaTypeParser,
      terminator: [ ...JavaConstants.ReservedWords, '{' ]
    });

    const { values } = this.parseNextWith(typesParser);

    return values;
  }
}
