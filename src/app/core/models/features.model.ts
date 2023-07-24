import { Feature } from "../../shared/interfaces/feature.interface";

export const features: Feature[] = [
    {
        id: "variables",
        title_plural: "Variables",
        title_singular: "Variable",
        grammar_name: "VARIABLE"
    },
    {
        id: "identifiers",
        title_plural: "Identifiers",
        title_singular: "Identifier",
        grammar_name: "ID"
    },
    {
        id: "nafliterals",
        title_plural: "Naf Literals",
        title_singular: "Naf Literal",
        grammar_name: "naf_literal"
    },
    {
        id: "number",
        title_plural: "Number",
        title_singular: "Numbers",
        grammar_name: "NUMBER"
    },
    {
        id: "builtinAtom",
        title_plural: "Binary Operation",
        title_singular: "Binary Operations",
        grammar_name: "builtin_atom"
    },
]