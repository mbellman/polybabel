import AbstractParser from '../common/AbstractParser';
import { Constructor } from '../../system/types';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from './java-syntax';
import { Match } from '../common/parser-decorators';
import { Pattern, TokenMatch } from '../common/parser-types';

/**
 * @internal
 */
interface IJavaSequenceParserConfiguration<T extends JavaSyntax.IJavaSyntaxNode> {
  ValueParser: Constructor<AbstractParser<T>>;
  terminator: TokenMatch;
}

export default class JavaSequenceParser<T extends JavaSyntax.IJavaSyntaxNode> extends AbstractParser<JavaSyntax.IJavaSequence<T>> {
  private terminator: TokenMatch;
  private ValueParser: Constructor<AbstractParser<T>>;

  public constructor ({ ValueParser, terminator }: IJavaSequenceParserConfiguration<T>) {
    super();

    this.ValueParser = ValueParser;
    this.terminator = terminator;
  }

  @Implements protected getDefault (): JavaSyntax.IJavaSequence<T> {
    return {
      node: JavaSyntax.JavaSyntaxNode.SEQUENCE,
      values: []
    };
  }

  @Match(',')
  private onNextValue (): void {
    this.next();
  }

  @Match(Pattern.ANY)
  private onPotentialValue (): void {
    if (this.currentTokenMatches(this.terminator)) {
      this.stop();
    } else {
      const value = this.parseNextWith(this.ValueParser);

      this.parsed.values.push(value as T);
    }
  }
}
