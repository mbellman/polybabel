import TypeDictionary from './TypeDictionary';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { LanguageSpecification } from '../language-specifications/index';
import { TypeResolution } from './common/compiler-types';

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
  private entryFile: string;
  private errors: CompilerError[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};
  private typeDictionary: TypeDictionary = new TypeDictionary();

  public add (file: string, syntaxTree: ISyntaxTree): void {
    this.syntaxTreeMap[file] = syntaxTree;
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

  public defineEntryFile (file: string): void {
    this.entryFile = file;
  }

  public forEachError (handler: CompilerErrorHandler): void {
    this.errors.forEach(([ file, message ]) => {
      handler(file, message);
    });
  }

  public getCompiledCode (file: string): string {
    return this.compiledCodeMap[file];
  }

  public hasErrors (): boolean {
    return this.errors.length > 0;
  }

  public reset (): void {
    this.syntaxTreeMap = {};
    this.compiledCodeMap = {};
    this.errors.length = 0;
    this.typeDictionary = new TypeDictionary();
  }

  public run (): void {
    // this.buildTypeDictionary();

    Object.keys(this.syntaxTreeMap).forEach(file => {
      this.compileFile(file);
    });
  }

  /**
   * @todo @description
   */
  private buildTypeDictionary (): void {
    const loadResolvedTypeMap = (file: string): TypeResolution.ResolvedTypeMap => {
      let resolvedTypeMap: TypeResolution.ResolvedTypeMap;

      resolvedTypeMap = this.typeDictionary.getResolvedTypeMap(file);

      if (resolvedTypeMap) {
        return resolvedTypeMap;
      } else {
        const syntaxTree = this.syntaxTreeMap[file];
        const { TypeResolver } = LanguageSpecification[syntaxTree.language];
        const resolvedTypes = new TypeResolver(loadResolvedTypeMap).resolve(syntaxTree);

        this.typeDictionary.addResolvedTypes(file, resolvedTypes);

        return this.typeDictionary.getResolvedTypeMap(file);
      }
    };

    loadResolvedTypeMap(this.entryFile);
  }
}
