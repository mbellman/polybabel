import ScopeManager from '../ScopeManager';
import TypeDictionary from '../TypeDictionary';
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
  protected typeDictionary: TypeDictionary;
  private code: string = '';
  private errors: string[] = [];
  private indentationLevel: number = 0;

  public constructor (syntaxTreeMap: IHashMap<ISyntaxTree>, typeDictionary: TypeDictionary) {
    this.syntaxTreeMap = syntaxTreeMap;
    this.typeDictionary = typeDictionary;
  }

  public translate (syntaxTree: T): string {
    this.syntaxTree = syntaxTree;

    this.scopeManager.enterScope();
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
    this.scopeManager.enterScope();

    this.indentationLevel += AbstractTranslator.INDENTATION_AMOUNT;
  }

  protected error (message: string): void {
    this.errors.push(message);
  }

  protected leaveBlock (): void {
    this.scopeManager.leaveScope();

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
