export const ASP = `
program            ::= (statement? query? | comment | NL)* 

statement          ::= rule | fact | integrity_constraint
query              ::= classical_literal QUERY_MARK

fact               ::= head DOT WS* NL?
rule               ::= head CONS bodies? DOT WS* NL?
integrity_constraint ::= CONS bodies? DOT WS* NL? | WCONS bodies? DOT SQUARE_OPEN weight_at_level SQUARE_CLOSE WS* NL?
comment            ::= MULTI_LINE_COMMENT WS* NL? | COMMENT WS* NL?

head               ::= disjunction | choice
bodies             ::= body+ | FALSE | TRUE
body               ::= naf_literal COMMA | NAF? aggregate COMMA | naf_literal | NAF? aggregate

disjunction        ::= classical_literal (OR disjunction)?

choice             ::= (term binop?)? CURLY_OPEN choice_elements? CURLY_CLOSE (binop? term)?
choice_elements    ::= choice_element (SEMICOLON choice_elements)? 
choice_element     ::= classical_literal (COLON naf_literals?)? 

aggregate          ::= (term binop?)? aggregate_function? CURLY_OPEN aggregate_elements? CURLY_CLOSE (binop? term)? | aggreagte_count_function
aggregate_elements ::= aggregate_element ((COMMA | SEMICOLON) aggregate_elements)? 
aggregate_element  ::= classical_literal? (COLON naf_literals)? | basic_terms? (COLON naf_literals)?
aggregate_function ::= AGGREGATE_COUNT | AGGREGATE_MAX | AGGREGATE_MIN | AGGREGATE_SUM
aggreagte_count_function ::= "|" aggregate_elements? "|" (binop? term)?

weight_at_level    ::= term (AT term)? (COMMA terms)?

naf_literals       ::= naf_literal (COMMA naf_literals)? 
naf_literal        ::= NAF? classical_literal | builtin_atom

classical_literal  ::= MINUS? ID (PAREN_OPEN terms? PAREN_CLOSE)? 
builtin_atom       ::= term binop term

binop              ::= EQUAL | UNEQUAL | LESS_OR_EQ | GREATER_OR_EQ | LESS | GREATER

terms              ::= term ((COMMA | SEMICOLON) terms)?
term_op_repeat     ::= arithop term term_op_repeat?
term               ::= NUMBER term_op_repeat? | STRING term_op_repeat? | VARIABLE term_op_repeat? | ANONYMOUS_VARIABLE term_op_repeat? | PAREN_OPEN terms? PAREN_CLOSE term_op_repeat? | MINUS term term_op_repeat? | ID (PAREN_OPEN terms? PAREN_CLOSE)? term_op_repeat?

basic_terms        ::= basic_term (COMMA basic_terms)? 
basic_term         ::= ground_term | variable_term
ground_term        ::= SYMBOLIC_CONSTANT | STRING | MINUS? NUMBER
variable_term      ::= VARIABLE | ANONYMOUS_VARIABLE
arithop            ::= PLUS | MINUS | TIMES | DIV

NUMBER ::= "0" | [1-9] [0-9]*
SYMBOLIC_WITHOUT_STAR ::= "-" | "_" | "!" | "#" | "$" | "%" | "&" | "(" | ")" | "*" | "+" | "," | "-" | "." | "/" | ":" | ";" | "<" | "=" | ">" | "?" | "@" | "[" | "]" | "^" | "_" | "\`" | "{" | "|" | "}" | "~" | "TODO Backslash!"
SYMBOLIC_CONSTANT ::= "*" | SYMBOLIC_WITHOUT_STAR
UNDERLINE ::= "_"
DOUBLE_QUOTE ::= '"'
ID                  ::= [a-z] [a-zA-Z0-9_]*
VARIABLE            ::= [A-Z] [a-zA-Z0-9_]*
STRING_CONTENT      ::= ([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG)
STRING              ::= DOUBLE_QUOTE ([^#x22] | #x5c #x22)* DOUBLE_QUOTE
HEXDIG              ::= [a-zA-Z0-9]
ANONYMOUS_VARIABLE  ::= UNDERLINE ID | UNDERLINE VARIABLE | UNDERLINE
DOT ::= "."
COMMA ::= ","
QUERY_MARK ::= "?"
COLON ::= ":"
SEMICOLON ::= ";"
OR ::= "|"
NAF ::= "not"
CONS ::= ":-"
WCONS ::= ":~"
PLUS ::= "+"
MINUS ::= "-"
TIMES ::= "*"
DIV ::= "/"
AT ::= "@"
PAREN_OPEN ::= "("
PAREN_CLOSE ::= ")"
SQUARE_OPEN ::= "["
SQUARE_CLOSE ::= "]"
CURLY_OPEN ::= "{"
CURLY_CLOSE ::= "}"
EQUAL ::= "="
UNEQUAL ::= "<>" | "!="
LESS ::= "<"
GREATER ::= ">"
LESS_OR_EQ ::= "<="
GREATER_OR_EQ ::= ">="
AGGREGATE_COUNT ::= "count"
AGGREGATE_MAX ::= "max"
AGGREGATE_MIN ::= "min"
AGGREGATE_SUM ::= "sum"
FALSE ::= "#false"
TRUE ::= "#true"
COMMENT ::= "%" ([^*\n] [^\n]*)?
MULTI_LINE_COMMENT ::= "%*" ([^*] | "*" [^%])* "*%"
NL ::= [#x0A#x0D]
WS ::= [#x09#x20]
`