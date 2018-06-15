import { IHashMap } from 'trampoline-framework';
import { TypeDefinition, Primitive, Void } from '../symbol-resolvers/common/types';
import { JavaConstants } from '../../parser/java/java-constants';
import { TypeUtils } from '../symbol-resolvers/common/type-utils';

/**
 * @todo Create proper native types with methods/fields
 */
const STRING_TYPE = TypeUtils.createSimpleType(Primitive.STRING);
const NUMBER_TYPE = TypeUtils.createSimpleType(Primitive.NUMBER);
const BOOLEAN_TYPE = TypeUtils.createSimpleType(Primitive.BOOLEAN);
const OBJECT_TYPE = TypeUtils.createSimpleType(Primitive.OBJECT);

export const JavaNativeTypeMap: IHashMap<TypeDefinition> = {
  [JavaConstants.Type.STRING]: STRING_TYPE,
  [JavaConstants.Type.CHAR]: STRING_TYPE,
  [JavaConstants.Type.INT]: NUMBER_TYPE,
  [JavaConstants.Type.INTEGER]: NUMBER_TYPE,
  [JavaConstants.Type.NUMBER]: NUMBER_TYPE,
  [JavaConstants.Type.FLOAT]: NUMBER_TYPE,
  [JavaConstants.Type.DOUBLE]: NUMBER_TYPE,
  [JavaConstants.Type.LONG]: NUMBER_TYPE,
  [JavaConstants.Type.SHORT]: NUMBER_TYPE,
  [JavaConstants.Type.VOID]: TypeUtils.createSimpleType(Void),
  [JavaConstants.Type.BOOLEAN_UC]: BOOLEAN_TYPE,
  [JavaConstants.Type.BOOLEAN_LC]: BOOLEAN_TYPE,
  [JavaConstants.Type.OBJECT]: OBJECT_TYPE
};
