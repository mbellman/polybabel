import AbstractParser from '../common/AbstractParser';
import SyntaxNodeBuilder from '../common/SyntaxNodeBuilder';
import { IToken } from '../../tokenizer/types';
import { JavaSyntax } from './java-syntax';

export default class JavaInterfaceParser extends AbstractParser<JavaSyntax.IJavaInterface> {
  private _currentMemberName: string;
  private _currentMemberParameters: JavaSyntax.IJavaParameter[] = [];
  private _currentMemberType: string;
  private _isAddingMemberParameters: boolean = false;
  private _syntaxNodeBuilder: SyntaxNodeBuilder<JavaSyntax.IJavaInterface> = new SyntaxNodeBuilder(JavaSyntax.JavaSyntaxNodeType.INTERFACE);

  public getParsed (): JavaSyntax.IJavaInterface {
    return this._syntaxNodeBuilder.getSyntaxNode();
  }

  protected handleNumber (token: IToken): void {

  }

  protected handleSymbol ({ value, nextToken }: IToken): void {
    switch (value) {
      case ';':
        this._addMember();
        break;
      case '{':
        break;
      case '}':
        this.finish();
        break;
      case '(':
        if (!this._currentMemberType || !this._currentMemberName) {
          this.haltWithMessage(`Unexpected character '('`);
        }

        this._isAddingMemberParameters = true;

        break;
      case ')':
        if (nextToken.value !== ';') {
          this.haltWithMessage(`Unexpected character ')'`);
        }

        break;
      default:
        this.haltWithMessage(`Unexpected character ${value}`);
        break;
    }
  }

  protected handleWord ({ value, lastToken, nextToken }: IToken): void {
    if (this.isStartOfLine) {
      if (this.isFirstLine) {

      } else {
        this._currentMemberType = value;
        this._currentMemberName = nextToken.value;
        this.currentTokenIndex += 2;
      }
    }
  }

  private _addMember (): void {
    if (this._currentMemberParameters.length > 0) {
      this._addMethod();
    } else {
      this._addField();
    }

    this._currentMemberName = null;
    this._currentMemberType = null;
    this._currentMemberParameters.length = 0;
  }

  private _addField (): void {
    this._syntaxNodeBuilder.add('fields', [{
      nodeType: JavaSyntax.JavaSyntaxNodeType.INTERFACE_FIELD,
      accessModifier: JavaSyntax.JavaAccessModifier.PUBLIC,
      type: this._currentMemberType,
      name: this._currentMemberName
    }]);
  }

  private _addMethod (): void {
    this._syntaxNodeBuilder.add('methods', [{
      nodeType: JavaSyntax.JavaSyntaxNodeType.INTERFACE_METHOD,
      accessModifier: JavaSyntax.JavaAccessModifier.PUBLIC,
      type: this._currentMemberType,
      name: this._currentMemberName,
      parameters: this._currentMemberParameters
    }]);
  }
}
