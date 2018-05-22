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

  public addResolvedTypes (file: string, types: TypeResolution.ResolvedType[]): void {
    if (!this.fileMap[file]) {
      this.fileMap[file] = {};
    }

    const typeMap = this.fileMap[file];

    types.forEach(type => {
      typeMap[type.name] = type;

      this.eventManager.trigger(`${file}:${type.name}`);
    });
  }

  public getResolvedType (file: string, typeName: string): TypeResolution.ResolvedType {
    const typeMap = this.fileMap[file];

    return typeMap ? typeMap[typeName] || null : null;
  }

  /**
   * Subscribes to the future definition of a resolved type
   * by file and type name. Since object types with members
   * of types originating from another file may be resolved
   * before that file, they will need to listen for the later
   * resolution of its types without blocking execution. Once
   * the type is resolved, it can be updated on the first
   * resolved type by reference.
   */
  public subscribe (file: string, typeName: string, callback: Callback<TypeResolution.ResolvedType>): void {
    this.eventManager.on(`${file}:${typeName}`, () => {
      const resolvedType = this.fileMap[file][typeName];

      callback(resolvedType);
    });
  }
}
