import AbstractParser from '../common/AbstractParser';
import JavaObjectFieldParser from './JavaObjectFieldParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import JavaTypeParser from './JavaTypeParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
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

    if (JavaUtils.isAccessModifierKeyword(value)) {
      this.parsed.access = JavaConstants.AccessModifierMap[value];

      this.next();
    }

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
    this.assert(this.parsed.extends.length === 0);
    this.next();

    const extendsParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '{'
    });

    const { values } = this.parseNextWith(extendsParser);

    this.parsed.extends = values;
  }

  @Match('{')
  protected onEnter (): void {
    const { fields, methods } = this.parsed;

    this.assert(fields.length === 0 && methods.length === 0);
    this.next();
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

  @Match('}')
  protected onExit(): void {
    this.finish();
  }
}
