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
    protected constructors: IObjectMember<FunctionType.Definition>[] = [];
    protected genericParameters: string[] = [];
    protected objectMemberMap: IHashMap<IObjectMember> = {};
    protected supertypes: TypeDefinition[] = [];

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
    public forEachMember (callback: (objectMember: IObjectMember, memberName: string) => void): void {
      const iteratedMembers: IHashMap<boolean> = {};

      // Wraps the provided callback in a method which prevents
      // duplicate iteration over both subtype and supertype
      // members, e.g. in the case of overrides
      const handleMember = (objectMember: IObjectMember, memberName: string) => {
        if (memberName in iteratedMembers) {
          return;
        }

        callback(objectMember, memberName);

        iteratedMembers[memberName] = true;
      };

      Object.keys(this.objectMemberMap).forEach(key => {
        handleMember(this.objectMemberMap[key], key);
      });

      if (this.supertypes.length > 0) {
        // Iterate backward over the supertypes so that last-added
        // supertype members take precedence over earlier ones, e.g.
        // in the case of identically-named members
        for (let i = this.supertypes.length - 1; i >= 0; i--) {
          this.ensureSupertypeHasDefinition(i);

          const supertype = this.supertypes[i];

          if (supertype instanceof ObjectType.Definition) {
            supertype.forEachMember(handleMember);
          }
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
      } else if (this.supertypes.length > 0) {
        return this.getSuperObjectMember(memberName);
      }

      return null;
    }

    public hasOwnObjectMember (memberName: string): boolean {
      return memberName in this.objectMemberMap;
    }

    /**
     * Determines whether this object type definition contains a
     * provided target supertype in its inheritance hierarchy.
     */
    public isSubtypeOf (targetSupertype: ObjectType.Definition): boolean {
      for (let i = 0; i < this.supertypes.length; i++) {
        this.ensureSupertypeHasDefinition(i);

        const supertype = this.supertypes[i];

        if (supertype === targetSupertype) {
          return true;
        }

        if (supertype instanceof ObjectType.Definition && supertype.isSubtypeOf(targetSupertype)) {
          return true;
        }
      }

      return false;
    }

    private ensureObjectMemberHasDefinition (objectMember: IObjectMember): void {
      if (typeof objectMember.type === 'string') {
        objectMember.type = this.symbolDictionary.getSymbolType(objectMember.type);
      }
    }

    private ensureSupertypeHasDefinition (index: number): void {
      const supertype = this.supertypes[index];

      if (typeof supertype === 'string') {
        this.supertypes[index] = this.symbolDictionary.getSymbolType(supertype);
      }
    }

    /**
     * Retrieves an object member definition from one of the object's
     * supertypes as a fallback if the given member does not exist in
     * the object's own members.
     *
     * Supertypes are iterated over backwards so later-added supertypes
     * are searched first.
     */
    private getSuperObjectMember (memberName: string): IObjectMember {
      for (let i = this.supertypes.length - 1; i >= 0; i--) {
        this.ensureSupertypeHasDefinition(i);

        const supertype = this.supertypes[i];

        if (supertype instanceof ObjectType.Definition) {
          const objectMember = supertype.getObjectMember(memberName);

          if (objectMember) {
            this.ensureObjectMemberHasDefinition(objectMember);

            return objectMember;
          }
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

    public addSupertype (supertype: TypeDefinition): void {
      this.supertypes.push(supertype);
    }
  }
}
