import { IObjectMember } from '../../symbol-resolvers/common/types';
import { ObjectType } from '../../symbol-resolvers/common/object-type';

/**
 * A class which helps solve the problem of resolving the
 * namespaced location of a reference from within the current
 * visited object. For example:
 *
 * ```
 *  Object A {
 *    method () {
 *      anotherMethod()
 *    }
 *
 *    anotherMethod () { }
 *  }
 * ```
 *
 * In the above pseudo-code, anotherMethod() referenced inside
 * method() would not be lexically scoped at the time of its
 * reference, and would thus be treated as an undeclared. However,
 * in some languages object members can be referenced without a
 * 'this' binding, and must be properly resolved as members of
 * a parent object. By tracking the current visited object stack,
 * we can easily determine which parent object contains a seemingly
 * undeclared reference and resolve the reference's namespace chain.
 */
export default class ObjectVisitor {
  private visitedObjectStack: ObjectType.Definition[] = [];

  public findParentObjectMember (memberName: string): IObjectMember {
    for (let i = this.visitedObjectStack.length - 1; i >= 0; i--) {
      const objectTypeDefinition = this.visitedObjectStack[i];
      const objectMember = objectTypeDefinition.getObjectMember(memberName);

      if (objectMember) {
        return objectMember;
      }
    }

    return null;
  }

  public getCurrentVisitedObject (): ObjectType.Definition {
    return this.visitedObjectStack[this.visitedObjectStack.length - 1];
  }

  public leaveObject (): void {
    this.visitedObjectStack.pop();
  }

  public visitObject (objectType: ObjectType.Definition): void {
    this.visitedObjectStack.push(objectType);
  }
}
