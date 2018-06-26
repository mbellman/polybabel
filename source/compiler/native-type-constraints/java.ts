import { BooleanTypeConstraint, NumberTypeConstraint, ObjectTypeConstraint, StringTypeConstraint, VoidTypeConstraint } from './common';
import { IHashMap } from 'trampoline-framework';
import { ITypeConstraint } from '../symbol-resolvers/common/types';
import { JavaConstants } from '../../parser/java/java-constants';

export const JavaTypeConstraintMap: IHashMap<ITypeConstraint> = {
  [JavaConstants.Type.STRING]: StringTypeConstraint,
  [JavaConstants.Type.CHAR]: StringTypeConstraint,
  [JavaConstants.Type.INT]: NumberTypeConstraint,
  [JavaConstants.Type.INTEGER]: NumberTypeConstraint,
  [JavaConstants.Type.NUMBER]: NumberTypeConstraint,
  [JavaConstants.Type.FLOAT]: NumberTypeConstraint,
  [JavaConstants.Type.DOUBLE]: NumberTypeConstraint,
  [JavaConstants.Type.LONG]: NumberTypeConstraint,
  [JavaConstants.Type.SHORT]: NumberTypeConstraint,
  [JavaConstants.Type.VOID]: VoidTypeConstraint,
  [JavaConstants.Type.BOOLEAN_UC]: BooleanTypeConstraint,
  [JavaConstants.Type.BOOLEAN_LC]: BooleanTypeConstraint,
  [JavaConstants.Type.OBJECT]: ObjectTypeConstraint
};
