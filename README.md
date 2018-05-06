# polybabel

Polybabel is an aspiring many-to-one, source-to-source compiler written in TypeScript and Node. Its design goal is to allow developers to write idiomatic code in other languages which can compile to JavaScript.

Polybabel's emphasis on idiomatic programming means the standard libraries and APIs normally available in these languages will be absent, though this is only because it effectively makes them unnecessary. What you write ultimately runs as JavaScript, with access to all of the features of a conventional JavaScript runtime environment.

## Progress

### General architecture

* Tokenization ✔
* Parsing ✔
* Parsing errors ✔
* Syntax tree generation ✔
* Indentation handling ✔
* Compilation - 25%?
* * Type Reconciliation - 10%?
* * Validation - 5%?
* * Translation ✔
* Interoperability between languages - 0%

### Java
1. Parsing - 85%?
* * Package statements ✔
* * Import statements ✔
* * Classes ✔
* * Interfaces ✔
* * Enums - 0%
* * Fields ✔
* * Methods - 95%
* * - Generic method definitions - 0%
* * Varargs ✔
* * Generics - 70%?
* * - Generic syntax ✔
* * - Extensible generic types - 0%
* * - Method generics ✔
* * Statements - 85%?
* * - Variables ✔
* * - Property chains ✔
* * - Method calls ✔
* * - Instantiation ✔
* * - - Anonymous class/instance overrides - 0%
* * - Literals ✔
* * - Operators ✔
* * - If/else blocks ✔
* * - Loops ✔
* * - Switches ✔
* * - Anonymous functions (lambda expressions) - 0%
* * - try/catch/finally - 0%
* * - break/continue/return/throw ✔
* * Comments - 0%
* * Annotations - 0%
2. Compilation - 25%?
* * Imports ✔
* * Interfaces - 35%?
* * Methods - 50%?
* * Statements - 60%?

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