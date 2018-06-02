import AbstractTypeDefinition from './AbstractTypeDefinition';
import { Implements } from 'trampoline-framework';
import { TypeDefinition } from './types';

export namespace ArrayType {
  /**
   * An array type definition, denoting a list of elements
   * of a given type.
   */
  export class Definition extends AbstractTypeDefinition {
    protected elementType: TypeDefinition;

    public getElementType (): TypeDefinition {
      if (typeof this.elementType === 'string') {
        const { type } = this.symbolDictionary.getSymbol(this.elementType);

        this.elementType = type;
      }

      return this.elementType;
    }
  }

  /**
   * An ArrayType.Definition's definer subclass.
   */
  export class Definer extends Definition {
    public defineElementType (elementType: TypeDefinition): void {
      this.elementType = elementType;
    }
  }
}
