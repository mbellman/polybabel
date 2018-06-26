import { ITypeConstraint, Primitive, Void, Dynamic } from '../symbol-resolvers/common/types';
import { TypeUtils } from '../symbol-resolvers/common/type-utils';

export const StringTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Primitive.STRING),
  isOriginal: true
};

export const NumberTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Primitive.NUMBER),
  isOriginal: true
};

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
