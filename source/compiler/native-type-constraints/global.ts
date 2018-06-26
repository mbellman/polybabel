import { DynamicTypeConstraint } from './common';
import { IHashMap } from 'trampoline-framework';
import { ITypeConstraint } from '../symbol-resolvers/common/types';

/**
 * Contains type constraints for JavaScript-native globals accessible
 * within all languages.
 */
export const GlobalTypeConstraintMap: IHashMap<ITypeConstraint> = {
  console: DynamicTypeConstraint,
  document: DynamicTypeConstraint,
  global: DynamicTypeConstraint,
  window: DynamicTypeConstraint
};
