import * as CodeMirror from 'codemirror';
import Compiler from '../source/compiler/Compiler';
import tokenize from '../source/tokenizer/tokenize';
import { Automated, Autowired, Bound, IHashMap, Run, Wired } from 'trampoline-framework';
import { ISyntaxTree } from '../source/parser/common/syntax-types';
import { js_beautify } from 'js-beautify';
import { Language } from '../source/system/constants';
import { LanguageSpecification } from '../source/language-specifications';

@Wired @Automated class Demo {
  private static readonly EDITOR_CONTENT_LOCALSTORAGE_KEY = 'polybabel-demo-editor-content';
  private static readonly FILE_NAME = 'demo';
  private static readonly RECOMPILATION_DELAY = 400;

  @Autowired()
  private compiler: Compiler;

  private compilationStartTime: number;
  private demoLanguage: string;
  private editor: CodeMirror.EditorFromTextArea;
  private outputBlock: HTMLElement = document.querySelector('.output-block');

  private options: IHashMap<boolean> = {
    showSyntaxTree: false
  };

  private preview: CodeMirror.EditorFromTextArea;
  private recompilationTimer: number;

  @Run() private initialize (): void {
    // Set up editor/preview CodeMirror instances
    const editorTextarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    const previewTextarea = document.querySelector('.preview-textarea') as HTMLTextAreaElement;

    this.editor = CodeMirror.fromTextArea(editorTextarea, {
      indentWithTabs: true,
      mode: 'text/x-java',
      lineNumbers: true,
      smartIndent: true,
      theme: 'eclipse'
    });

    this.preview = CodeMirror.fromTextArea(previewTextarea, {
      mode: 'text/javascript',
      readOnly: 'nocursor'
    });

    this.editor.on('change', this.onChangeEditorContents);

    // Set up option checkbox event listeners
    const options: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.option'), 0);

    options.forEach(option => {
      option.addEventListener('change', this.onChangeOption);
    });

    // Try to load in saved editor content from a previous session
    const savedEditorContent = this.getSavedEditorContent();

    if (savedEditorContent) {
      this.editor.setValue(savedEditorContent);
    }
  }

  @Bound private compile (): void {
    const editorContent = this.editor.getValue();

    if (editorContent.length === 0) {
      this.showOutput('Editor is empty');

      return;
    }

    this.compiler.reset();
    this.saveEditorContent(editorContent);

    let syntaxTree: ISyntaxTree;

    // Compilation
    this.compilationStartTime = Date.now();

    try {
      const { Parser } = LanguageSpecification[Language.JAVA];
      const firstToken = tokenize(editorContent);
      const parser = new Parser();

      try {
        syntaxTree = parser.parse(firstToken);
      } catch (e) { }

      if (parser.hasError()) {
        this.compiler.addError(Demo.FILE_NAME, parser.getError());
      }
    } catch ({ message }) {
      this.compiler.addError(Demo.FILE_NAME, { message });
    }

    this.compiler.add(Demo.FILE_NAME, syntaxTree);
    this.compiler.compileFile(Demo.FILE_NAME);

    // Post-compilation output
    if (this.compiler.hasErrors()) {
      this.showCompilerErrors();
    } else {
      this.outputTotalCompilationTime();

      if (this.options.showSyntaxTree) {
        this.showSyntaxTree(syntaxTree);
      } else {
        const code = this.compiler.getCompiledCode('demo');

        this.preview.setValue(code);
      }
    }
  }

  private getSavedEditorContent (): string {
    return window.localStorage.getItem(Demo.EDITOR_CONTENT_LOCALSTORAGE_KEY);
  }

  private hideErrors (): void {
    this.outputBlock.style.display = 'none';
  }

  @Bound private onChangeEditorContents (): void {
    window.clearTimeout(this.recompilationTimer);

    this.recompilationTimer = window.setTimeout(this.compile, Demo.RECOMPILATION_DELAY);
  }

  @Bound private onChangeOption (e: UIEvent): void {
    const checkbox = e.currentTarget as HTMLInputElement;

    this.options[checkbox.name] = checkbox.checked;

    this.compile();
  }

  private outputTotalCompilationTime (): void {
    this.showOutput(`Compiled in ${Date.now() - this.compilationStartTime}ms`);
  }

  private saveEditorContent (editorContent: string): void {
    window.localStorage.setItem(Demo.EDITOR_CONTENT_LOCALSTORAGE_KEY, editorContent);
  }

  private showCompilerErrors (): void {
    const errors: string[] = [];

    this.compiler.forEachError((file, message, line, linePreview) => {
      errors.push(
        `Compilation Error: ${message}` +
        `${line ? ` (Line ${line}):` : ''}` +
        `${linePreview ? ` --> <b>${linePreview}</b>` : ''}`
      );
    });

    this.showOutput(errors.join('<br />'));
  }

  private showOutput (output: string): void {
    this.outputBlock.innerHTML = output;
  }

  private showSyntaxTree (syntaxTree: ISyntaxTree): void {
    // Token keys on syntax nodes may contain circular
    // references, so we need to ignore these while
    // stringifying the syntax tree
    const tokenKeyFilter = (key: string, value: any) => {
      if (key !== 'token') {
        return value;
      }
    };

    this.preview.setValue(js_beautify(JSON.stringify(syntaxTree, tokenKeyFilter)));
  }
}

const demo = new Demo();
