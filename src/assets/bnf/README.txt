ALLES ZU BNF

- keine linksrekursionen!
- \n und \t nicht ausdrückbar (mit TODO gekennzeichnet)
- keine leeren Zeilen zulässig
- body, .. linksrekursion aufgelöst und zur rechtsrekursion umgebaut

Left recursion is not allowed, rule: body
Left recursion is not allowed, rule: choice_elements
Left recursion is not allowed, rule: aggregate_elements
Left recursion is not allowed, rule: naf_literals
Left recursion is not allowed, rule: terms
Left recursion is not allowed, rule: term
Left recursion is not allowed, rule: basic_terms
Missing rule AGGREGATE_COUNT
Missing rule PAREN_OPEN
Missing rule LESS_OR_EQ
Missing rule GREATER_OR_EQ
Missing rule SYMBOLIC_CONSTANT

- <head> with SEMICOLON are not allowed by grammar but valid in Draco => added "<terms> ::= <term> | <term> <COMMA> <terms> | <term> <SEMICOLON> <terms>"


ALLES ZU EBNF
- keine linksrekursionen
- Operatoren von Regex zulässig (https://www.w3.org/TR/xml/#sec-notation)
- <term> => PAREN_OPEN terms? PAREN_CLOSE term_op_repeat
    Info: terms plural (multiple possibilites - i guess wrong in original grammar where it is only singular)
- <ANONYMOUS_VARIABLE> ::= UNDERLINE ID | UNDERLINE VARIABLE | UNDERLINE
    Info: ASP-Core notation does not allow variables with underline as starting character => in Draco it is allowed
- body ::= aggregate          ::= (term binop)? aggregate_function? CURLY_OPEN aggregate_elements? CURLY_CLOSE (binop term)? 
    Info: changed aggregate_function to optional as there are valid aggreagte notations in draco without any aggregate function
- aggregate_element  ::= classical_literal? (COLON naf_literals?)? 
    Info: changes basic_terms to classical_literal


EBNF zu Gringo EBNF
- aggregate_element  ::= classical_literal? (COLON naf_literals)? 
    Info: changed last naf_literals to be non-optional
- aggregate ::= (term binop?)? CURLY_OPEN aggregate_elements? CURLY_CLOSE (binop? term)? 
    Info: changed binop in both occurencies to be optional as there a forms like "2 { XYZ } 4"
- aggreagte_count_function ::= "|" aggregate_elements? "|" (binop? term)?
    Info: Added short version of count function with absolute markers
- FALSE ::= "#false"
    Info: added false as body options
- TRUE ::= "#true"
    Info: added true as body options



ALLGEMEINE ÄNDERUNGEN AN ASP GRAMMAR
- Comments/Multilines comments added
- Whitespaces and line breaks added
- SEMICOLON added where necessary


INFORMATION:
- https://potassco.org/doc/start/
    Info: A formal introduction to (a large fragment of) the input language of clingo and its precise semantics can be found here.
    You may also be interested in the ASP-Core-2 language standard, a subset of the language of clingo.

QUESTIONS:
- are choice elements necessary?

OPEN TASKS:
- add optimization functions of gringo to grammar (like minimize, maximize etc)
- add meta tags of gringo to grammar
- Check "not" operations => the classical_literal "notification" would fail