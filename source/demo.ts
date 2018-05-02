import * as CodeMirror from 'codemirror';
import Compiler from './compiler/Compiler';
import parse from './parser/parse';
import tokenize from './tokenizer/tokenize';
import { Automated, Bound, Run } from 'trampoline-framework';
import { js_beautify } from 'js-beautify';
import { Language } from 'system/constants';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/eclipse.css';

/**
 * @todo
 *
 * Remove CodeMirror from bundle; include
 * globally on the demo page
 */
@Automated class Demo {
  private static RECOMPILATION_DELAY = 500;
  private demoLanguage: string;
  private editor: CodeMirror.EditorFromTextArea;
  private errorBlock: HTMLElement;
  private preview: CodeMirror.EditorFromTextArea;
  private recompilationTimer: number;

  public constructor () {
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
      mode: 'text/javascript'
    });

    this.errorBlock = document.querySelector('.error-block');
  }

  @Run() private initialize (): void {
    this.editor.on('change', this.onChangeEditorContents);
  }

  @Bound private onChangeEditorContents (): void {
    window.clearTimeout(this.recompilationTimer);

    this.recompilationTimer = window.setTimeout(this.compile, Demo.RECOMPILATION_DELAY);
  }

  @Bound private compile (): void {
    const editorContent = this.editor.getValue();

    this.errorBlock.innerHTML = '';

    try {
      const firstToken = tokenize(editorContent);
      const syntaxTree = parse(firstToken, Language.JAVA);
      const compiler = new Compiler();

      compiler.add('demo.java', syntaxTree);
      compiler.compileFile('demo.java');

      const code = compiler.getCompiledFile('demo.java');

      this.preview.setValue(code);
      this.preview.refresh();
    } catch (e) {
      this.errorBlock.innerHTML = `Error: ${e.message}`;
    }
  }
}

const demo = new Demo();
