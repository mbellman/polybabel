import { GlobalTypeConstraintMap, VoidTypeConstraint } from './global';
import { IHashMap } from 'trampoline-framework';
import { ITypeConstraint } from '../symbol-resolvers/common/types';
import { JavaConstants } from '../../parser/java/java-constants';

export const JavaTypeConstraintMap: IHashMap<ITypeConstraint> = {
  [JavaConstants.Type.STRING]: GlobalTypeConstraintMap.String,
  [JavaConstants.Type.CHAR]: GlobalTypeConstraintMap.String,
  [JavaConstants.Type.INT]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.INTEGER]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.NUMBER]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.FLOAT]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.DOUBLE]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.LONG]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.SHORT]: GlobalTypeConstraintMap.Number,
  [JavaConstants.Type.VOID]: VoidTypeConstraint,
  [JavaConstants.Type.BOOLEAN_UC]: GlobalTypeConstraintMap.Boolean,
  [JavaConstants.Type.BOOLEAN_LC]: GlobalTypeConstraintMap.Boolean,
  [JavaConstants.Type.OBJECT]: GlobalTypeConstraintMap.Object
};
