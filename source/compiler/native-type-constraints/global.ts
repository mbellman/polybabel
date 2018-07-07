import GlobalTypeFactory from './javascript/GlobalTypeFactory';
import { GlobalType } from './javascript/types';
import { IHashMap } from 'trampoline-framework';
import { ITypeConstraint, Primitive, Void, Dynamic } from '../symbol-resolvers/common/types';
import { TypeUtils } from '../symbol-resolvers/common/type-utils';

export const DynamicTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Dynamic),
  isOriginal: true
};

export const NullTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Primitive.NULL),
  isOriginal: true
};

export const VoidTypeConstraint: ITypeConstraint = {
  typeDefinition: TypeUtils.createSimpleType(Void),
  isOriginal: true
};

/**
 * Contains type constraints for JavaScript-native globals accessible
 * within all languages. We omit a type annotation to facilitate type
 * inference and automatic code completion.
 */
export const GlobalTypeConstraintMap = {
  console: DynamicTypeConstraint,
  document: DynamicTypeConstraint,
  global: DynamicTypeConstraint,
  window: DynamicTypeConstraint,
  String: GlobalTypeFactory.OriginalConstraints[GlobalType.STRING],
  Number: GlobalTypeFactory.OriginalConstraints[GlobalType.NUMBER],
  Boolean: {
    typeDefinition: TypeUtils.createSimpleType(Primitive.BOOLEAN),
    isOriginal: true
  },
  Array: {
    typeDefinition: TypeUtils.createSimpleType(Primitive.ARRAY),
    isOriginal: true
  },
  Object: {
    typeDefinition: TypeUtils.createSimpleType(Primitive.OBJECT),
    isOriginal: true
  }
};
