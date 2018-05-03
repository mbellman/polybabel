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

  public getTranslatedCode (): string {
    this.translate();

    return this.code;
  }

  protected emit (code: string): this {
    this.code += code;

    return this;
  }

  protected emitNodeWith (node: ISyntaxNode, Translator: Constructor<AbstractTranslator>): this {
    const translator = new (Translator as IConstructable<AbstractTranslator>)(node);

    translator.indentation = this.indentation;

    this.code += translator.getTranslatedCode();

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
