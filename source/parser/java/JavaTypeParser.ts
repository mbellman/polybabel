import AbstractParser from '../common/AbstractParser';
import JavaPropertyChainParser from './statement-parsers/JavaPropertyChainParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';
import { ParserUtils } from '../common/parser-utils';

/**
 * Parses type declarations and stops when a token other
 * than a word, [, ], <, or > is encountered.
 *
 * @example Types:
 *
 *  Type
 *  Type[]
 *  Type<...>
 *  Type<...>[]
 *  Namespaced...Type
 *  Namespaced...Type[]
 *  Namespaced...Type<...>
 *  Namespaced...Type<...>[]
 */
export default class JavaTypeParser extends AbstractParser<JavaSyntax.IJavaType> {
  @Implements protected getDefault (): JavaSyntax.IJavaType {
    return {
      node: JavaSyntax.JavaSyntaxNode.TYPE,
      namespaceChain: [],
      genericTypes: [],
      arrayDimensions: 0
    };
  }

  @Override protected onFirstToken (): void {
    this.assert(TokenUtils.isWord(this.currentToken));

    const isNamespacedType = (
      ParserUtils.tokenMatches(this.nextToken, '.') &&
      TokenUtils.isWord(this.nextToken.nextToken)
    );

    if (isNamespacedType) {
      // Note: this is one of two places where namespaced types
      // can be parsed. When parsing statements, a namespaced
      // type will appear to, and be parsed as a property chain
      // before an actual type is found at the end of the chain.
      //
      // See: statement-parsers/JavaPropertyChainParser
      while (!this.isEOF()) {
        if (this.currentTokenMatches(TokenUtils.isWord)) {
          this.parsed.namespaceChain.push(this.currentToken.value);

          if (!ParserUtils.tokenMatches(this.nextToken, '.')) {
            // End of namespace chain
            break;
          }
        } else if (this.currentTokenMatches('.')) {
          this.assert(TokenUtils.isWord(this.nextToken));
        }

        this.next();
      }
    } else {
      this.parsed.namespaceChain.push(this.currentToken.value);
    }

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
      `[] type '${this.parsed.namespaceChain.slice(-1).pop()}' cannot be generic`
    );

    this.assert(this.parsed.genericTypes.length === 0);
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
