package HelloWorld;

import goodbye.GoodbyeWorld;

protected interface ITest {
  String string;
  Bool boolean;
  Object object;

  Thing getThing (String things[], final Number id) throws Exception;
}

public final class HelloWorld implements ITest {
  public static void main (String[] args) {
    if (this instanceof HelloWorld) {
      console.log('Hello, world!');
    }

    for (int i = 0; i < x; i++) {
      Future<Data> future = Fetcher.fetchData();
    }

    for (int number : { 1, 2, 3, 4, 5, 6 }) {
      console.log(number);
    }

    while (thread.isLocked()) {
      wait();
    }

    switch (value) {
      case 1:
        doSomething();
        break;
      default:
        int number = 5;
        break;
    }
    
    return;
  }

  private interface IHello {
    Map<String>[] stringMaps;
  }
}
