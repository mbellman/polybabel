import SymbolDictionary from './symbol-resolvers/common/SymbolDictionary';
import ValidatorContext from './validators/common/ValidatorContext';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../parser/common/syntax-types';
import { IValidatorError } from './validators/common/types';
import { LanguageSpecification } from '../language-specifications/index';
import { TokenUtils } from '../tokenizer/token-utils';

/**
 * @internal
 */
type CompilerError = [ string, IValidatorError ];

/**
 * @internal
 */
type CompilerErrorHandler = (file: string, message: string, line: number, linePreview?: string) => void;

export default class Compiler {
  private compiledCodeMap: IHashMap<string> = {};
  private entryFile: string;
  private errors: CompilerError[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};
  private symbolDictionary: SymbolDictionary = new SymbolDictionary();

  public add (file: string, syntaxTree: ISyntaxTree): void {
    if (!syntaxTree) {
      return;
    }

    this.syntaxTreeMap[file] = syntaxTree;

    const { SymbolResolver } = LanguageSpecification[syntaxTree.language];

    new SymbolResolver(this.formatFilename(file), this.symbolDictionary).resolve(syntaxTree);
  }

  public addError (file: string, reportedError: IValidatorError): void {
    this.errors.push([ file, reportedError ]);
  }

  public compileFile (file: string): void {
    const syntaxTree = this.syntaxTreeMap[file];

    if (!syntaxTree) {
      return;
    }

    const { Validator, Translator } = LanguageSpecification[syntaxTree.language];
    const validationContext = new ValidatorContext(this.formatFilename(file), this.symbolDictionary);
    const validator = new Validator(validationContext, syntaxTree);

    validator.validate();

    if (validator.hasErrors()) {
      validator.forErrors(reportedError => this.addError(file, reportedError));
    } else {
      const translation = new Translator(syntaxTree).getTranslation();

      this.compiledCodeMap[file] = translation;
    }
  }

  public defineEntryFile (file: string): void {
    this.entryFile = file;
  }

  public forEachError (handler: CompilerErrorHandler): void {
    this.errors.forEach(([ file, { message, token } ]) => {
      const line = token ? token.line : 0;

      const linePreview = token
        ? TokenUtils.createLinePreview(token)
        : '';

      handler(file, message, line, linePreview);
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

  /**
   * @todo @description
   */
  private formatFilename (filename: string): string {
    return filename.split('.').slice(0, -1).join('.');
  }
}
