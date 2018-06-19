import AbstractParser from '../common/AbstractParser';
import JavaObjectBodyParser from './JavaObjectBodyParser';
import JavaStatementParser from './JavaStatementParser';
import { Allow, Expect } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * Parses Java enums, finishing upon encountering the final
 * closing brace. In a break from convention, enums are parsed
 * as classes, because they are conceptually just a type of
 * class with certain syntactic conditions.
 *
 * @example
 *
 *  enum Constants {
 *    ...
 *  }
 */
export default class JavaEnumParser extends AbstractParser<JavaSyntax.IJavaClass> {
  @Implements protected getDefault (): JavaSyntax.IJavaClass {
    return {
      node: JavaSyntax.JavaSyntaxNode.CLASS,
      access: JavaSyntax.JavaAccessModifier.PACKAGE,
      name: null,
      members: [],
      instanceInitializers: [],
      staticInitializers: []
    };
  }

  @Expect(JavaConstants.Keyword.ENUM)
  protected onEnum (): void {
    this.next();
  }

  @Expect(TokenUtils.isWord)
  protected onName (): void {
    this.parsed.name = this.currentToken.value;
  }

  @Expect('{')
  protected onEnterEnumBody (): void {
    this.next();
  }

  @Allow('}')
  protected onExitEmptyEnum (): void {
    this.finish();
  }

  @Expect(TokenUtils.isWord)
  protected onConstantsList (): void {
    while (!this.isEOF()) {
      this.assertCurrentTokenMatch(TokenUtils.isWord);
      this.parseAndAddEnumConstant();

      if (this.currentTokenMatches('}')) {
        // End of enum body; no additional members declared
        this.finish();

        return;
      } else if (this.currentTokenMatches(',')) {
        this.next();

        continue;
      } else if (this.currentTokenMatches(';')) {
        break;
      } else {
        this.halt();
      }
    }

    this.next();
  }

  @Allow(/./)
  protected onEnumBody (): void {
    const { node, members: additionalMembers, ...body } = this.parseNextWith(JavaObjectBodyParser);

    this.parsed.members = [
      ...this.parsed.members,
      ...additionalMembers
    ];

    Object.assign(this.parsed, body);

    this.stop();
  }

  private createEnumConstantField (name: string, args: JavaSyntax.IJavaStatement[] = []): JavaSyntax.IJavaObjectField {
    return {
      node: JavaSyntax.JavaSyntaxNode.OBJECT_FIELD,
      access: JavaSyntax.JavaAccessModifier.PUBLIC,
      isStatic: true,
      type: this.createEnumConstructorType(),
      name,
      value: this.createEnumInstantiationStatement(args)
    };
  }

  private createEnumConstructorType (): JavaSyntax.IJavaType {
    return {
      node: JavaSyntax.JavaSyntaxNode.TYPE,
      namespaceChain: [ this.parsed.name ],
      genericTypes: [],
      arrayDimensions: 0
    };
  }

  private createEnumInstantiationStatement (args: JavaSyntax.IJavaStatement[] = []): JavaSyntax.IJavaStatement {
    const instantiation: JavaSyntax.IJavaInstantiation = {
      node: JavaSyntax.JavaSyntaxNode.INSTANTIATION,
      constructor: this.createEnumConstructorType(),
      arguments: args
    };

    return {
      node: JavaSyntax.JavaSyntaxNode.STATEMENT,
      leftSide: instantiation
    };
  }

  private parseAndAddEnumConstant (): void {
    const enumConstantName = this.eat(TokenUtils.isWord);
    const isInitializedConstant = this.currentTokenMatches('(');
    let member: JavaSyntax.IJavaObjectField;

    if (isInitializedConstant) {
      this.eat('(');

      const enumConstantArguments = this.parseSequence({
        ValueParser: JavaStatementParser,
        delimiter: ',',
        terminator: ')'
      });

      this.next();

      member = this.createEnumConstantField(enumConstantName, enumConstantArguments);
    } else {
      member = this.createEnumConstantField(enumConstantName);
    }

    this.parsed.members.push(member);
  }
}
