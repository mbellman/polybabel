package ExampleImplementation;

import interfaces.IExampleInterface;

public class ExampleImplementation implements IExampleInterface {
  String example = 'Hello!';
  Number num = 10;

  Number getExample () {
    return num;
  }

  Number getAddedNumber () {
    return num + num;
  }
}
