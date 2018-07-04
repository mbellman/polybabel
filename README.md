# polybabel

Polybabel is an aspiring many-to-one, source-to-source compiler written in TypeScript and Node. Its design goal is to allow developers to write idiomatic code in other languages which can compile to JavaScript.

Polybabel's emphasis on idiomatic programming means the standard libraries and APIs normally available in these languages will be absent, though this is only because it effectively makes them unnecessary. What you write ultimately runs as JavaScript, with access to all of the features of a conventional JavaScript runtime environment.

## Progress

### General architecture

* Tokenization ✔
* Parsing ✔
* Syntax tree generation ✔
* Indentation handling ✔
* Compilation - 95%?
* * Symbol Resolution ✔
* * Validation - 95%?
* * Translation ✔
* * Line error preview/reporting ✔
* Interoperability between languages - 70%

### Java
#### Supported features:
* Parsing ✔
* Translation ✔
* Validation - 45%?
* * Package validation ✔
* * Import validation ✔
* * Class extension validation - 75%?
* * Class implementation validation - 75%?
* * Interface validation - 5%
* * Constructor overloads ✔
* * Class field validation ✔
* * Class method validation - 80%?
* * Class method overloads ✔
* * Statement type verification - 70%?
* * Expression statement validation - 80%
* * Access modifier validation ✔
* * Control structure validation - 15%
#### Remaining items:
* Parsing
* * Comma-separated statement support

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