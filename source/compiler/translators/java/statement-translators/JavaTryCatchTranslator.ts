import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaTryCatchTranslator extends AbstractTranslator<JavaSyntax.IJavaTryCatch> {
  @Implements protected translate (): void {
    const { tryBlock, catchBlocks, finallyBlock } = this.syntaxNode;

    this.emit('try {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, tryBlock)
      .exitBlock()
      .emit('}');

    if (catchBlocks.length > 0) {
      this.emitCatchBlocks();
    }

    if (finallyBlock) {
      this.emit(' finally {')
        .enterBlock()
        .emitNodeWith(JavaBlockTranslator, finallyBlock)
        .exitBlock()
        .emit('}');
    }
  }

  /**
   * Emits each separate catch block as a series of if-else
   * blocks, using 'instanceof' on the exception instance
   * to map exception types to conditional blocks. JavaScript
   * lacks a spec-standard way of handling multiple catch
   * blocks with different error/exception types in each.
   */
  private emitCatchBlocks (): this {
    const { catchBlocks, exceptionSets, exceptionReferences } = this.syntaxNode;

    // Since it is possible to use different exception reference
    // names for each catch statement, and since the emitted try/
    // catch statement only uses one catch, we need to maintain
    // a reference to the first one so we can alias the alternate
    // names using locally-scoped variables.
    const firstExceptionName = exceptionReferences[0].value;

    return this
      .emit(` catch (${firstExceptionName}) {`)
      .enterBlock()
      // Alias any alternately-named exception references
      .emitNodes(
        exceptionReferences,
        exceptionReference => {
          const exceptionName = exceptionReference.value;
          const hasUniqueExceptionName = exceptionName !== firstExceptionName;

          if (hasUniqueExceptionName) {
            this.emit(`var ${exceptionName} = ${firstExceptionName};`)
              .newline();
          }
        }
      )
      // Emit content of each catch block
      .emitNodes(
        catchBlocks,
        (catchBlock, index) => {
          const exceptions = exceptionSets[index];
          const exceptionName = exceptionReferences[index].value;

          this.emit(index === 0 ? 'if (' : ' else if (')
            // Multiple exception types may have been piped together
            // for use within this catch statement, so we need to emit
            // each instanceof check separated by ||
            .emitNodes(
              exceptions,
              exception => {
                const exceptionTypeName = exception.namespaceChain.join('.');

                this.emit(`${exceptionName} instanceof ${exceptionTypeName}`);
              },
              () => this.emit(' || ')
            )
            .emit(') {')
            .enterBlock()
            .emitNodeWith(JavaBlockTranslator, catchBlock)
            .exitBlock()
            .emit('}');
        }
      )
      .exitBlock()
      .emit('}');
  }
}
