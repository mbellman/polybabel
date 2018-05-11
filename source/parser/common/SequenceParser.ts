import AbstractParser from './AbstractParser';
import { Constructor, Final, Implements, Override } from 'trampoline-framework';
import { ISequence, ISyntaxNode } from './syntax-types';
import { TokenMatch } from './parser-types';

/**
 * @internal
 */
type SyntaxNodeSequence<V extends ISyntaxNode> = ISyntaxNode & ISequence<V>;

/**
 * @internal
 */
interface ISequenceParserConfiguration<V extends ISyntaxNode> {
  ValueParser: Constructor<AbstractParser<V>>;
  delimiter: TokenMatch;
  terminator: TokenMatch;
}

/**
 * Parses a sequence of values using a provided parser
 * subclass, and a specified delimiter/terminator.
 */
export default class SequenceParser<V extends ISyntaxNode> extends AbstractParser<SyntaxNodeSequence<V>> {
  private configuration: ISequenceParserConfiguration<V>;

  public constructor (configuration: ISequenceParserConfiguration<V>) {
    super();

    this.configuration = configuration;
  }

  @Implements protected getDefault (): SyntaxNodeSequence<V> {
    return {
      node: null,
      values: []
    };
  }

  @Override protected onFirstToken (): void {
    const { terminator, ValueParser, delimiter } = this.configuration;

    if (!this.currentTokenMatches(terminator)) {
      while (!this.isEOF()) {
        const nextValue = this.parseNextWith(ValueParser);

        this.parsed.values.push(nextValue);

        if (this.currentTokenMatches(terminator)) {
          break;
        }

        this.assertCurrentTokenMatch(delimiter);
        this.next();
      }
    }

    this.stop();
  }
}
