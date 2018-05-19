import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
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
  initializers: JavaSyntax.IJavaBlock[];
  fields: JavaSyntax.IJavaObjectField[];
  methods: JavaSyntax.IJavaObjectMethod[];
  classes: JavaSyntax.IJavaClass[];
  interfaces: JavaSyntax.IJavaInterface[];
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
  private partitionedMemberMap: IPartitionedMemberMap = {
    constructors: [],
    instanceMembers: {
      initializers: [],
      fields: [],
      methods: [],
      classes: [],
      interfaces: []
    },
    staticMembers: {
      initializers: [],
      fields: [],
      methods: [],
      classes: [],
      interfaces: []
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

  private addMemberToMap (member: JavaSyntax.JavaObjectMember): void {
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
      default:
        throw new Error(`Unable to translate class '${this.syntaxNode.name}' member '${member.name}'`);
    }
  }

  private buildMemberMap (): void {
    const { members, constructors, instanceInitializers, staticInitializers } = this.syntaxNode;

    members.forEach(member => {
      this.addMemberToMap(member);
    });

    this.partitionedMemberMap.constructors = constructors || [];
    this.partitionedMemberMap.instanceMembers.initializers = instanceInitializers;
    this.partitionedMemberMap.staticMembers.initializers = staticInitializers;
  }

  private emitDefinedConstructors (): this {
    const { constructors } = this.partitionedMemberMap;

    return this.emitNodes(
      constructors,
      (constructor, index) => {
        const transformedName = `${constructor.name}_${index}`;

        this.emitNodeWith(JavaObjectMethodTranslator, {
          ...constructor,
          name: transformedName
        });
      },
      () => this.newline()
    );
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

  private emitInitializers (initializers: JavaSyntax.IJavaBlock[]): this {
    return this.emitNodes(
      initializers,
      initializer => {
        this.emitNodeWith(JavaBlockTranslator, initializer);
      },
      () => this.newline()
    );
  }

  private emitInstanceMethods (): this {
    const { methods } = this.partitionedMemberMap.instanceMembers;

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
    const hasDefinedConstructors = this.partitionedMemberMap.constructors.length > 0;
    const shouldEmitJSConstructor = hasNonMethodInstanceMembers || hasDefinedConstructors;
    const hasInstanceMethods = this.partitionedMemberMap.instanceMembers.methods.length > 0;

    this.emit('{')
      .enterBlock();

    if (shouldEmitJSConstructor) {
      this.emitJSConstructor();
    }

    if (hasDefinedConstructors) {
      this.newlineIf(shouldEmitJSConstructor)
        .emitDefinedConstructors();
    }

    if (hasInstanceMethods) {
      this.newlineIf(shouldEmitJSConstructor)
        .emitInstanceMethods();
    }

    return this.exitBlock()
      .emit('}');
  }

  private emitJSConstructor (): this {
    const { instanceMembers, constructors } = this.partitionedMemberMap;
    const { fields, classes, interfaces, initializers } = instanceMembers;
    const hasClasses = classes.length > 0;
    const hasInterfaces = interfaces.length > 0;

    this.emit('constructor (overloadIndex, ...args) {')
      .enterBlock();

    if (this.hasSuperclass()) {
      this.emit('super();')
        .newline();
    }

    this.trackEmits()
      .emitNodes(
        fields,
        field => {
          if (JavaTranslatorUtils.isEmptyObjectMember(field)) {
            return false;
          }

          this.emitField(field, true);
        },
        () => this.newline()
      )
      .newlineIfDidEmit()
      .emitObjectsWith(JavaClassTranslator, classes, true)
      .newlineIfDidEmit()
      .emitObjectsWith(JavaInterfaceTranslator, interfaces, true)
      .newlineIfDidEmit()
      .emitInitializers(initializers);

    if (constructors.length > 0) {
      this.newlineIfDidEmit()
        .emit('switch (overloadIndex) {')
        .enterBlock()
        .emitNodes(
          constructors,
          ({ name }, index) => {
            const transformedName = `${name}_${index}`;

            this.emit(`case ${index}:`)
              .enterBlock()
              .emit(`this.${transformedName}.apply(this, args);`)
              .newline()
              .emit('break;')
              .exitBlock();
          }
        )
        .exitBlock()
        .emit('}');
    }

    this.exitBlock()
      .emit('}');

    return this;
  }

  private emitNestedObjectWith <O extends JavaSyntax.IJavaObject>(Translator: Constructor<AbstractTranslator<O>>, object: O): this {
    return this.emit('(function(){')
      .enterBlock()
      .emitNodeWith(Translator, object)
      .newline()
      .emit(`return ${object.name};`)
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
    const { fields, methods, classes, interfaces, initializers } = this.partitionedMemberMap.staticMembers;
    const hasInitializers = initializers.length > 0;
    const hasStaticMethods = methods.length > 0;
    const hasClasses = classes.length > 0;
    const hasInterfaces = interfaces.length > 0;

    if (this.hasStaticMembers()) {
      this.newlineIf(fields.length > 0)
        .trackEmits()
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
        .newlineIfDidEmit()
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
        .newlineIfDidEmit()
        .emitObjectsWith(JavaClassTranslator, classes, false)
        .newlineIfDidEmit()
        .emitObjectsWith(JavaInterfaceTranslator, interfaces, false);
    }

    if (hasInitializers) {
      this.newline()
        .emit(`(function(){`)
        .enterBlock()
        .emitInitializers(initializers)
        .exitBlock()
        .emit('})();');
    }

    return this;
  }

  private getMemberSideKey (member: JavaSyntax.JavaObjectMember): keyof IPartitionedMemberMap {
    return member.isStatic ? 'staticMembers' : 'instanceMembers';
  }

  private getMemberSideMap (member: JavaSyntax.JavaObjectMember): IMemberMap {
    const memberSideKey = this.getMemberSideKey(member);

    return this.partitionedMemberMap[memberSideKey] as IMemberMap;
  }

  private hasNonMethodInstanceMembers (): boolean {
    const { instanceMembers } = this.partitionedMemberMap;
    const { fields, classes, interfaces, initializers } = instanceMembers;

    return (
      fields.length > 0 ||
      classes.length > 0 ||
      interfaces.length > 0 ||
      initializers.length > 0
    );
  }

  private hasStaticMembers (): boolean {
    const { fields, methods, classes, interfaces } = this.partitionedMemberMap.staticMembers;

    return (
      fields.length > 0 ||
      methods.length > 0 ||
      classes.length > 0 ||
      interfaces.length > 0
    );
  }

  private hasSuperclass (): boolean {
    const { extended } = this.syntaxNode;

    return extended && extended.length > 0;
  }
}
