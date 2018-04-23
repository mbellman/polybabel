# polybabel

Polybabel is an aspiring many-to-one, source-to-source compiler written in TypeScript and Node. Its design goal is to allow developers to write idiomatic code in other languages which can compile to JavaScript.

The emphasis on idiomatic programming means the standard libraries and APIs normally available in these languages will not be available with Polybabel. What you write ultimately runs as JavaScript, but *uses* other languages' grammar and conventions.

## Progress

### General architecture

* Tokenization ✔
* Parsing ✔
* Parsing errors ✔
* Syntax tree generation ✔
* Better whitespace/tab handling - 0%
* Compilation - 0%
* Compilation errors - 0%
* Interoperability between languages - 0%

### Java
1. Parsing
* * Package statements ✔
* * Import statements - 90%?
* * - Aliasing - 0%
* * Classes ✔
* * Interfaces ✔
* * Fields ✔
* * Methods ✔
* * Varargs - 0%
* * Generics - 70%?
* * - Generic syntax ✔
* * - Extensible generic types - 0%
* * - Method generics ✔
* * Statements - 30%?
* * - Variables ✔
* * - Property chains ✔
* * - Method calls ✔
* * - Instantiation ✔
* * - - Anonymous class/instance overrides - 0%
* * - Literals ✔
* * - Operators - 10%?
* * - Conditions - 0%
* * - Loops - 0%
* * - Anonymous functions (lambda expressions) - 0%
* * - try/catch/finally - 0%
* * - break/continue/return - 0%
* * Comments - 0%
* * Annotations - 0%
2. Compilation
* * Pending initial work.

### Python
Pending initial work.

### C#
Pending initial work.

### Ruby
Pending initial work.

### Additional Languages
* Elixir?
* C/C++?
* Scala?
* Haskell?