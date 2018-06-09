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
* * Validation - 90%?
* * Translation ✔
* * Line error preview/reporting ✔
* Interoperability between languages - 10%

### Java
#### Supported features:
* Parsing ✔
* Translation ✔
* Validation - 15%?
* * Package validation ✔
* * Import validation ✔
* * Class extension validation - 50%?
* * Class implementation validation - 25%?
* * Class method validation - 30%?
* * Statement type verification - 20%?
* * Statement validation - 0%
#### Remaining items:
* Bugs
* * Inline else with an assignment break parser
* * Comments on inline conditional lines break parser
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