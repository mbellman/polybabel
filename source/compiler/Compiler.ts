import AbstractTranslator from './translators/AbstractTranslator';
import JavaTranslator from './translators/JavaTranslator';
import { IConstructable, IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { Language } from 'system/constants';

export default class Compiler {
  private static translatorMap: IHashMap<IConstructable<AbstractTranslator>> = {
    [Language.JAVA]: JavaTranslator
  };

  private compiledFileMap: IHashMap<string> = {};
  private errors: string[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};

  public add (file: string, syntaxTree: ISyntaxTree): void {
    this.syntaxTreeMap[file] = syntaxTree;
  }

  public compileAll (): void {

  }

  public compileFile (file: string): void {
    const syntaxTree = this.syntaxTreeMap[file];
    const Translator = Compiler.translatorMap[syntaxTree.language];

    if (Translator) {
      const translator = new Translator(this.syntaxTreeMap);
      const translatedCode = translator.translate(this.syntaxTreeMap[file]);

      this.compiledFileMap[file] = '';
    }
  }

  public getCompiledFile (file: string): string {
    return this.compiledFileMap[file];
  }
}
