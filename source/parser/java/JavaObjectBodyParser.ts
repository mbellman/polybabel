import AbstractParser from '../common/AbstractParser';
import JavaAnnotationParser from './JavaAnnotationParser';
import JavaBlockParser from './JavaBlockParser';
import JavaObjectMemberParser from './JavaObjectMemberParser';
import JavaObjectMethodParser from './JavaObjectMethodParser';
import { Implements } from 'trampoline-framework';
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
    const constructorNameToken = this.currentToken;
    const access = this.currentMemberAccessModifier;
    const name = this.eat(TokenUtils.isWord);
    const type = this.createConstructorType(name);
    const method = this.parseNextWith(JavaObjectMethodParser);

    // Since constructor type nodes are synthetic, we have to provide
    // them with a manually created token range to facilitate proper
    // validation-time token range focus as method validation focuses
    // type node token ranges by default
    type.tokenRange = {
      start: constructorNameToken,
      end: constructorNameToken
    };

    this.assert(method.block !== null);

    this.parsed.constructors.push({
      ...method,
      access,
      type,
      name,
      isConstructor: true
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

  private createConstructorType (name: string): JavaSyntax.IJavaType {
    return {
      node: JavaSyntax.JavaSyntaxNode.TYPE,
      namespaceChain: [ name ],
      genericTypes: [],
      arrayDimensions: 0
    };
  }

  private resetCurrentMember (): void {
    this.currentMemberAccessModifier = null;
    this.currentMemberAnnotations.length = 0;
  }
}
