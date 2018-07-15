# polybabel

Polybabel is an aspiring many-to-one, source-to-source compiler written in TypeScript and Node. Its design goal is to allow developers to write idiomatic code in other languages which can compile to JavaScript.

Polybabel's emphasis on idiomatic programming means the standard libraries and APIs normally available in these languages will be absent, though this is only because it effectively makes them unnecessary. What you write ultimately runs as JavaScript, with access to all of the features of a conventional JavaScript runtime environment.

## Progress

### General architecture

* Tokenization ✔
* Parsing ✔
* Syntax tree generation ✔
* Indentation handling ✔
* Compilation - 99%?
* * Symbol Resolution ✔
* * Validation - 98%?
* * Translation ✔
* * Line error preview/reporting ✔
* Interoperability between languages - 70%?
* Generic type support - 0%

### Java
#### Supported features:
* Parsing ✔
* Translation ✔
* Validation - 60%?
* * Package validation ✔
* * Import validation ✔
* * Class extension validation - 85%?
* * Class implementation validation ✔
* * Interface validation - 50%?
* * Constructor overloads ✔
* * Class field validation ✔
* * Class method validation ✔
* * Class method overloads ✔
* * Statement type verification - 90%?
* * Expression statement validation - 90%?
* * Cast validation ✔
* * Access modifier validation ✔
* * Control structure validation - 20%?
#### Upcoming:
* Parsing
* * Support order of operations
* * Fix parsing issues with expressions of the form: i++ < j
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