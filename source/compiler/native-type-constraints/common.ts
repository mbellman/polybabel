import SymbolDictionary from '../symbol-resolvers/common/SymbolDictionary';
import { Dynamic, IObjectMember, ITypeConstraint, ObjectCategory, ObjectMemberVisibility, Primitive, Void } from '../symbol-resolvers/common/types';
import { FunctionType } from '../symbol-resolvers/common/function-type';
import { IHashMap } from 'trampoline-framework';
import { ObjectType } from '../symbol-resolvers/common/object-type';
import { TypeUtils } from '../symbol-resolvers/common/type-utils';

/**
 * @todo @description
 *
 * @internal
 */
interface IObjectTypeTemplate {
  name: string;
  constructors: IFunctionTypeTemplate[];
  properties: IHashMap<CommonType>;
  methods: IFunctionTypeTemplate[];
}

/**
 * @todo @description
 *
 * @internal
 */
interface IFunctionTypeTemplate {
  name: string;
  parameters: CommonType[];
  returns: CommonType;
}

const enum CommonType {
  STRING,
  NUMBER,
  ARRAY,
  FUNCTION,
  OBJECT
}

/**
 * @internal
 */
const CommonTypeConstraintMap: IHashMap<ITypeConstraint> = {
  [CommonType.STRING]: {
    typeDefinition: null,
    isOriginal: true
  },
  [CommonType.NUMBER]: {
    typeDefinition: null,
    isOriginal: true
  },
  [CommonType.ARRAY]: {
    typeDefinition: null,
    isOriginal: true
  },
  [CommonType.FUNCTION]: {
    typeDefinition: null,
    isOriginal: true
  },
  [CommonType.OBJECT]: {
    typeDefinition: null,
    isOriginal: true
  }
};

const StringTypeTemplate: IObjectTypeTemplate = {
  name: 'String',
  constructors: [
    {
      name: 'String',
      parameters: [ CommonType.STRING ],
      returns: CommonType.STRING
    }
  ],
  properties: {
    length: CommonType.NUMBER
  },
  methods: [
    {
      name: 'charAt',
      parameters: [ CommonType.NUMBER ],
      returns: CommonType.STRING
    }
  ]
};

const NumberTypeTemplate: IObjectTypeTemplate = {
  name: 'Number',
  constructors: [
    {
      name: 'Number',
      parameters: [ CommonType.NUMBER ],
      returns: CommonType.NUMBER
    }
  ],
  properties: {},
  methods: [
    {
      name: 'toString',
      parameters: [],
      returns: CommonType.STRING
    }
  ]
};

function buildFunctionTypeFromTemplate (template: IFunctionTypeTemplate): FunctionType.Definition {
  const definer = new FunctionType.Definer(new SymbolDictionary());
  const { parameters, returns } = template;

  parameters.forEach(parameter => {
    definer.addParameterTypeConstraint(CommonTypeConstraintMap[parameter]);
  });

  definer.defineReturnTypeConstraint(CommonTypeConstraintMap[returns]);

  return definer;
}

function buildObjectTypeFromTemplate (template: IObjectTypeTemplate): ObjectType.Definition {
  const definer = new ObjectType.Definer(new SymbolDictionary());
  const { name, constructors, properties, methods } = template;

  definer.name = name;
  definer.category = ObjectCategory.CLASS;
  definer.isConstructable = true;
  definer.isExtensible = true;

  constructors.forEach(constructor => {
    definer.addConstructor({
      name: constructor.name,
      visibility: ObjectMemberVisibility.ALL,
      constraint: {
        typeDefinition: buildFunctionTypeFromTemplate(constructor)
      }
    });
  });

  Object.keys(properties).forEach(key => {
    const commonType = properties[key];

    definer.addMember({
      name: key,
      visibility: ObjectMemberVisibility.ALL,
      constraint: CommonTypeConstraintMap[commonType]
    });
  });

  methods.forEach(method => {
    const methodMember: IObjectMember<FunctionType.Constraint> = {
      name: method.name,
      visibility: ObjectMemberVisibility.ALL,
      constraint: {
        typeDefinition: buildFunctionTypeFromTemplate(method)
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

CommonTypeConstraintMap[CommonType.STRING].typeDefinition = buildObjectTypeFromTemplate(StringTypeTemplate);
CommonTypeConstraintMap[CommonType.NUMBER].typeDefinition = buildObjectTypeFromTemplate(NumberTypeTemplate);

export const StringTypeConstraint = CommonTypeConstraintMap[CommonType.STRING];
export const NumberTypeConstraint = CommonTypeConstraintMap[CommonType.NUMBER];

export const BooleanTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Primitive.BOOLEAN),
  isOriginal: true
};

export const ObjectTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Primitive.OBJECT),
  isOriginal: true
};

export const NullTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Primitive.NULL),
  isOriginal: true
};

export const DynamicTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Dynamic),
  isOriginal: true
};

export const VoidTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Void),
  isOriginal: true
};
