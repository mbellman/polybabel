import AbstractTypeDefinition from './AbstractTypeDefinition';
import { Callback } from '../../../system/types';
import { FunctionType } from './function-type';
import { IConstrainable, IObjectMember, ObjectCategory, TypeDefinition, ITypeConstraint } from './types';
import { IHashMap, Implements } from 'trampoline-framework';
import { TypeValidation } from '../../validators/common/type-validation';

export namespace ObjectType {
  export type Constraint = ITypeConstraint<ObjectType.Definition>;

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
    protected constructors: IObjectMember<FunctionType.Constraint>[] = [];
    protected genericParameters: string[] = [];
    protected objectMemberMap: IHashMap<IObjectMember> = {};
    protected overloadedMethodMap: IHashMap<IObjectMember<FunctionType.Constraint>[]> = {};
    protected superTypeConstraints: ITypeConstraint[] = [];

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
    public forEachMember (objectMemberHandler: Callback<IObjectMember>): void {
      const iteratedMembers: IHashMap<boolean> = {};

      // Wraps the provided object member handler callback in
      // callback in a method which prevents duplicate iteration
      // over both subtype and supertype members, e.g. in the
      // case of overrides
      const handleMember = (objectMember: IObjectMember) => {
        const { name } = objectMember;

        if (name in iteratedMembers) {
          return;
        }

        objectMemberHandler(objectMember);

        iteratedMembers[name] = true;
      };

      Object.keys(this.objectMemberMap).forEach(key => handleMember(this.objectMemberMap[key]));

      if (this.superTypeConstraints.length > 0) {
        // Iterate backward over the supertypes so that last-added
        // supertype members take precedence over earlier ones, e.g.
        // in the case of identically-named members
        for (const superTypeConstraint of this.superTypeConstraints) {
          this.ensureConstraintHasDefinition(superTypeConstraint);

          const { typeDefinition } = superTypeConstraint;

          if (typeDefinition instanceof ObjectType.Definition && typeDefinition !== this) {
            typeDefinition.forEachMember(handleMember);
          }
        }
      }
    }

    /**
     * Similar to forEachMember(), but takes a predicate function for
     * determining which members should handled by the provided object
     * member handler.
     */
    public forEachMemberWhere (objectMemberPredicate: Callback<IObjectMember, boolean>, objectMemberHandler: Callback<IObjectMember>): void {
      this.forEachMember(objectMember => {
        if (objectMemberPredicate(objectMember)) {
          objectMemberHandler(objectMember);
        }
      });
    }

    /**
     * Finds a defined constructor with a constraint corresponding to
     * a set of instantiation argument types and returns its index.
     * If the provided argument types match no explicit constructor
     * constraints, or if arguments are specified when no explicit
     * constructors exist, we return -1 to indicate an erroneous
     * instantiation.
     */
    public getMatchingConstructorIndex (argumentTypeConstraints: ITypeConstraint[]): number {
      for (let i = 0; i < this.constructors.length; i++) {
        const constructorParameterTypeConstraints = this.constructors[i].constraint.typeDefinition.getParameterTypeConstraints();

        if (TypeValidation.allTypeConstraintsMatch(argumentTypeConstraints, constructorParameterTypeConstraints)) {
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
    public getMatchingMethodMember (methodName: string, argumentTypeConstraints: ITypeConstraint[]): IObjectMember<FunctionType.Constraint> {
      const methodOverloads = this.overloadedMethodMap[methodName];

      if (methodOverloads) {
        for (const methodOverload of methodOverloads) {
          const methodParameterTypeConstraints = methodOverload.constraint.typeDefinition.getParameterTypeConstraints();

          if (TypeValidation.allTypeConstraintsMatch(argumentTypeConstraints, methodParameterTypeConstraints)) {
            return methodOverload;
          }
        }
      } else {
        const methodMember = this.getObjectMember(methodName) as IObjectMember<FunctionType.Constraint>;

        if (methodMember) {
          const { typeDefinition } = methodMember.constraint;

          if (
            typeDefinition instanceof FunctionType.Definition &&
            TypeValidation.allTypeConstraintsMatch(argumentTypeConstraints, typeDefinition.getParameterTypeConstraints())
          ) {
            return methodMember;
          }
        }
      }

      return null;
    }

    public getObjectMember (memberName: string): IObjectMember {
      const objectMember = this.objectMemberMap[memberName];

      if (objectMember) {
        this.ensureConstraintHasDefinition(objectMember.constraint);

        return objectMember;
      } else if (this.superTypeConstraints.length > 0) {
        return this.getSuperObjectMember(memberName);
      }

      return null;
    }

    public getSuperTypeConstraintByIndex (index: number): ITypeConstraint {
      return this.superTypeConstraints[index];
    }

    public hasConstructors (): boolean {
      return this.constructors.length > 0;
    }

    public hasEquivalentMember (objectMember: IObjectMember): boolean {
      const ownMember = this.getObjectMember(objectMember.name);

      return (
        !!ownMember &&
        TypeValidation.typeConstraintMatches(ownMember.constraint, objectMember.constraint) &&
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
     * provided target super type in its inheritance hierarchy.
     */
    public isSubtypeOf (targetSuperType: TypeDefinition): boolean {
      for (const superTypeConstraint of this.superTypeConstraints) {
        this.ensureConstraintHasDefinition(superTypeConstraint);

        if (superTypeConstraint.typeDefinition === targetSuperType) {
          return true;
        }

        const { typeDefinition } = superTypeConstraint;

        if (
          typeDefinition instanceof ObjectType.Definition &&
          typeDefinition.isSubtypeOf(targetSuperType)
        ) {
          return true;
        }
      }

      return false;
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
      for (const superTypeConstraint of this.superTypeConstraints) {
        this.ensureConstraintHasDefinition(superTypeConstraint);

        const { typeDefinition } = superTypeConstraint;

        if (typeDefinition instanceof ObjectType.Definition) {
          const objectMember = typeDefinition.getObjectMember(memberName);

          if (objectMember) {
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

    private ownTypeConstraint: ObjectType.Constraint = {
      typeDefinition: this,
      isOriginal: true
    };

    public addConstructor (constructor: IObjectMember<FunctionType.Constraint>): void {
      this.constructors.push(constructor);
    }

    /**
     * @todo create an IGenericParameter interface for controlling
     * generic parameter names, constraints, etc.
     */
    public addGenericParameter (name: string): void {
      this.genericParameters.push(name);
    }

    public addMember (objectMember: IObjectMember): void {
      objectMember.parent = this.ownTypeConstraint;

      this.objectMemberMap[objectMember.name] = objectMember;
    }

    public addMethodOverload (overloadMember: IObjectMember<FunctionType.Constraint>): void {
      overloadMember.parent = this.ownTypeConstraint;

      const { name } = overloadMember;
      const existingMember = this.objectMemberMap[name] as IObjectMember<FunctionType.Constraint>;

      if (!existingMember) {
        return;
      }

      const { typeDefinition: existingMemberType } = existingMember.constraint;
      const { typeDefinition: overloadType } = overloadMember.constraint;

      if (
        !(existingMemberType instanceof FunctionType.Definition) ||
        !(overloadType instanceof FunctionType.Definition)
      ) {
        return;
      }

      const existingOverloads = this.overloadedMethodMap[name] || [ existingMember ];

      overloadMember.name += `_${existingOverloads.length}`;

      this.overloadedMethodMap[name] = [
        ...existingOverloads,
        overloadMember
      ];
    }

    public addSuper (constraint: ITypeConstraint): void {
      this.superTypeConstraints.push(constraint);
    }
  }
}
