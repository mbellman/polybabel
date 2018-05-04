import { Callback } from '../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { ISyntaxNode } from '../../parser/common/syntax-types';

export default abstract class AbstractTranslator<N extends ISyntaxNode = ISyntaxNode> {
  private static readonly INDENTATION_AMOUNT = 2;
  protected syntaxNode: N;
  private code: string = '';
  private indentation: number = 0;

  protected constructor (syntaxNode: N) {
    this.syntaxNode = syntaxNode;
  }

  public getTranslation (): string {
    this.translate();

    return this.code;
  }

  protected emit (code: string): this {
    this.code += code;

    return this;
  }

  protected emitNodeSequence <T extends ISyntaxNode>(nodes: T[], onNode: Callback<T>, onSeparator?: () => void): this {
    nodes.forEach((node, index) => {
      onNode(node);

      if (onSeparator && index < nodes.length - 1) {
        onSeparator();
      }
    });

    return this;
  }

  protected emitNodeWith <T extends ISyntaxNode, S extends T>(Translator: Constructor<AbstractTranslator<T>>, node: S): this {
    const translator = new (Translator as IConstructable<AbstractTranslator>)(node);

    translator.indentation = this.indentation;

    this.code += translator.getTranslation();

    return this;
  }

  protected enterBlock (): this {
    this.indentation++;

    return this.newline();
  }

  protected exitBlock (): this {
    this.indentation--;

    return this.newline();
  }

  protected newline (): this {
    this.emit('\n');

    for (let i = 0; i < this.indentation * AbstractTranslator.INDENTATION_AMOUNT; i++) {
      this.emit(' ');
    }

    return this;
  }

  /**
   * @todo @description
   */
  protected abstract translate (): void;
}