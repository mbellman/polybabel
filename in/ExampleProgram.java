package ExampleProgram;

import interfaces.IExampleInterface;
import ExampleImplementation;

public final class ExampleProgram {
  private static enum ExampleEnum {
    UP,
    DOWN,
    LEFT,
    RIGHT
  }

  public static void main (String[] args) {
    console.log('This is an example.');

    ExampleImplementation example = (ExampleImplementation) ExampleProgram.getExample();

    String firstArg = args[0];
    String[] names;
    int age = 25;

    age++;

    for (String name : names) {
      String firstChar = name.charAt(0);
    }

    ExampleEnum exampleEnum = ExampleEnum.UP;
  }

  public static IExampleInterface getExample () {
    ExampleImplementation exampleImplementation = new ExampleImplementation();

    return exampleImplementation;
  }
}
