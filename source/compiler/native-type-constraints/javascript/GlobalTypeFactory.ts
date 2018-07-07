import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { GlobalType, IFunctionTypeTemplate, IObjectTypeTemplate } from './types';
import { IHashMap } from 'trampoline-framework';
import { IObjectMember, ITypeConstraint, ObjectCategory, ObjectMemberVisibility } from '../../symbol-resolvers/common/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { StringTypeTemplate } from './string-type-template';
import { NumberTypeTemplate } from './number-type-template';

export default class GlobalTypeFactory {
  /**
   * A map for original type constraints for native JavaScript types.
   * Original types are used to look up type constraints from 'type'
   * syntax nodes in applicable languages, since type annotations
   * must match originals and not just identifiers with given type
   * constraints.
   *
   * Each original constraint is built during initialization.
   *
   * @see GlobalTypeFactory.initialize()
   */
  public static readonly OriginalConstraints: IHashMap<ITypeConstraint> = {};

  /**
   * A set of non-original type constraints for native JavaScript types,
   * used for parameter, return, or property type constraints when building
   * native type constraints from templates. We need a separate collection
   * for the following reasons:
   *
   *  1. Non-original type constraints are necessary to avoid inappropriate
   *     errors during validation, e.g. a string literal resolving as the
   *     original String type definition rather than an instance of String
   *
   *  2. When building type definitions from templates, defining property,
   *     method parameter, method return, etc. constraints as non-originals
   *     by only providing an object with { typeDefinition } destructured
   *     off the original constraint will not work. For example, some type
   *     constraints have circular relationships, e.g. String.length ->
   *     Number, Number.toString() -> String. Depending on the order of
   *     templates built, certain native type definitions might still be
   *     'null' at build time, making destructuring/property referencing
   *     infeasible. A separate collection of non-original constraints
   *     helps circumvent this problem. Ultimately, the 'typeDefinition'
   *     property on both original and non-original constraints will be
   *     the same, built from a type template and updated by reference.
   *
   * Each non-original constraint is built during initialization.
   *
   * @see GlobalTypeFactory.initialize()
   */
  private static readonly NonOriginalConstraints: IHashMap<ITypeConstraint> = {};

  /**
   * A static SymbolDictionary instance to be supplied to function
   * and object type definer instances. Unlike with conventionally
   * defined type definitions (e.g. those generated for constructs
   * in user programs), this instance won't store types from the
   * compiled program, and won't be used to actually look up any
   * symbols since all native type constraints will have definitions
   * at validation time.
   */
  private static readonly symbolDictionary: SymbolDictionary = new SymbolDictionary();

  private static readonly typeTemplateMap: IHashMap<IObjectTypeTemplate | IFunctionTypeTemplate> = {
    [GlobalType.STRING]: StringTypeTemplate,
    [GlobalType.NUMBER]: NumberTypeTemplate
  };

  /**
   * Builds a lineup of native type constraints from the factory's
   * type template map.
   */
  public static main (): void {
    const globalTypes = Object.keys(GlobalTypeFactory.typeTemplateMap);

    // First, we need to generate placeholder type constraints so
    // native type templates can reference other pending native
    // type constraints
    globalTypes.forEach(globalType => {
      GlobalTypeFactory.OriginalConstraints[globalType] = {
        typeDefinition: null,
        isOriginal: true
      };

      GlobalTypeFactory.NonOriginalConstraints[globalType] = {
        typeDefinition: null
      };
    });

    // Then, we build each native type constraint from its template
    globalTypes.forEach(globalType => {
      const typeTemplate = GlobalTypeFactory.typeTemplateMap[globalType];
      const isFunctionTypeTemplate = !!(typeTemplate as IFunctionTypeTemplate).parameters;

      const typeDefinition = isFunctionTypeTemplate
        ? this.buildFunctionTypeFromTemplate(typeTemplate as IFunctionTypeTemplate)
        : this.buildObjectTypeFromTemplate(typeTemplate as IObjectTypeTemplate);

      GlobalTypeFactory.OriginalConstraints[globalType].typeDefinition = typeDefinition;
      GlobalTypeFactory.NonOriginalConstraints[globalType].typeDefinition = typeDefinition;
    });
  }

  private static buildFunctionTypeFromTemplate (template: IFunctionTypeTemplate): FunctionType.Definition {
    const definer = new FunctionType.Definer(GlobalTypeFactory.symbolDictionary);
    const { parameters, returns } = template;

    parameters.forEach(parameter => {
      definer.addParameterTypeConstraint(GlobalTypeFactory.NonOriginalConstraints[parameter]);
    });

    definer.defineReturnTypeConstraint(GlobalTypeFactory.NonOriginalConstraints[returns]);

    return definer;
  }

  private static buildInitialTypeConstraint (isOriginal: boolean): ITypeConstraint {
    return {
      typeDefinition: null,
      isOriginal
    };
  }

  private static buildObjectTypeFromTemplate (template: IObjectTypeTemplate): ObjectType.Definition {
    const definer = new ObjectType.Definer(GlobalTypeFactory.symbolDictionary);
    const { name, constructors, properties, methods } = template;

    definer.name = name;
    definer.category = ObjectCategory.CLASS;
    definer.isConstructable = true;
    definer.isExtensible = true;
    definer.shouldOverload = false;

    constructors.forEach(constructor => {
      definer.addConstructor({
        name: constructor.name,
        visibility: ObjectMemberVisibility.ALL,
        constraint: {
          typeDefinition: GlobalTypeFactory.buildFunctionTypeFromTemplate(constructor)
        }
      });
    });

    Object.keys(properties).forEach(key => {
      const globalType = properties[key];

      definer.addMember({
        name: key,
        visibility: ObjectMemberVisibility.ALL,
        constraint: GlobalTypeFactory.NonOriginalConstraints[globalType]
      });
    });

    methods.forEach(method => {
      const methodMember: IObjectMember<FunctionType.Constraint> = {
        name: method.name,
        visibility: ObjectMemberVisibility.ALL,
        constraint: {
          typeDefinition: GlobalTypeFactory.buildFunctionTypeFromTemplate(method)
        }
      };

      if (definer.hasMember(method.name)) {
        definer.addMethodOverload(methodMember);
      } else {
        definer.addMember(methodMember);
      }
    });

    return definer;
  }
}

GlobalTypeFactory.main();
