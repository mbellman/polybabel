import AbstractTranslator from './common/AbstractTranslator';
import AbstractTypeReconciler from './common/AbstractTypeReconciler';
import AbstractValidator from './common/AbstractValidator';
import JavaTranslator from './translators/java/JavaTranslator';
import JavaTypeReconciler from './type-reconcilers/JavaTypeReconciler';
import JavaValidator from './validators/JavaValidator';
import TypeDictionary from './TypeDictionary';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { Language } from '../system/constants';

/**
 * @internal
 */
type CompilerError = [ string, string ];

/**
 * @internal
 */
type CompilerErrorHandler = (file: string, message: string) => void;

export default class Compiler {
  private static translatorMap: IHashMap<IConstructable<AbstractTranslator>> = {
    [Language.JAVA]: JavaTranslator
  };

  private static typeReconcilerMap: IHashMap<IConstructable<AbstractTypeReconciler>> = {
    [Language.JAVA]: JavaTypeReconciler
  };

  private static validatorMap: IHashMap<IConstructable<AbstractValidator>> = {
    [Language.JAVA]: JavaValidator
  };

  private compiledCodeMap: IHashMap<string> = {};
  private errors: CompilerError[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};
  private typeDictionary: TypeDictionary = new TypeDictionary();

  public add (file: string, syntaxTree: ISyntaxTree): void {
    this.syntaxTreeMap[file] = syntaxTree;
    const TypeReconciler = Compiler.typeReconcilerMap[syntaxTree.language];

    if (TypeReconciler) {
      const reconciledTypes = new TypeReconciler().reconcile(syntaxTree);

      this.typeDictionary.addTypes(file, reconciledTypes);
    }
  }

  public addError (file: string, message: string): void {
    this.errors.push([ file, message ]);
  }

  public compileAll (): void {
    Object.keys(this.syntaxTreeMap).forEach(file => {
      this.compileFile(file);
    });
  }

  /**
   * @todo Add validation step
   */
  public compileFile (file: string): void {
    const syntaxTree = this.syntaxTreeMap[file];
    const Translator = Compiler.translatorMap[syntaxTree.language];

    if (syntaxTree && Translator) {
      const translator = new Translator(syntaxTree);
      const translation = translator.getTranslation();

      this.compiledCodeMap[file] = translation;
    } else {
      this.addError(file, 'Unable to compile');
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
}
