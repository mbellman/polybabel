import ScopeManager from '../ScopeManager';
import { Autowired, IHashMap, Wired } from 'trampoline-framework';
import { INamed, ISyntaxNode, ISyntaxTree } from '../../parser/common/syntax-types';

@Wired
export default abstract class AbstractTranslator<T extends ISyntaxTree = ISyntaxTree> {
  private static readonly INDENTATION_AMOUNT = 2;
  protected currentNode: ISyntaxNode;

  @Autowired()
  protected scopeManager: ScopeManager;

  protected syntaxTree: T;
  protected syntaxTreeMap: IHashMap<ISyntaxTree>;
  private code: string = '';
  private errors: string[] = [];
  private indentationLevel: number = 0;

  public constructor (syntaxTreeMap: IHashMap<ISyntaxTree>) {
    this.syntaxTreeMap = syntaxTreeMap;
  }

  public translate (syntaxTree: T): string {
    this.syntaxTree = syntaxTree;

    this.onStart();

    for (const syntaxNode of syntaxTree.nodes) {
      this.currentNode = syntaxNode;

      this.emitNode();
    }

    return this.code;
  }

  protected emit (code: string): void {
    this.code += code;
  }

  /**
   * @todo @description
   */
  protected abstract emitNode (): void;

  protected enterBlock (): void {
    this.indentationLevel += AbstractTranslator.INDENTATION_AMOUNT;
  }

  protected error (message: string): void {
    this.errors.push(message);
  }

  protected exitBlock (): void {
    this.indentationLevel -= AbstractTranslator.INDENTATION_AMOUNT;
  }

  protected newline (): void {
    this.emit('\n');

    for (let i = 0; i < this.indentationLevel; i++) {
      this.emit(' ');
    }
  }

  /**
   * An optionally overridable handler to run when starting
   * translation, before the node traversal loop begins.
   */
  protected onStart (): void { }
}
