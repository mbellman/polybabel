import SymbolDictionary from './symbol-resolvers/common/SymbolDictionary';
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
  private entryFile: string;
  private errors: CompilerError[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};
  private symbolDictionary: SymbolDictionary = new SymbolDictionary();

  public add (file: string, syntaxTree: ISyntaxTree): void {
    this.syntaxTreeMap[file] = syntaxTree;

    const { SymbolResolver } = LanguageSpecification[syntaxTree.language];

    new SymbolResolver(this.symbolDictionary).resolve(syntaxTree);
  }

  public addError (file: string, message: string): void {
    this.errors.push([ file, message ]);
  }

  public compileFile (file: string): void {
    const syntaxTree = this.syntaxTreeMap[file];

    if (syntaxTree) {
      const { Validator, Translator } = LanguageSpecification[syntaxTree.language];
      const validator = new Validator(this.symbolDictionary);

      validator.validate(syntaxTree);

      if (validator.hasErrors()) {
        validator.forErrors(error => this.addError(file, error));
      } else {
        const translation = new Translator(syntaxTree).getTranslation();

        this.compiledCodeMap[file] = translation;
      }
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
    this.symbolDictionary = new SymbolDictionary();
  }

  public run (): void {
    Object.keys(this.syntaxTreeMap).forEach(file => {
      this.compileFile(file);
    });
  }
}
