import AbstractParser from '../common/AbstractParser';
import JavaAnnotationParser from './JavaAnnotationParser';
import JavaBlockParser from './JavaBlockParser';
import JavaClassParser from './JavaClassParser';
import JavaEnumParser from './JavaEnumParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import JavaStatementParser from './JavaStatementParser';
import JavaTypeParser from './JavaTypeParser';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';
import { Implements } from 'trampoline-framework';
import { INamed, ITyped } from '../common/syntax-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import { Match } from '../common/parser-decorators';
import { TokenUtils } from '../../tokenizer/token-utils';

/**
 * @todo @description
 */
export default class JavaObjectBodyParser extends AbstractParser<JavaSyntax.IJavaObjectBody> {
  private currentAnnotations: JavaSyntax.IJavaAnnotation[] = [];

  /**
   * @todo @description
   */
  private currentMember: Partial<JavaSyntax.JavaObjectMember> = null;

  @Implements protected getDefault (): JavaSyntax.IJavaObjectBody {
    return {
      node: null,
      constructors: [],
      members: [],
      instanceInitializers: [],
      staticInitializers: []
    };
  }

  @Match('@')
  protected onAnnotation (): void {
    this.assert(!this.currentMemberIsTypedAndNamed());

    const annotation = this.parseNextWith(JavaAnnotationParser);

    this.currentAnnotations.push(annotation);
  }

  @Match([
    ...JavaConstants.AccessModifiers,
    ...JavaConstants.Modifiers
  ])
  protected onModifier (): void {
    const modifiable = this.parseNextWith(JavaModifiableParser);

    this.updateCurrentMember(modifiable);
  }

  @Match(JavaUtils.isConstructor)
  protected onConstructor (): void {
    let access: JavaSyntax.JavaAccessModifier = JavaSyntax.JavaAccessModifier.PUBLIC;

    if (this.currentMember !== null) {
      const { genericTypes } = this.currentMember as JavaSyntax.IJavaObjectMethod;
      const { isFinal, isStatic, isAbstract } = this.currentMember;

      this.assert(
        !genericTypes,
        'Constructors cannot be generic'
      );

      this.assert(
        !isFinal && !isStatic && !isAbstract,
        'Constructors cannot be final, static, or abstract'
      );

      access = this.currentMember.access;
    }

    const name = this.eat(TokenUtils.isWord);
    const method = this.parseNextWith(JavaObjectMethodParser);

    this.parsed.constructors.push({
      ...method,
      access,
      name
    });
  }

  @Match('<')
  protected onGenericTypes (): void {
    this.assert(!this.currentMemberIsTypedAndNamed());
    this.next();

    const genericTypes = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '>'
    });

    this.updateCurrentMember({ genericTypes });
    this.next();
  }

  @Match(JavaUtils.isPropertyChain)
  @Match(JavaUtils.isType)
  protected onNonObjectMember (): void {
    const { type, name } = this.parseNextWith(JavaVariableDeclarationParser);

    this.updateCurrentMember({ type, name });
    this.assertCurrentTokenMatch(/[=(;]/);
  }

  /**
   * Fields lack their own parser class since by the time
   * we can determine that we're parsing a field, indicated
   * by an assignment operator, all we have left to parse
   * is its right-side statement value.
   */
  @Match('=')
  protected onFieldAssignment (): void {
    const hasGenericTypes = !!(this.currentMember as JavaSyntax.IJavaObjectMethod).genericTypes;

    this.assert(
      this.currentMemberIsTypedAndNamed() &&
      !hasGenericTypes
    );

    this.next();

    const node = JavaSyntax.JavaSyntaxNode.OBJECT_FIELD;
    const value = this.parseNextWith(JavaStatementParser);

    this.updateCurrentMember({ node, value });
    this.addCurrentMember();
    this.next();
  }

  @Match(';')
  protected onFieldOrAbstractMethodEnd (): void {
    this.assert(this.currentMemberIsTypedAndNamed());

    if (this.currentMember.node === null) {
      this.currentMember.node = JavaSyntax.JavaSyntaxNode.OBJECT_FIELD;
    }

    const { value } = this.currentMember as JavaSyntax.IJavaObjectField;

    if (!value) {
      this.addCurrentMember();
    }

    this.next();
  }

  @Match('(')
  protected onMethodDefinition (): void {
    this.assert(this.currentMemberIsTypedAndNamed());

    const { node, parameters, throws, block } = this.parseNextWith(JavaObjectMethodParser);

    this.updateCurrentMember({ node, parameters, throws, block });
    this.addCurrentMember();
  }

  @Match(JavaConstants.Keyword.CLASS)
  protected onNestedClass (): void {
    const { access, isAbstract, isFinal, isStatic, ...classNode } = this.parseNextWith(JavaClassParser);

    this.updateCurrentMember(classNode);
    this.addCurrentMember();
  }

  @Match(JavaConstants.Keyword.INTERFACE)
  protected onNestedInterface (): void {
    const { node, extended, name, members } = this.parseNextWith(JavaInterfaceParser);

    this.updateCurrentMember({ node, extended, name, members });
    this.addCurrentMember();
  }

  @Match(JavaConstants.Keyword.ENUM)
  protected onNestedEnum (): void {
    const { node, name, members } = this.parseNextWith(JavaEnumParser);

    this.updateCurrentMember({ node, name, members });
    this.addCurrentMember();
  }

  @Match('{')
  protected onInitializerBlock (): void {
    const block = this.parseNextWith(JavaBlockParser);

    const isStaticInitializer = !!this.currentMember
      ? this.currentMember.isStatic
      : false;

    if (isStaticInitializer) {
      this.parsed.staticInitializers.push(block);
    } else {
      this.parsed.instanceInitializers.push(block);
    }

    this.currentMember = null;
  }

  @Match('}')
  protected onExit (): void {
    this.finish();
  }

  private addCurrentMember (): void {
    if (this.currentAnnotations.length > 0) {
      this.currentMember.annotations = this.currentAnnotations;
      this.currentAnnotations = [];
    }

    if (!this.currentMember.access) {
      this.currentMember.access = JavaSyntax.JavaAccessModifier.PUBLIC;
    }

    this.parsed.members.push(this.currentMember as JavaSyntax.JavaObjectMember);

    this.currentMember = null;
  }

  private currentMemberIsTypedAndNamed (): boolean {
    if (this.currentMember === null) {
      return false;
    }

    const { type, name } = this.currentMember as ITyped & INamed;

    return !!type && !!name;
  }

  private updateCurrentMember (partialMember: Partial<JavaSyntax.JavaObjectMember>): void {
    this.currentMember = Object.assign({}, this.currentMember, partialMember);
  }
}
