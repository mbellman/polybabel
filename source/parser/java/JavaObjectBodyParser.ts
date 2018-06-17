import AbstractParser from '../common/AbstractParser';
import JavaAnnotationParser from './JavaAnnotationParser';
import JavaBlockParser from './JavaBlockParser';
import JavaClassParser from './JavaClassParser';
import JavaEnumParser from './JavaEnumParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
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
  private currentMemberAccessModifier: JavaSyntax.JavaAccessModifier = JavaSyntax.JavaAccessModifier.PUBLIC;
  private currentMemberAnnotations: JavaSyntax.IJavaAnnotation[] = [];

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
    const annotation = this.parseNextWith(JavaAnnotationParser);

    this.currentMemberAnnotations.push(annotation);
  }

  @Match(JavaConstants.AccessModifiers)
  protected onAccessModifier (): void {
    this.currentMemberAccessModifier = JavaConstants.AccessModifierMap[this.currentToken.value];
  }

  @Match(JavaUtils.isConstructor)
  protected onConstructor (): void {
    const access = this.currentMemberAccessModifier;
    const name = this.eat(TokenUtils.isWord);
    const method = this.parseNextWith(JavaObjectMethodParser);

    this.assert(method.block !== null);

    this.parsed.constructors.push({
      ...method,
      isConstructor: true,
      access,
      name
    });

    this.resetCurrentMember();
  }

  @Match(JavaUtils.isInitializer)
  protected onInitializerBlock (): void {
    this.assert(
      this.currentMemberAnnotations.length === 0,
      'Initializer blocks cannot have annotations'
    );

    const isStaticInitializer = this.currentTokenMatches(JavaConstants.Keyword.STATIC);

    if (isStaticInitializer) {
      this.next();
    }

    const block = this.parseNextWith(JavaBlockParser);

    if (isStaticInitializer) {
      this.parsed.staticInitializers.push(block);
    } else {
      this.parsed.instanceInitializers.push(block);
    }
  }

  @Match(/./)
  protected onMember (): void {
    const member = this.parseNextWith(JavaObjectMemberParser) as JavaSyntax.JavaObjectMember;
    const annotations = this.currentMemberAnnotations;
    const access = this.currentMemberAccessModifier;

    this.parsed.members.push({
      ...member,
      access,
      annotations
    });

    this.resetCurrentMember();
  }

  @Match('}')
  protected onExit (): void {
    this.finish();
  }

  private resetCurrentMember (): void {
    this.currentMemberAccessModifier = null;
    this.currentMemberAnnotations.length = 0;
  }
}
