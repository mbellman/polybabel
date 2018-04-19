import AbstractParser from '../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { ISyntaxNode, ITyped } from '../common/syntax-types';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { Pattern } from '../common/parser-types';
import { TokenType } from '../../tokenizer/types';

export default class JavaTypeParser extends AbstractParser<JavaSyntax.IJavaType> {
  @Implements protected getDefault (): JavaSyntax.IJavaType {
    return {
      node: JavaSyntax.JavaSyntaxNode.TYPE,
      genericTypes: [],
      name: null
    };
  }

  @Override protected onFirstToken (): void {
    const { type, value } = this.currentToken;

    this.assert(type === TokenType.WORD);

    this.parsed.name = value;

    this.next();
  }

  @Match('[')
  private onOpenBracket (): void {
    this.assert(this.nextToken.value === ']');
  }

  @Match(']')
  private onCloseBracket (): void {
    this.assert(this.previousToken.value === '[');

    this.parsed.isArray = true;
  }

  @Match('<')
  private onOpenAngleBracket (): void {
    this.assert(this.previousToken.type === TokenType.WORD);
    this.next();

    // TODO: Handle a sequence of generic types
    const genericType = this.parseNextWith(JavaTypeParser);

    this.parsed.genericTypes.push(genericType);
  }

  /**
   * TODO: Require the correct number of generic bracket terminators
   */
  @Match('>')
  private onCloseAngleBracket (): void {
    // Closing angle brackets will be encountered by a child
    // JavaTypeParser handling a generic type parameter, so we
    // finish to break out of the generic parameter declaration
    this.finish();
  }

  @Match(Pattern.ANY)
  private onEnd (): void {
    this.stop();
  }
}
