import AbstractParser from '../common/AbstractParser';
import JavaPropertyChainParser from './JavaPropertyChainParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

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
    this.assert(TokenUtils.isWord(this.currentToken));

    this.parsed.name = this.nextToken.value !== '.'
      // By default, we assume type names are just strings
      ? this.currentToken.value
      // Type names may also be a namespace field; where
      // the name doesn't seem to follow the default
      // pattern we parse it as a property chain
      : this.parseNextWith(JavaPropertyChainParser);

    this.next();
  }

  @Match('[')
  private onArrayStart (): void {
    this.assert(this.nextToken.value === ']');
  }

  @Match(']')
  private onArrayEnd (): void {
    this.assert(this.previousToken.value === '[');

    this.parsed.arrayDimensions++;
  }

  @Match('<')
  private onGenericBlockStart (): void {
    this.assert(
      this.parsed.arrayDimensions === 0,
      `[] type '${this.parsed.name}' cannot be generic`
    );

    this.next();

    if (this.currentTokenMatches('>')) {
      // Diamond notation generic, e.g. List<>
      this.next();
    } else {
      const genericTypesParser = new SequenceParser({
        ValueParser: JavaTypeParser,
        delimiter: ',',
        terminator: '>'
      });

      const { values } = this.parseNextWith(genericTypesParser);

      this.parsed.genericTypes = values;

      if (this.nextToken.value !== '[') {
        this.finish();
      }
    }
  }

  @Match('>')
  private onGenericBlockEnd (): void {
    const hasGenericTypes = this.parsed.genericTypes.length > 0;

    if (this.nextToken.value !== '[' || !hasGenericTypes) {
      // If the type isn't a [], we stop here. If the type
      // doesn't have generic types, we stop without halting
      // since A) this could be a child type parser handling
      // an argument to a generic, and B) if it isn't, and
      // the > was typed improperly, the parent parser will
      // encounter the erroneous token and halt.
      this.stop();
    }
  }

  @Match(/./)
  private onEnd (): void {
    this.stop();
  }
}
