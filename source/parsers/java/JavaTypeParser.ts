import AbstractParser from '../common/AbstractParser';
import SequenceParser from '../common/SequenceParser';
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
      name: null,
      genericTypes: [],
      arrayDimensions: 0
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

    this.parsed.arrayDimensions++;
  }

  /**
   * TODO: Diamond notation generics (List<>)
   */
  @Match('<')
  private onOpenAngleBracket (): void {
    this.assert(
      this.parsed.arrayDimensions === 0,
      `[] type '${this.parsed.name}' cannot be generic`
    );

    this.next();

    const genericTypesParser = new SequenceParser({
      ValueParser: JavaTypeParser,
      terminator: '>',
      delimiter: ','
    });

    const { values } = this.parseNextWith(genericTypesParser);

    this.parsed.genericTypes = values;

    if (this.nextToken.value !== '[') {
      this.finish();
    }
  }

  @Match('>')
  private onCloseAngleBracket (): void {
    const hasGenericTypes = this.parsed.genericTypes.length > 0;

    if (this.nextToken.value !== '[' || !hasGenericTypes) {
      this.stop();
    }
  }

  @Match(Pattern.ANY)
  private onEnd (): void {
    this.stop();
  }
}
