import AbstractTypeDefinition from './AbstractTypeDefinition';
import { FunctionType } from './function-type';
import { IConstrainable, IObjectMember, ObjectCategory, TypeDefinition } from './types';
import { IHashMap, Implements } from 'trampoline-framework';
import { TypeMatcher } from '../../validators/common/types';
import { TypeValidation } from '../../validators/common/type-validation';

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
    public readonly name: string;
    public readonly requiresImplementation: boolean;
    protected constructors: IObjectMember<FunctionType.Definition>[] = [];
    protected genericParameters: string[] = [];
    protected objectMemberMap: IHashMap<IObjectMember> = {};
    protected overloadedMethodMap: IHashMap<IObjectMember<FunctionType.Definition>[]> = {};
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

          if (supertype instanceof ObjectType.Definition && supertype !== this) {
            supertype.forEachMember(handleMember);
          }
        }
      }
    }

    /**
     * Finds a defined constructor with a signature corresponding to
     * a set of instantiation argument types and returns its index.
     * If the provided argument types match no explicit constructor
     * signatures, or if arguments are specified when no explicit
     * constructors exist, we return -1 to indicate an erroneous
     * instantiation.
     */
    public getMatchingConstructorIndex (argumentTypes: TypeDefinition[]): number {
      for (let i = 0; i < this.constructors.length; i++) {
        if (TypeValidation.allTypesMatch(argumentTypes, this.constructors[i].type.getParameterTypes())) {
          return i;
        }
      }

      return -1;
    }

    /**
     * Returns the defined object member for a method, specified by
     * name and with parameter types matching the provided argument
     * types. If overloads exist for the method, the appropriate
     * overloaded method object member is returned. If no overloads
     * exist, we simply return the sole defined method object member,
     * given that the provided argument types match its own. If no
     * method is found matching the name and provided argument types,
     * we return null.
     */
    public getMatchingMethodMember (methodName: string, argumentTypes: TypeDefinition[]): IObjectMember<FunctionType.Definition> {
      const methodOverloads = this.overloadedMethodMap[methodName];

      if (methodOverloads) {
        for (const methodOverload of methodOverloads) {
          if (TypeValidation.allTypesMatch(argumentTypes, methodOverload.type.getParameterTypes())) {
            return methodOverload;
          }
        }
      } else {
        const methodMember = this.objectMemberMap[methodName];
        const { type } = methodMember;

        if (
          type instanceof FunctionType.Definition &&
          TypeValidation.allTypesMatch(argumentTypes, type.getParameterTypes())
        ) {
          return methodMember as IObjectMember<FunctionType.Definition>;
        }
      }

      return null;
    }

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

    public getSupertypeByIndex (index: number): TypeDefinition {
      return this.supertypes[index];
    }

    public hasConstructors (): boolean {
      return this.constructors.length > 0;
    }

    public hasEquivalentMember (objectMember: IObjectMember): boolean {
      const ownMember = this.objectMemberMap[objectMember.name];

      return (
        !!ownMember &&
        TypeValidation.typeMatches(ownMember.type, objectMember.type) &&
        ownMember.isStatic === objectMember.isStatic &&
        ownMember.visibility >= objectMember.visibility
      );
    }

    public hasMember (memberName: string): boolean {
      return !!this.getObjectMember(memberName);
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
      if (objectMember.type instanceof Array) {
        objectMember.type = this.symbolDictionary.getFirstDefinedSymbol(objectMember.type).type;
      }
    }

    private ensureSupertypeHasDefinition (index: number): void {
      const supertype = this.supertypes[index];

      if (supertype instanceof Array) {
        this.supertypes[index] = this.symbolDictionary.getFirstDefinedSymbol(supertype).type;
      }
    }

    /**
     * Retrieves an object member definition from one of the object's
     * supertypes as a fallback if the given member does not exist in
     * the object's own members.
     *
     * Supertypes are iterated over backwards so later-added supertypes
     * are obtained first.
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
    public name: string;
    public requiresImplementation: boolean;

    public addConstructor (constructor: IObjectMember<FunctionType.Definition>): void {
      this.constructors.push(constructor);
    }

    public addGenericParameter (name: string): void {
      this.genericParameters.push(name);
    }

    public addMember (objectMember: IObjectMember): void {
      this.setOriginalObject(objectMember);

      this.objectMemberMap[objectMember.name] = objectMember;
    }

    public addMethodOverload (objectMember: IObjectMember<FunctionType.Definition>): void {
      this.setOriginalObject(objectMember);

      const { name } = objectMember;
      const existingMember = this.objectMemberMap[name] as IObjectMember<FunctionType.Definition>;

      if (
        !(existingMember.type instanceof FunctionType.Definition) ||
        !(objectMember.type instanceof FunctionType.Definition)
      ) {
        return;
      }

      const existingOverloads = this.overloadedMethodMap[name] || [ existingMember ];

      objectMember.name += `_${existingOverloads.length}`;

      this.overloadedMethodMap[name] = [
        ...existingOverloads,
        objectMember
      ];
    }

    public addSupertype (supertype: TypeDefinition): void {
      this.supertypes.push(supertype);
    }

    private setOriginalObject (objectMember: IObjectMember): void {
      objectMember.originalObject = this;
    }
  }
}
