package ExampleImplementation;

import interfaces.IExampleInterface;

public class ExampleImplementation implements IExampleInterface {
  String example = 'Hello!';
  Number num = 10;

  String getExample () {
    return example;
  }

  Number getAddedNumber () {
    return num + num;
  }
}
