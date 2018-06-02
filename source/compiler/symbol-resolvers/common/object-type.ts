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
    public readonly requiresImplementation: boolean;
    protected constructors: IObjectMember<FunctionType.Definition>[];
    protected genericParameters: string[] = [];
    protected objectMemberMap: IHashMap<IObjectMember> = {};
    protected supertype: TypeDefinition;

    /**
     * @todo
     */
    @Implements public constrain (genericParameterTypes: TypeDefinition[]): ObjectType.Definition {
      if (genericParameterTypes.length !== this.genericParameters.length) {
        return this;
      }

      return null;
    }

    /**
     * Iterates over each member of the object type as well as its
     * supertype using a provided callback function. If supertypes
     * contain members already defined and iterated over on subtypes,
     * the supertype members are skipped.
     */
    public forEachMember (callback: (memberName: string, objectMember: IObjectMember) => void): void {
      const iteratedMembers: IHashMap<boolean> = {};

      // Wrap the provided callback in a method which prevents
      // duplicate iteration over both subtype and supertype
      // members, e.g. in the case of overrides
      const handleMember = (memberName: string, objectMember: IObjectMember) => {
        if (memberName in iteratedMembers) {
          return;
        }

        callback(memberName, objectMember);

        iteratedMembers[memberName] = true;
      };

      Object.keys(this.objectMemberMap).forEach(key => {
        handleMember(key, this.objectMemberMap[key]);
      });

      if (this.supertype) {
        this.ensureSupertypeHasDefinition();

        if (this.supertype instanceof ObjectType.Definition) {
          this.supertype.forEachMember(handleMember);
        }
      }
    }

    /**
     * @todo Allow optional visibility restrictions
     */
    public getObjectMember (memberName: string): IObjectMember {
      const objectMember = this.objectMemberMap[memberName];

      if (objectMember) {
        this.ensureObjectMemberHasDefinition(objectMember);

        return objectMember;
      } else if (this.supertype) {
        return this.getSuperObjectMember(memberName);
      }

      return null;
    }

    public hasOwnObjectMember (memberName: string): boolean {
      return memberName in this.objectMemberMap;
    }

    private ensureObjectMemberHasDefinition (objectMember: IObjectMember): void {
      if (typeof objectMember.type === 'string') {
        objectMember.type = this.symbolDictionary.getSymbolType(objectMember.type);
      }
    }

    private ensureSupertypeHasDefinition (): void {
      if (typeof this.supertype === 'string') {
        this.supertype = this.symbolDictionary.getSymbolType(this.supertype);
      }
    }

    /**
     * Retrieves an object member definition from the object's supertype
     * as a fallback for failing to retrieve the object's own member.
     */
    private getSuperObjectMember (memberName: string): IObjectMember {
      this.ensureSupertypeHasDefinition();

      if (this.supertype instanceof ObjectType.Definition) {
        const objectMember = this.supertype.getObjectMember(memberName);

        if (objectMember) {
          this.ensureObjectMemberHasDefinition(objectMember);

          return objectMember;
        }
      }

      return null;
    }
  }

  /**
   * An ObjectType.Definition's definer subclass.
   */
  export class Definer extends Definition {
    public category: ObjectCategory;
    public isConstructable: boolean;
    public isExtensible: boolean;
    public requiresImplementation: boolean;

    public addConstructor (constructor: IObjectMember<FunctionType.Definition>): void {
      this.constructors.push(constructor);
    }

    public addGenericParameter (name: string): void {
      this.genericParameters.push(name);
    }

    public addMember (memberName: string, objectMember: IObjectMember): void {
      this.objectMemberMap[memberName] = objectMember;
    }

    public defineSuperType (supertype: TypeDefinition): void {
      this.supertype = supertype;
    }
  }
}
