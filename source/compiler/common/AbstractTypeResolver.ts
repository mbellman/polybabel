import TypeDictionary from '../TypeDictionary';
import { IHashMap } from 'trampoline-framework';
import { ISyntaxTree } from '../../parser/common/syntax-types';
import { TypeResolution } from '../common/compiler-types';

/**
 * @todo @description
 */
export default abstract class AbstractTypeResolver {
  private loadResolvedTypeMap: TypeResolution.ResolvedTypeMapLoader;

  public constructor (loadResolvedTypeMap: TypeResolution.ResolvedTypeMapLoader) {
    this.loadResolvedTypeMap = loadResolvedTypeMap;
  }

  public abstract resolve (syntaxTree: ISyntaxTree): TypeResolution.ResolvedType[];

  /**
   * Provides a means of loading a resolved type definition
   * from another file, within the file this instance is
   * resolving types for.
   */
  protected loadResolvedType (file: string, typeName: string): TypeResolution.ResolvedType {
    return this.loadResolvedTypeMap(file)[typeName];
  }
}
