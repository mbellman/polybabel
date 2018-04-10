import { AbstractBlockParser, ISymbolParser, IWordParser, Matcher } from '../common/parsers';
import { IToken } from '../../tokenizer/types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { isAccessModifierKeyword } from './java-utils';

export default class JavaInterfaceParser extends AbstractBlockParser<JavaSyntax.IJavaInterface> implements ISymbolParser, IWordParser {
  public readonly symbols: Matcher[] = [
    [';', this._onMemberDeclarationEnd],
    ['{', this.onBlockEnter],
    ['}', this.onBlockExit],
    ['(', () => {
      if (this._isAddingMember()) {
        this._isAddingMemberParameters = true;
      } else {
        this.halt();
      }
    }],
    [')', () => {
      if (!this._isAddingMemberParameters || this.currentToken.nextToken.value !== ';') {
        this.halt();
      }
    }],
    [',', () => {
      if (this._isAddingMemberParameters) {
        this.skip(1);
        this._onParameterDeclaration();
      }
    }]
  ];

  public readonly words: Matcher[] = [
    [
      [
        JavaConstants.Keyword.INTERFACE,
        JavaConstants.Keyword.PUBLIC,
        JavaConstants.Keyword.PROTECTED,
        JavaConstants.Keyword.PRIVATE
      ], () => {
        if (this.isFirstToken) {
          this._onFirstToken();
        } else {
          this.halt('keyword');
        }
      }
    ],
    [/./, () => {
      if (!this.isFirstToken && this.isStartOfLine) {
        this._onMemberDeclarationStart();
      } else if (this._isAddingMemberParameters) {
        this._onParameterDeclaration();
      } else {
        this.halt('word');
      }
    }]
  ];

  private _incomingMemberName: string;
  private _incomingMemberParameters: JavaSyntax.IJavaParameter[] = [];
  private _incomingMemberType: string;
  private _isAddingMemberParameters: boolean = false;

  protected getDefault (): JavaSyntax.IJavaInterface {
    return {
      nodeType: JavaSyntax.JavaSyntaxNodeType.INTERFACE,
      accessModifier: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      fields: [],
      methods: []
    };
  }

  private _addField (): void {
    this.parsed.fields.push({
      nodeType: JavaSyntax.JavaSyntaxNodeType.INTERFACE_FIELD,
      accessModifier: JavaSyntax.JavaAccessModifier.PUBLIC,
      type: this._incomingMemberType,
      name: this._incomingMemberName
    });
  }

  private _addMethod (): void {
    this.parsed.methods.push({
      nodeType: JavaSyntax.JavaSyntaxNodeType.INTERFACE_METHOD,
      accessModifier: JavaSyntax.JavaAccessModifier.PUBLIC,
      type: this._incomingMemberType,
      name: this._incomingMemberName,
      parameters: [ ...this._incomingMemberParameters ]
    });
  }

  private _isAddingMember (): boolean {
    return !!(this._incomingMemberName && this._incomingMemberType);
  }

  private _onFirstToken (): void {
    const { value, nextToken } = this.currentToken;
    const isAccessModifier = isAccessModifierKeyword(value);

    const interfaceName = isAccessModifier
      ? nextToken.nextToken.value
      : nextToken.value;

    this.parsed.name = interfaceName;

    this.skip(isAccessModifier ? 2 : 1);
  }

  private _onMemberDeclarationEnd (): void {
    if (!this._isAddingMember()) {
      this.halt();
    }

    if (this._incomingMemberParameters.length > 0) {
      this._addMethod();
    } else {
      this._addField();
    }

    this._incomingMemberName = null;
    this._incomingMemberType = null;
    this._incomingMemberParameters.length = 0;
    this._isAddingMemberParameters = false;
  }

  private _onMemberDeclarationStart (): void {
    const { value, nextToken } = this.currentToken;

    this._incomingMemberType = value;
    this._incomingMemberName = nextToken.value;

    this.skip(1);
  }

  private _onParameterDeclaration (): void {
    const { lastToken, value, nextToken } = this.currentToken;

    if (lastToken.value !== '(' && lastToken.value !== ',') {
      this.halt('parameter');
    }

    this._incomingMemberParameters.push({
      nodeType: JavaSyntax.JavaSyntaxNodeType.PARAMETER,
      type: value,
      name: nextToken.value
    });

    this.skip(1);
  }
}
