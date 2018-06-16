import { Dynamic, TypeDefinition } from '../symbol-resolvers/common/types';
import { IHashMap } from 'trampoline-framework';
import { TypeUtils } from '../symbol-resolvers/common/type-utils';

const DYNAMIC_TYPE = TypeUtils.createSimpleType(Dynamic);

/**
 * Contains definitions for JavaScript-native types accessible
 * within all languages.
 */
export const GlobalNativeTypeMap: IHashMap<TypeDefinition> = {
  console: DYNAMIC_TYPE,
  document: DYNAMIC_TYPE,
  global: DYNAMIC_TYPE,
  window: DYNAMIC_TYPE
};
