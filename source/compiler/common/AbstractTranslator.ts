import { Callback } from '../../system/types';
import { Constructor, IConstructable } from 'trampoline-framework';
import { ISyntaxNode } from '../../parser/common/syntax-types';

export default abstract class AbstractTranslator<N extends ISyntaxNode = ISyntaxNode> {
  private static readonly INDENTATION_AMOUNT = 2;
  protected syntaxNode: N;
  private code: string = '';
  private didEmitWhileTracking: boolean = false;
  private indentation: number = 0;

  /**
   * We deliberately mark the constructor as protected to ensure
   * that subclasses cannot be instantiated without deliberately
   * overriding it. Since the preferred mechanism for recursive
   * translation is via emitNodeWith(), this helps enforce the
   * pattern. Ideally, only the root language translator should
   * override the constructor so it can be instantiated in the
   * main compilation flow.
   *
   * @see emitNodeWith()
   */
  protected constructor (syntaxNode: N) {
    this.syntaxNode = syntaxNode;
  }

  public getTranslation (): string {
    this.translate();

    return this.code;
  }

  protected emit (code: string): this {
    this.code += code;
    this.didEmitWhileTracking = true;

    return this;
  }

  protected emitNodes <T extends ISyntaxNode>(nodes: T[], onNode: (node: T, index: number) => any, onSeparator?: () => void): this {
    nodes.forEach((node, index) => {
      const didEmitCode = onNode(node, index);

      const shouldAddSeparator = (
        // Explicitly check that onNode() did not return
        // a boolean literal false, which indicates that
        // onSeparator() should be skipped on this cycle
        didEmitCode !== false &&
        onSeparator &&
        index < nodes.length - 1
      );

      if (shouldAddSeparator) {
        onSeparator();
      }
    });

    return this;
  }

  protected emitNodeWith <T extends ISyntaxNode, S extends T>(Translator: Constructor<AbstractTranslator<T>>, node: S): this {
    const translator = new (Translator as IConstructable<AbstractTranslator>)(node);

    translator.indentation = this.indentation;

    this.emit(translator.getTranslation());

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

  protected didEmit (): boolean {
    return this.didEmitWhileTracking;
  }

  protected newline (): this {
    this.emit('\n');

    for (let i = 0; i < this.indentation * AbstractTranslator.INDENTATION_AMOUNT; i++) {
      this.emit(' ');
    }

    return this;
  }

  protected newlineIf (condition: boolean): this {
    if (condition) {
      this.newline();
    }

    return this;
  }

  protected newlineIfDidEmit (): this {
    this.newlineIf(this.didEmit());

    return this.trackEmits();
  }

  protected trackEmits (): this {
    this.didEmitWhileTracking = false;

    return this;
  }

  /**
   * @todo @description
   */
  protected abstract translate (): void;
}
