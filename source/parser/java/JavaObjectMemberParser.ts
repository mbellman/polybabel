import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaEnumParser from './JavaEnumParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import JavaStatementParser from './JavaStatementParser';
import JavaTypeParser from './JavaTypeParser';
import { Allow, Match } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { ISyntaxNode, ITyped, INamed } from '../common/syntax-types';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { JavaUtils } from './java-utils';
import JavaVariableDeclarationParser from './statement-parsers/JavaVariableDeclarationParser';

/**
 * @internal
 */
type PartialMember = Partial<JavaSyntax.JavaObjectMember>;

/**
 * @todo @description
 */
export default class JavaObjectMemberParser extends AbstractParser<ISyntaxNode & PartialMember> {
  @Implements protected getDefault (): ISyntaxNode & PartialMember {
    return {
      node: null
    };
  }

  @Allow(JavaConstants.Modifiers)
  protected onModifier (): void {
    const modifiable = this.parseNextWith(JavaModifiableParser);

    this.updateMember(modifiable);
  }

  @Allow(JavaConstants.Keyword.CLASS)
  protected onNestedClass (): void {
    const classNode = this.parseNextWith(JavaClassParser);

    this.updateNestedObjectMember(classNode);
    this.stop();
  }

  @Allow(JavaConstants.Keyword.INTERFACE)
  protected onNestedInterface (): void {
    const interfaceNode = this.parseNextWith(JavaInterfaceParser);

    this.updateNestedObjectMember(interfaceNode);
    this.stop();
  }

  @Allow(JavaConstants.Keyword.ENUM)
  protected onNestedEnum (): void {
    const enumNode = this.parseNextWith(JavaEnumParser);

    this.updateNestedObjectMember(enumNode);
    this.stop();
  }

  @Allow('<')
  protected onGenericTypes (): void {
    this.assert(!this.currentMemberIsTypedAndNamed());
    this.next();

    const genericTypes = this.parseSequence({
      ValueParser: JavaTypeParser,
      delimiter: ',',
      terminator: '>'
    });

    this.updateMember({ genericTypes });
    this.next();
  }

  @Allow(JavaUtils.isPropertyChain)
  @Allow(JavaUtils.isType)
  protected onNonObjectMember (): void {
    const { type, name } = this.parseNextWith(JavaVariableDeclarationParser);

    this.updateMember({ type, name });
    this.assertCurrentTokenMatch(/[=(;]/);
  }

  /**
   * Fields lack their own parser class since by the time
   * we can determine that we're parsing a field, indicated
   * by an assignment operator, all we have left to parse
   * is its right-side statement value.
   */
  @Allow('=')
  protected onFieldAssignment (): void {
    const hasGenericTypes = !!(this.parsed as JavaSyntax.IJavaObjectMethod).genericTypes;

    this.assert(
      this.currentMemberIsTypedAndNamed() &&
      !hasGenericTypes
    );

    this.next();

    const node = JavaSyntax.JavaSyntaxNode.OBJECT_FIELD;
    const value = this.parseNextWith(JavaStatementParser);

    this.updateMember({ node, value });
    this.finish();
  }

  @Allow(';')
  protected onFieldOrAbstractMethodEnd (): void {
    this.assert(this.currentMemberIsTypedAndNamed());

    const isAbstractMethod = this.parsed.node === JavaSyntax.JavaSyntaxNode.OBJECT_METHOD;

    if (!isAbstractMethod) {
      // Normally we can't verify that we're parsing a
      // field until we encounter a = token, but if fields
      // are merely declared and not assigned, we have
      // to set the member node manually
      this.parsed.node = JavaSyntax.JavaSyntaxNode.OBJECT_FIELD;
    }

    const { value } = this.parsed as JavaSyntax.IJavaObjectField;

    this.finish();
  }

  @Allow('(')
  protected onMethodDefinition (): void {
    this.assert(this.currentMemberIsTypedAndNamed());

    const { node, parameters, throws, block } = this.parseNextWith(JavaObjectMethodParser);

    this.updateMember({ node, parameters, throws, block });
    this.stop();
  }

  private currentMemberIsTypedAndNamed (): boolean {
    const { type, name } = this.parsed as ITyped & INamed;

    return !!type && !!name;
  }

  private updateMember (partialMember: PartialMember): void {
    Object.assign(this.parsed, partialMember);
  }

  private updateNestedObjectMember (nestedObject: JavaSyntax.IJavaObject): void {
    const { access, ...objectNode } = nestedObject;

    this.updateMember(objectNode);
  }
}
