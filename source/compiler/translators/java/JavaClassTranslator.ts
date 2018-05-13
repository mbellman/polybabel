import AbstractTranslator from '../../common/AbstractTranslator';
import JavaInterfaceTranslator from './JavaInterfaceTranslator';
import JavaObjectMethodTranslator from './JavaObjectMethodTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Constructor, Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

/**
 * @internal
 */
interface IMemberMap {
  fields: JavaSyntax.IJavaObjectField[];
  methods: JavaSyntax.IJavaObjectMethod[];
  classes: JavaSyntax.IJavaClass[];
  interfaces: JavaSyntax.IJavaInterface[];
  enums: JavaSyntax.IJavaEnum[];
}

/**
 * @internal
 */
interface IPartitionedMemberMap {
  constructors: JavaSyntax.IJavaObjectMethod[];
  instanceMembers: IMemberMap;
  staticMembers: IMemberMap;
}

export default class JavaClassTranslator extends AbstractTranslator<JavaSyntax.IJavaClass> {
  private memberMap: IPartitionedMemberMap = {
    constructors: [],
    instanceMembers: {
      fields: [],
      methods: [],
      classes: [],
      interfaces: [],
      enums: []
    },
    staticMembers: {
      fields: [],
      methods: [],
      classes: [],
      interfaces: [],
      enums: []
    }
  };

  @Implements protected translate (): void {
    this.buildMemberMap();

    const { name, extended } = this.syntaxNode;

    this.emit(`class ${name} `);

    if (this.hasSuperclass()) {
      const superclassName = extended[0].namespaceChain.join('.');

      this.emit(`extends ${superclassName} `);
    }

    this.emitInstanceSide()
      .emitStaticSide();
  }

  private addMember (member: JavaSyntax.JavaObjectMember): void {
    const memberSideMap = this.getMemberSideMap(member);

    switch (member.node) {
      case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
        memberSideMap.fields.push(member as JavaSyntax.IJavaObjectField);
        break;
      case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
        memberSideMap.methods.push(member as JavaSyntax.IJavaObjectMethod);
        break;
      case JavaSyntax.JavaSyntaxNode.CLASS:
        memberSideMap.classes.push(member as JavaSyntax.IJavaClass);
        break;
      case JavaSyntax.JavaSyntaxNode.INTERFACE:
        memberSideMap.interfaces.push(member as JavaSyntax.IJavaInterface);
        break;
      case JavaSyntax.JavaSyntaxNode.ENUM:
        memberSideMap.enums.push(member as JavaSyntax.IJavaEnum);
        break;
    }
  }

  private buildMemberMap (): void {
    const { members } = this.syntaxNode;

    members.forEach(member => {
      this.addMember(member);
    });
  }

  private emitConstructor (): this {
    const { instanceMembers } = this.memberMap;
    const { fields, classes, interfaces, enums } = instanceMembers;
    const hasFields = fields.length > 0;
    const hasClasses = classes.length > 0;
    const hasInterfaces = interfaces.length > 0;
    const hasEnums = enums.length > 0;

    this.emit('constructor () {')
      .enterBlock();

    if (this.hasSuperclass()) {
      this.emit('super();')
        .newline();
    }

    this.emitNodes(
      fields,
      field => {
        if (JavaTranslatorUtils.isEmptyObjectMember(field)) {
          return false;
        }

        this.emitField(field, true);
      },
      () => this.newline()
    ).newlineIf(hasClasses)
      .emitObjectsWith(JavaClassTranslator, classes, true)
      .newlineIf(hasInterfaces)
      .emitObjectsWith(JavaInterfaceTranslator, interfaces, true)
      .exitBlock()
      .emit('}');

    return this;
  }

  private emitField (field: JavaSyntax.IJavaObjectField, isInstanceSide: boolean): this {
    const { name: className } = this.syntaxNode;
    const { name, value } = field;

    if (isInstanceSide) {
      this.emitInstanceMemberKey(name);
    } else {
      this.emitStaticMemberKey(name);
    }

    return this.emitNodeWith(JavaStatementTranslator, value)
      .emit(';');
  }

  private emitInstanceMemberKey (name: string): this {
    return this.emit(`this.${name} = `);
  }

