import AbstractTranslator from './common/AbstractTranslator';
import AbstractTypeReconciler from './common/AbstractTypeReconciler';
import AbstractValidator from './common/AbstractValidator';
import JavaTranslator from './translators/java/JavaTranslator';
import JavaTypeReconciler from './type-reconcilers/JavaTypeReconciler';
import JavaValidator from './validators/JavaValidator';
import TypeDictionary from './TypeDictionary';
import { Autowired, IConstructable, IHashMap, Wired } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { Language } from '../system/constants';

@Wired
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

  private compiledFileMap: IHashMap<string> = {};
  private errors: string[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};

  @Autowired()
  private typeDictionary: TypeDictionary;

  public add (file: string, syntaxTree: ISyntaxTree): void {
    this.syntaxTreeMap[file] = syntaxTree;
    const TypeReconciler = Compiler.typeReconcilerMap[syntaxTree.language];

    if (TypeReconciler) {
      const reconciledTypes = new TypeReconciler().reconcile(syntaxTree);

      this.typeDictionary.addTypes(file, reconciledTypes);
    }
  }

  public compileAll (): void {
    Object.keys(this.syntaxTreeMap).forEach(file => {
      this.compileFile(file);
    });
  }

  public compileFile (file: string): void {
    const syntaxTree = this.syntaxTreeMap[file];
    const Translator = Compiler.translatorMap[syntaxTree.language];

    if (Translator) {
      const translator = new Translator(syntaxTree);
      const translatedCode = translator.getTranslatedCode();

      this.compiledFileMap[file] = translatedCode;
    }
  }

  public getCompiledFile (file: string): string {
    return this.compiledFileMap[file];
  }
}
