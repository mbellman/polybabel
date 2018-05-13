import TypeDictionary from './TypeDictionary';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { LanguageSpecification } from '../language-specifications/index';

/**
 * @internal
 */
type CompilerError = [ string, string ];

/**
 * @internal
 */
type CompilerErrorHandler = (file: string, message: string) => void;

export default class Compiler {
  private compiledCodeMap: IHashMap<string> = {};
  private errors: CompilerError[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};
  private typeDictionary: TypeDictionary = new TypeDictionary();

  public add (file: string, syntaxTree: ISyntaxTree): void {
    this.syntaxTreeMap[file] = syntaxTree;

    const { TypeReconciler } = LanguageSpecification[syntaxTree.language];
    const reconciledTypes = new TypeReconciler().reconcile(syntaxTree);

    this.typeDictionary.addTypes(file, reconciledTypes);
  }

  public addError (file: string, message: string): void {
    this.errors.push([ file, message ]);
  }

  /**
   * @todo Add validation step
   */
  public compileFile (file: string): void {
    const syntaxTree = this.syntaxTreeMap[file];

    if (syntaxTree) {
      const { Translator } = LanguageSpecification[syntaxTree.language];

      const translation = new Translator(syntaxTree).getTranslation();

      this.compiledCodeMap[file] = translation;
    } else {
      this.addError(file, 'Missing file');
    }
  }

  public forEachError (handler: CompilerErrorHandler): void {
    this.errors.forEach(([ file, message ]) => {
      handler(file, message);
    });
  }

  public getCompiledCode (file: string): string {
    return this.compiledCodeMap[file];
  }

  public getSyntaxTree (file: string): ISyntaxTree {
    return this.syntaxTreeMap[file];
  }

  public hasErrors (): boolean {
    return this.errors.length > 0;
  }

  public reset (): void {
    this.syntaxTreeMap = {};
    this.compiledCodeMap = {};
    this.errors.length = 0;
  }

  public run (): void {
    Object.keys(this.syntaxTreeMap).forEach(file => {
      this.compileFile(file);
    });
  }
}
