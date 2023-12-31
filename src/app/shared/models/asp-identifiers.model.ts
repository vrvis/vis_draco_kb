export enum ASP_IDENTIFIERES {
    program = 'program',

    statement = 'statement',
    query = 'query',

    fact = 'fact',
    rule = 'rule',
    integrity_constraint = 'integrity_constraint',
    comment = 'comment',

    head = 'head',
    bodies = 'bodies',
    body = 'body',

    disjunction = 'disjunction',

    choice = 'choice',
    choice_elements = 'choice_elements',
    choice_element = 'choice_element',

    aggregate = 'aggregate',
    aggregate_elements = 'aggregate_elements',
    aggregate_element = 'aggregate_element',
    aggregate_function = 'aggregate_function',
    aggreagte_count_function = 'aggreagte_count_function',

    weight_at_level = 'weight_at_level',

    naf_literals = 'naf_literals',
    naf_literal = 'naf_literal',

    classical_literal = 'classical_literal',
    builtin_atom = 'builtin_atom',

    binop = 'binop',

    terms = 'terms',
    term_op_repeat = 'term_op_repeat',
    term = 'term',

    basic_terms = 'basic_terms',
    basic_term = 'basic_term',
    ground_term = 'ground_term',
    variable_term = 'variable_term',
    arithop = 'arithop',

    NUMBER = 'NUMBER',
    SYMBOLIC_WITHOUT_STAR = 'SYMBOLIC_WITHOUT_STAR',
    SYMBOLIC_CONSTANT = 'SYMBOLIC_CONSTANT',
    UNDERLINE = 'UNDERLINE',
    DOUBLE_QUOTE = 'DOUBLE_QUOTE',
    ID = 'ID',
    VARIABLE = 'VARIABLE',
    STRING_CONTENT = 'STRING_CONTENT',
    STRING = 'STRING',
    HEXDIG = 'HEXDIG',
    ANONYMOUS_VARIABLE = 'ANONYMOUS_VARIABLE',
    DOT = 'DOT',
    COMMA = 'COMMA',
    QUERY_MARK = 'QUERY_MARK',
    COLON = 'COLON',
    SEMICOLON = 'SEMICOLON',
    OR = 'OR',
    NAF = 'NAF',
    CONS = 'CONS',
    WCONS = 'WCONS',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    TIMES = 'TIMES',
    DIV = 'DIV',
    AT = 'AT',
    PAREN_OPEN = 'PAREN_OPEN',
    PAREN_CLOSE = 'PAREN_CLOSE',
    SQUARE_OPEN = 'SQUARE_OPEN',
    SQUARE_CLOSE = 'SQUARE_CLOSE',
    CURLY_OPEN = 'CURLY_OPEN',
    CURLY_CLOSE = 'CURLY_CLOSE',
    EQUAL = 'EQUAL',
    UNEQUAL = 'UNEQUAL',
    LESS = 'LESS',
    GREATER = 'GREATER',
    LESS_OR_EQ = 'LESS_OR_EQ',
    GREATER_OR_EQ = 'GREATER_OR_EQ',
    AGGREGATE_COUNT = 'AGGREGATE_COUNT',
    AGGREGATE_MAX = 'AGGREGATE_MAX',
    AGGREGATE_MIN = 'AGGREGATE_MIN',
    AGGREGATE_SUM = 'AGGREGATE_SUM',
    FALSE = 'FALSE',
    TRUE = 'TRUE',
    COMMENT = 'COMMENT',
    MULTI_LINE_COMMENT = 'MULTI_LINE_COMMENT',
    NL = 'NL',
    WS = 'WS'
}