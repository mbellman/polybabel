import { Callback } from '../system/types';
import { EventManager, IHashMap } from 'trampoline-framework';
import { ISyntaxNode } from '../parser/common/syntax-types';
import { TypeResolution } from './common/compiler-types';

/**
 * A key/value table mapping file names to type maps containing
 * types resolved from the file.
 *
 * @internal
 */
interface IFileMap {
  [file: string]: IHashMap<TypeResolution.ResolvedType>;
}

/**
 * @todo @description
 */
export default class TypeDictionary {
  private eventManager: EventManager = new EventManager();
  private fileMap: IFileMap = {};

  public addResolvedTypes (file: string, resolvedTypes: TypeResolution.ResolvedType[]): void {
    if (!this.fileMap[file]) {
      this.fileMap[file] = {};
    }

    const resolvedTypeMap = this.fileMap[file];

    resolvedTypes.forEach(type => {
      resolvedTypeMap[type.name] = type;
    });
  }

  public getResolvedType (file: string, typeName: string): TypeResolution.ResolvedType {
    const resolvedTypeMap = this.fileMap[file] || {};

    return resolvedTypeMap[typeName];
  }

  public getResolvedTypeMap (file: string): IHashMap<TypeResolution.ResolvedType> {
    return this.fileMap[file];
  }
}