  private emitInstanceMethods (): this {
    const { methods } = this.memberMap.instanceMembers;

    return this.emitNodes(
      methods,
      method => {
        if (method.block === null) {
          return false;
        }

        this.emitNodeWith(JavaObjectMethodTranslator, method);
      },
      () => this.newline()
    );
  }

  private emitInstanceSide (): this {
    const hasNonMethodInstanceMembers = this.hasNonMethodInstanceMembers();
    const hasInstanceMethods = this.memberMap.instanceMembers.methods.length > 0;

    this.emit('{')
      .enterBlock();

    if (hasNonMethodInstanceMembers) {
      this.emitConstructor();
    }

    if (hasInstanceMethods) {
      this.newlineIf(hasNonMethodInstanceMembers)
        .emitInstanceMethods();
    }

    return this.exitBlock()
      .emit('}');
  }

  private emitNestedObjectWith <O extends JavaSyntax.IJavaObject>(Translator: Constructor<AbstractTranslator<O>>, object: O): this {
    return this.emit('(function () {')
      .enterBlock()
      .emit('return ')
      .emitNodeWith(Translator, object)
      .exitBlock()
      .emit('})();');
  }

  private emitObjectsWith <O extends JavaSyntax.IJavaObject>(Translator: Constructor<AbstractTranslator<O>>, objects: O[], isInstanceSide: boolean): this {
    return this.emitNodes(
      objects,
      object => {
        const { name } = object;

        if (isInstanceSide) {
          this.emitInstanceMemberKey(name);
        } else {
          this.emitStaticMemberKey(name);
        }

        this.emitNestedObjectWith(Translator, object);
      },
      () => this.newline()
    );
  }

  private emitStaticMemberKey (name: string): this {
    const { name: className } = this.syntaxNode;

    return this.emit(`${className}.${name} = `);
  }

  private emitStaticSide (): this {
    const { fields, methods, classes, interfaces, enums } = this.memberMap.staticMembers;
    const hasStaticMethods = methods.length > 0;
    const hasClasses = classes.length > 0;
    const hasInterfaces = interfaces.length > 0;
    const hasEnums = enums.length > 0;

    if (this.hasStaticMembers()) {
      this.newlineIf(fields.length > 0)
        .emitNodes(
            fields,
            field => {
              if (JavaTranslatorUtils.isEmptyObjectMember(field)) {
                return false;
              }

              this.emitField(field, false);
            },
            () => this.newline()
        )
        .newlineIf(hasStaticMethods)
        .emitNodes(
          methods,
          method => {
            if (method.block === null) {
              return false;
            }

            this.emitStaticMemberKey(method.name)
              .emit('function ')
              .emitNodeWith(JavaObjectMethodTranslator, method)
              .emit(';');
          },
          () => this.newline()
        )
        .newlineIf(hasClasses)
        .emitObjectsWith(JavaClassTranslator, classes, false)
        .newlineIf(hasInterfaces)
        .emitObjectsWith(JavaInterfaceTranslator, interfaces, false);
    }

    return this;
  }

  private getMemberSideKey (member: JavaSyntax.JavaObjectMember): keyof IPartitionedMemberMap {
    return member.isStatic ? 'staticMembers' : 'instanceMembers';
  }

  private getMemberSideMap (member: JavaSyntax.JavaObjectMember): IMemberMap {
    const memberSideKey = this.getMemberSideKey(member);

    return this.memberMap[memberSideKey] as IMemberMap;
  }

  private hasNonMethodInstanceMembers (): boolean {
    const { instanceMembers } = this.memberMap;
    const { fields, classes, interfaces, enums } = instanceMembers;

    return (
      fields.length > 0 ||
      classes.length > 0 ||
      interfaces.length > 0 ||
      enums.length > 0
    );
  }

  private hasStaticMembers (): boolean {
    const { fields, methods, classes, interfaces, enums } = this.memberMap.staticMembers;

    return (
      fields.length > 0 ||
      methods.length > 0 ||
      classes.length > 0 ||
      interfaces.length > 0 ||
      enums.length > 0
    );
  }

  private hasSuperclass (): boolean {
    return this.syntaxNode.extended.length > 0;
  }
}
