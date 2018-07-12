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
type CompilerErrorHandler = (filename: string, message: string, line: number, linePreview?: string) => void;

export default class Compiler {
  private compiledCodeMap: IHashMap<string> = {};
  private entryFile: string;
  private errors: CompilerError[] = [];
  private syntaxTreeMap: IHashMap<ISyntaxTree> = {};
  private symbolDictionary: SymbolDictionary = new SymbolDictionary();

  public add (filename: string, syntaxTree: ISyntaxTree): void {
    if (!syntaxTree) {
      return;
    }

    this.syntaxTreeMap[filename] = syntaxTree;

    const { SymbolResolver, TypeConstraintMap } = LanguageSpecification[syntaxTree.language];

    new SymbolResolver(this.removeExtension(filename), this.symbolDictionary, TypeConstraintMap).resolve(syntaxTree);
  }

  public addError (filename: string, reportedError: IValidatorError): void {
    this.errors.push([ filename, reportedError ]);
  }

  public compileFile (filename: string, shouldIgnoreValidationErrors: boolean = false): void {
    const syntaxTree = this.syntaxTreeMap[filename];

    if (!syntaxTree) {
      return;
    }

    const { Validator, Translator, TypeConstraintMap } = LanguageSpecification[syntaxTree.language];
    const validatorContext = new ValidatorContext(this.removeExtension(filename), this.symbolDictionary, TypeConstraintMap);
    const validator = new Validator(validatorContext, syntaxTree);

    validator.validate();

    if (validator.hasErrors() && !shouldIgnoreValidationErrors) {
      validator.forErrors(reportedError => this.addError(filename, reportedError));
    } else {
      const translation = new Translator(syntaxTree).getTranslation();

      this.compiledCodeMap[filename] = translation;
    }
  }

  public defineEntryFilename (filename: string): void {
    this.entryFile = filename;
  }

  public forEachError (handler: CompilerErrorHandler): void {
    this.errors.forEach(([ filename, { message, token } ]) => {
      const line = token ? token.line : 0;

      const linePreview = token
        ? TokenUtils.createLinePreview(token)
        : '';

      handler(filename, message, line, linePreview);
    });
  }

  public getCompiledCode (filename: string): string {
    return this.compiledCodeMap[filename];
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
    Object.keys(this.syntaxTreeMap).forEach(filename => {
      this.compileFile(filename);
    });
  }

  private removeExtension (filename: string): string {
    return filename.split('.').slice(0, -1).join('.');
  }
}
