import AbstractTypeDefinition from './AbstractTypeDefinition';
import { FunctionType } from './function-type';
import { IConstrainable, IObjectMember, ObjectCategory, SymbolIdentifier, TypeDefinition } from './types';
import { IHashMap, Implements } from 'trampoline-framework';

export namespace ObjectType {
  /**
   * An object type definition describing symbols with members,
   * such as interfaces or classes. Objects can be more broadly
   * categorized as 'complex types'.
   */
  export class Definition extends AbstractTypeDefinition implements IConstrainable {
    public readonly category: ObjectCategory;
    public readonly isConstructable: boolean;
    public readonly isExtensible: boolean;
    protected constructors: IObjectMember<FunctionType.Definition>[];
    protected genericParameters: string[] = [];
    protected objectMemberMap: IHashMap<IObjectMember> = {};
    protected superTypeIdentifier: SymbolIdentifier;

    /**
     * @todo
     */
    @Implements public constrain (genericParameterTypes: TypeDefinition[]): ObjectType.Definition {
      if (genericParameterTypes.length !== this.genericParameters.length) {
        return this;
      }

      return null;
    }

    public getObjectMember (memberName: string): IObjectMember {
      const objectMember = this.objectMemberMap[memberName];

      if (objectMember) {
        this.resolveObjectMemberType(objectMember);

        return objectMember;
      } else if (this.superTypeIdentifier) {
        return this.getSuperObjectMember(memberName);
      }

      return null;
    }

    private getSuperObjectMember (memberName: string): IObjectMember {
      const superType = this.symbolDictionary.getSymbolType(this.superTypeIdentifier);

      if (superType instanceof ObjectType.Definition) {
        const objectMember = superType.getObjectMember(memberName);

        if (objectMember) {
          this.resolveObjectMemberType(objectMember);

          this.objectMemberMap[memberName] = objectMember;

          return objectMember;
        }
      }

      return null;
    }

    /**
     * Ensures that an object member has a resolved type definition.
     */
    private resolveObjectMemberType (objectMember: IObjectMember): void {
      if (typeof objectMember.type === 'string') {
        // The type is still in only a symbol identifier string,
        // so we need to look the type up and reassign it
        objectMember.type = this.symbolDictionary.getSymbolType(objectMember.type);
      }
    }
  }

  /**
   * An ObjectType.Definition's definer subclass.
   */
  export class Definer extends Definition {
    public category: ObjectCategory;
    public isConstructable: boolean;
    public isExtensible: boolean;

    public addConstructor (constructor: IObjectMember<FunctionType.Definition>): void {
      this.constructors.push(constructor);
    }

    public addGenericParameter (name: string): void {
      this.genericParameters.push(name);
    }

    public addMember (memberName: string, objectMember: IObjectMember): void {
      this.objectMemberMap[memberName] = objectMember;
    }

    public defineSuperType (superTypeIdentifier: SymbolIdentifier): void {
      this.superTypeIdentifier = superTypeIdentifier;
    }
  }
}
