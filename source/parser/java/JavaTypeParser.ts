import AbstractParser from '../common/AbstractParser';
import SequenceParser from '../common/SequenceParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Match, Allow, Eat } from '../common/parser-decorators';
import { ParserUtils } from '../common/parser-utils';
import { TokenUtils } from '../../tokenizer/token-utils';

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

  @Eat(TokenUtils.isWord)
  protected onTypeName (): void {
    const isNamespacedType = (
      ParserUtils.tokenMatches(this.nextToken, '.') &&
      TokenUtils.isWord(this.nextToken.nextToken)
    );

    if (isNamespacedType) {
      this.parseNamespacedType();
    } else {
      this.parsed.namespaceChain.push(this.currentToken.value);
    }

    this.next();
  }

  @Allow('<')
  private onGenericBlockStart (): void {
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

  @Allow('>')
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

  @Match('[')
  private onOpenBracket (): void {
    const isArrayType = this.nextToken.value === ']';
    const isArrayAllocation = TokenUtils.isNumber(this.nextToken);

    if (isArrayType) {
      this.next();
    } else if (isArrayAllocation) {
      // This type may have been parsed in the context of an
      // array allocation instantiation statement, in which
      // case we stop here and let JavaInstantiationParser
      // handle the rest. If a number is errantly typed after
      // an open bracket in any other context, the parent parser
      // will halt, as no other Java parsers which parse types
      // have a contingency for types of this form.
      this.stop();
    } else {
      this.halt();
    }
  }

  @Match(']')
  private onCloseBracket (): void {
    this.assert(this.previousToken.value === '[');

    this.parsed.arrayDimensions++;
  }

  @Match(/./)
  private onEnd (): void {
    this.stop();
  }

  /**
   * Note: this is one of two places where namespaced types
   * can be parsed. When parsing statements, a namespaced
   * type will appear to, and be, parsed as a property chain
   * before an actual type is found at the end of the chain.
   *
   * See: statement-parsers/JavaPropertyChainParser
   */
  private parseNamespacedType (): void {
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
  }
}
