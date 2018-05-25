import AbstractType from "./AbstractType";
import { Implements } from "trampoline-framework";

export default class FunctionType extends AbstractType {
  /**
   * @todo
   */
  @Implements public constrain (): AbstractType {
    return null;
  }
}
