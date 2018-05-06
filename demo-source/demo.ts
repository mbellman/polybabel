import * as CodeMirror from 'codemirror';
import Compiler from '../source/compiler/Compiler';
import parse from '../source/parser/parse';
import tokenize from '../source/tokenizer/tokenize';
import { Automated, Bound, IHashMap, Run } from 'trampoline-framework';
import { ISyntaxTree } from '../source/parser/common/syntax-types';
import { js_beautify } from 'js-beautify';
import { Language } from '../source/system/constants';

@Automated class Demo {
  private static readonly EDITOR_CONTENT_LOCALSTORAGE_KEY = 'polybabel-demo-editor-content';
  private static readonly RECOMPILATION_DELAY = 400;
  private compilationStartTime: number;
  private demoLanguage: string;
  private editor: CodeMirror.EditorFromTextArea;
  private outputBlock: HTMLElement = document.querySelector('.output-block');

  private options: IHashMap<boolean> = {
    syntaxTree: false
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
      readOnly: true
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

    this.saveEditorContent(editorContent);

    try {
      this.compilationStartTime = Date.now();

      const firstToken = tokenize(editorContent);
      const syntaxTree = parse(firstToken, Language.JAVA);

      if (this.options.syntaxTree) {
        this.outputTotalCompilationTime();
        this.preview.setValue(js_beautify(JSON.stringify(syntaxTree)));
      } else {
        this.translateSyntaxTree(syntaxTree);
      }
    } catch (e) {
      this.showOutput(`Error: ${e.message}`);
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

  private showOutput (output: string): void {
    this.outputBlock.innerHTML = output;
  }

  private translateSyntaxTree (syntaxTree: ISyntaxTree): void {
    const compiler = new Compiler();

    compiler.add('demo', syntaxTree);
    compiler.compileFile('demo');

    const errors = compiler.getErrors();

    if (errors.length > 0) {
      this.showOutput(errors.join('<br />'));
    } else {
      this.outputTotalCompilationTime();

      const code = compiler.getCompiledFile('demo');

      this.preview.setValue(code);
    }
  }
}

const demo = new Demo();
