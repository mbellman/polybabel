import ScopeManager from '../ScopeManager';
import { Autowired, IHashMap, Wired } from 'trampoline-framework';
import { INamed, ISyntaxNode, ISyntaxTree } from '../../parser/common/syntax-types';

@Wired
export default abstract class AbstractTranslator<T extends ISyntaxTree = ISyntaxTree> {
  @Autowired()
  protected scopeManager: ScopeManager;

  protected syntaxTree: T;
  private translatedCode: string;
  private errors: string[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree>;

  public constructor (syntaxTreeMap: IHashMap<ISyntaxTree>) {
    this.syntaxTreeMap = syntaxTreeMap;
  }

  public translate (syntaxTree: T): string {
    this.syntaxTree = syntaxTree;

    this.start();

    return '';
  }

  protected emit (code: string): void {
    this.translatedCode += code;
  }

  protected error (message: string): void {
    this.errors.push(message);
  }

  protected abstract start (): void;
}
