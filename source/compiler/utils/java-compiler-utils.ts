import { JavaConstants } from '../../parser/java/java-constants';
import { Primitive, TypeDefinition, Void } from '../symbol-resolvers/common/types';
import { TypeUtils } from '../symbol-resolvers/common/type-utils';

export namespace JavaCompilerUtils {
  /**
   * Returns a type definition for native Java type names,
   * or null if the provided type name doesn't correspond
   * to any.
   */
  export function getNativeTypeDefinition (typeName: string): TypeDefinition {
    switch (typeName) {
      case JavaConstants.Type.STRING:
      case JavaConstants.Type.CHAR:
        return TypeUtils.createSimpleType(Primitive.STRING);
      case JavaConstants.Type.INT:
      case JavaConstants.Type.INTEGER:
      case JavaConstants.Type.NUMBER:
      case JavaConstants.Type.FLOAT:
      case JavaConstants.Type.DOUBLE:
      case JavaConstants.Type.LONG:
      case JavaConstants.Type.SHORT:
        return TypeUtils.createSimpleType(Primitive.NUMBER);
      case JavaConstants.Type.VOID:
        return TypeUtils.createSimpleType(Void);
      case JavaConstants.Type.BOOLEAN_UC:
      case JavaConstants.Type.BOOLEAN_LC:
        return TypeUtils.createSimpleType(Primitive.BOOLEAN);
      case JavaConstants.Type.OBJECT:
        return TypeUtils.createSimpleType(Primitive.OBJECT);
      default:
        return null;
    }
  }
}
