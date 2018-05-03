import ScopeManager from '../ScopeManager';
import TypeDictionary from '../TypeDictionary';
import { Autowired, IHashMap, Wired } from 'trampoline-framework';
import { ISyntaxNode, ISyntaxTree } from 'parser/common/syntax-types';

@Wired
export default abstract class AbstractValidator<S extends ISyntaxNode = ISyntaxNode> {
  @Autowired()
  protected scopeManager: ScopeManager;

  protected currentNode: ISyntaxNode;
  protected syntaxTreeMap: IHashMap<ISyntaxTree>;
  protected typeDictionary: TypeDictionary;
  private errors: string[];

  public constructor (syntaxTreeMap: IHashMap<ISyntaxTree>, typeDictionary: TypeDictionary) {
    this.syntaxTreeMap = syntaxTreeMap;
    this.typeDictionary = typeDictionary;
  }

  public getErrors (): string[] {
    return this.errors;
  }

  public getSyntaxTree (file: string): ISyntaxTree {
    return this.syntaxTreeMap[file];
  }

  public abstract validate (): void;

  protected error (message: string): void {
    this.errors.push(message);
  }
}
