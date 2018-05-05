import AbstractParser from '../common/AbstractParser';
import JavaClassParser from './JavaClassParser';
import JavaImportParser from './JavaImportParser';
import JavaInterfaceParser from './JavaInterfaceParser';
import JavaModifiableParser from './JavaModifiableParser';
import JavaPackageParser from './JavaPackageParser';
import { Eat, Match } from '../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from './java-constants';
import { JavaSyntax } from './java-syntax';
import { Language } from '../../system/constants';

/**
 * Parses an entire Java file, generating a syntax tree from
 * the contained code.
 */
export default class JavaParser extends AbstractParser<JavaSyntax.IJavaSyntaxTree> {
  /**
   * Tracks the current modifiable state of an incoming
   * object syntax node, enabling modifiers to be parsed
   * prior to determining what specific object parser to
   * use, thus circumventing the need for lookaheads.
   */
  private currentObjectModifiable: JavaSyntax.IJavaModifiable;

  public constructor () {
    super();
  }

  @Implements protected getDefault (): JavaSyntax.IJavaSyntaxTree {
    return {
      language: Language.JAVA,
      node: JavaSyntax.JavaSyntaxNode.TREE,
      package: null,
      nodes: []
    };
  }

  @Eat(JavaConstants.Keyword.PACKAGE)
  protected onPackage (): void {
    this.parsed.package = this.parseNextWith(JavaPackageParser);
  }

  @Match(JavaConstants.Keyword.IMPORT)
  protected onImport (): void {
    const javaImport = this.parseNextWith(JavaImportParser);

    this.parsed.nodes.push(javaImport);
  }

  @Match([
    ...JavaConstants.AccessModifiers,
    ...JavaConstants.Modifiers
  ])
  protected onModifier (): void {
    this.currentObjectModifiable = this.parseNextWith(JavaModifiableParser);
  }

  @Match(JavaConstants.Keyword.INTERFACE)
  protected onInterface (): void {
    const javaInterface = this.parseNextWith(JavaInterfaceParser);

    this.addJavaObjectNode(javaInterface);
  }

  @Match(JavaConstants.Keyword.CLASS)
  protected onClass (): void {
    const javaClass = this.parseNextWith(JavaClassParser);

    this.addJavaObjectNode(javaClass);
  }

  /**
   * Adds a newly-parsed Java object to the syntax tree's
   * nodes list, merging the current modifiable attributes
   * onto the object if they exist.
   */
  private addJavaObjectNode (object: JavaSyntax.IJavaObject): void {
    if (this.currentObjectModifiable) {
      const { access, isFinal, isAbstract, isStatic } = this.currentObjectModifiable;

      object = {
        ...object,
        access,
        isFinal,
        isStatic,
        isAbstract
      };
    }

    this.parsed.nodes.push(object);

    this.currentObjectModifiable = null;
  }
}
