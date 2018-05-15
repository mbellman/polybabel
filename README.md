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
#### Remaining items:
1. Parsing/Translation:
* * Ternaries
* * Explicit constructor translation
* * Enums
* * Additional shorthand assignment operators
* * Hexadecimal number parsing
* * Assertions
* * Improved comment sanitization
* * Static/instance initializer blocks
* * Overloading
2. Validation
* * All items

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