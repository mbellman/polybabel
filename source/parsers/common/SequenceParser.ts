import AbstractParser from './AbstractParser';
import { Implements, Override, Constructor } from 'trampoline-framework';
import { ISyntaxNode, ISequence } from './syntax-types';
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
  terminator: TokenMatch;
  delimiter: TokenMatch;
}

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
    const { ValueParser, terminator, delimiter } = this.configuration;

    while (true) {
      const nextValue = this.parseNextWith(ValueParser);

      this.parsed.values.push(nextValue);

      if (this.currentTokenMatches(terminator)) {
        break;
      }

      this.assertCurrentTokenMatch(delimiter);
      this.next();
    }

    this.stop();
  }
}
