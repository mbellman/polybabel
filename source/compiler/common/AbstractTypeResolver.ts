import TypeDictionary from '../TypeDictionary';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../../parser/common/syntax-types';
import { TypeResolution } from '../common/compiler-types';

/**
 * @todo @description
 */
export default abstract class AbstractTypeResolver {
  protected typeDictionary: TypeDictionary;

  public constructor (typeDictionary: TypeDictionary) {
    this.typeDictionary = typeDictionary;
  }

  public abstract resolve (file: string, syntaxTree: ISyntaxTree): TypeResolution.ResolvedType[];

  /**
   * Sets the type of a key on a resolving type definition either
   * immmediately by dictionary lookup, or by subscribing to the
   * type's future resolution and definition. Since complex type
   * definitions may, during resolution, specify keyed types not
   * yet resolved, we need to have a contingency for retroactively
   * setting the type once it is resolved later.
   *
   * In this context, 'keyed' types refer to those defined within
   * non-primitives. These can include object member types, function
   * parameter or return types, etc. Using a key on the resolving
   * type, we can update the keyed type by reference later on.
   */
  protected safelyResolveKeyedType <T extends Partial<Record<K, TypeResolution.ResolvedType>>, K extends keyof T>(resolvingType: T, key: K, file: string, typeName: string): void {
    this.typeDictionary.subscribe(file, typeName, resolvedType => {
      resolvingType[key] = resolvedType;
    });
  }
}
