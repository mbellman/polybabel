import AbstractType from './AbstractType';
import FunctionType from './FunctionType';
import { IHashMap, Implements } from 'trampoline-framework';
import { IObjectMember, SymbolIdentifier, TypeDefinition } from './types';

/**
 * @todo @description
 */
export default class ObjectType extends AbstractType {
  public isConstructable: boolean;
  public isExtensible: boolean;
  private constructors: IObjectMember<FunctionType>[];
  private genericParameters: string[] = [];
  private objectMemberMap: IHashMap<IObjectMember>;
  private superTypeIdentifier: SymbolIdentifier;

  /**
   * @todo
   */
  @Implements public constrain (genericParameterTypes: TypeDefinition[]): AbstractType {
    return null;
  }

  public addGenericParameter (name: string): void {
    this.genericParameters.push(name);
  }

  public defineConstructor (constructor: IObjectMember<FunctionType>): void {
    this.constructors.push(constructor);
  }

  public defineMember (memberName: string, objectMember: IObjectMember): void {
    this.objectMemberMap[memberName] = objectMember;
  }

  public defineSuperType (superTypeIdentifier: SymbolIdentifier): void {
    this.superTypeIdentifier = superTypeIdentifier;
  }

  public getMember (memberName: string): IObjectMember {
    const objectMember = this.objectMemberMap[memberName];

    if (objectMember) {
      if (typeof objectMember.type === 'string') {
        const { type } = this.symbolDictionary.getSymbol(objectMember.type);

        objectMember.type = type;
      }

      return objectMember;
    } else if (this.superTypeIdentifier) {
      const { type } = this.symbolDictionary.getSymbol(this.superTypeIdentifier);

      return type instanceof ObjectType
        ? type.getMember(memberName)
        : null;
    } else {
      return null;
    }
  }
}
