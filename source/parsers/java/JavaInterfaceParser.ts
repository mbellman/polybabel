import AbstractParser from '../common/AbstractParser';
import JavaClauseParser from './JavaClauseParser';
import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import { Implements, Override } from 'trampoline-framework';
import { isAccessModifierKeyword } from './java-utils';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Lookahead, Match, NegativeLookahead } from '../common/parser-decorators';

export default class JavaInterfaceParser extends AbstractParser<JavaSyntax.IJavaInterface> {
  @Implements protected getDefault (): JavaSyntax.IJavaInterface {
    return {
      node: JavaSyntax.JavaSyntaxNode.INTERFACE,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      extends: [],
      fields: [],
      methods: []
    };
  }

  @Override protected onFirstToken (): void {
    const { value } = this.currentToken;

    if (isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.next();
    }

    this.assertCurrentTokenValue(
      JavaConstants.Keyword.INTERFACE,
      `Invalid interface modifier '${this.currentToken.value}'`
    );

    this.next();

    this.parsed.name = this.currentToken.value;

    this.next();
  }

  @Match(JavaConstants.Keyword.EXTENDS)
  private onExtends (): void {
    this.assert(this.parsed.extends.length === 0);

    const clause = this.parseNextWith(JavaClauseParser);

    this.parsed.extends = clause.values;
  }

  @Match('{')
  private onEnter (): void {
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

  @Match('}')
  private onExit(): void {
    this.finish();
  }
}
