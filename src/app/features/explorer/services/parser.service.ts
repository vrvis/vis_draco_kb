import { Injectable } from '@angular/core';

import { ConstraintAsp, constraints, constraints2json, data2schema, json2constraints, schema2asp } from 'draco-core';
import { BehaviorSubject, Observable } from 'rxjs';

//import BNF from 'bnf-parser';
import { Grammars } from 'ebnf';
import { ASP } from '../assets/asp';
import { AST } from 'src/app/shared/interfaces/ast.interface';
import { Rule } from 'src/app/shared/interfaces/rule.interface';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  CONSTRAINT_MATCH = /%\s*@constraint(?:(.+)\n)+/g;
  DOC_MATCH = /(%.*)+/g;
  DESCRIPTION_EXTRACT = /@constraint\s+(.*)/;

  RULE_SPLIT = /%\s*(?:(.+)\n)+/g;
  DOC_SPLIT_MATCH = /(%)+[^\n]*\n/g;
  DOC_SPLIT_DESCRIPTION_EXTRACT = /\s+(.*)/;

  SOFT_MATCH = /soft([^%)])./g;
  HARD_MATCH = /hard([^%)])./g;
  ASP_MATCH = /^[^%].*/gm;
  TYPE_EXTRACT = /(\w+)\(/;
  NAME_EXTRACT = /\((\w+),?.*?\)/;
  WEIGHTS_MATCH = /#const.*/g;
  WEIGHT_NAME_EXTRACT = /#const\s+(\w+?)_weight/;
  WEIGHT_VALUE_EXTRACT = /=\s*(\d+)/;

  HIERARCHY_DIVIDER = '_';

  parser: any;
  parserOptions = { keepUpperRules: true };

  ast: BehaviorSubject<AST> = new BehaviorSubject<AST>(null);

  constructor() {
    //console.log(this.constraints2json(constraints.SOFT));
    //console.log(this.asp2json(constraints.DEFINE));

    this.parser = new Grammars.W3C.Parser(ASP, this.parserOptions);

    /*console.time("DEFINE");
    const ast = this.getAST(constraints.DEFINE);
    const statements = this.extractStatements(ast);
    const facts = this.getFacts(statements, []);
    const integrity_constraints = this.getIntegrityConstraints(statements, []);
    console.log(statements, facts, integrity_constraints);
    console.timeEnd("DEFINE");*/



    /*console.time("SOFT");
    console.log(this.getAST(constraints.SOFT));
    console.timeEnd("SOFT");*/

    /*console.time("HARD");
    console.log(this.getAST(constraints.HARD));
    console.timeEnd("HARD");*/

  }

  getAST(asp: string): AST {
    return this.parser.getAST(this.rmWS(this.rpNL(asp)));
  }

  /**
   * Return facts (rules without body)
   * @param ast 
   */
  getFacts(ast: AST, facts: AST[] = []): AST[] {
    if (ast.type !== "fact") {
      for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i];
        facts = this.getFacts(child, facts);
      }
    } else {
      facts.push(ast);
    }

    return facts;
  }

  /**
   * Return integrity constraints (rules without head)
   * @param ast 
   */
  getIntegrityConstraints(ast: AST, integrity_constraints: AST[] = []): AST[] {
    if (ast.type !== "integrity_constraint") {
      for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i];
        integrity_constraints = this.getIntegrityConstraints(child, integrity_constraints);
      }
    } else {
      integrity_constraints.push(ast);
    }

    return integrity_constraints;
  }

  /**
   * Return variables (starting with upper case letter)
   * (every found variable only once)
   * @param ast
   */
  getVariables(ast: AST, variables: AST[] = []): AST[] {
    if (ast.type !== "VARIABLE") {
      for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i];
        variables = this.getVariables(child, variables);
      }
    } else if (variables.filter(el => el.text === ast.text).length == 0) {
      variables.push(ast);
    }

    return variables;
  }

  /**
   * Recursively search and return all entries to given feature
   * (every found feature only once)
   * @param ast of input code
   * @param feature_identifier of desired features
   * @param features recursive paramter to transmit features
   * @returns desired features
   */
  getFeature(ast: AST, feature_identifier: string, features: AST[] = []): AST[] {
    if (ast.type !== feature_identifier) {
      for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i];
        features = this.getFeature(child, feature_identifier, features);
      }
    } else if (features.filter(el => el.text === ast.text).length == 0) {
      features.push(ast);
    }

    return features;
  }

  /**
   * Extract statements and removes all other types
   * @param ast 
   */
  extractStatements(ast: AST): AST {
    const filtered_children = ast.children.filter(line => line.type === "statement");
    ast.children = filtered_children;
    return ast;
  }

  /**
   * Remove whitespaces
   * @param text 
   */
  private rmWS(text: string): string {
    return text.replace(/ /g, '');
  }

  /**
   * Replace line breaks with line break character
   * @param text 
   */
  private rpNL(text: string): string {
    return text.replace(/(\r\n|\n|\r)/gm, '\n');
  }

  asp2json(asp: string): Rule[] {
    const constraints = asp.split('\n').filter(e => e);
    //const n_rules = constraints.filter(e => !e.startsWith('%'));

    let comments = [];

    const rules = [];

    constraints.forEach(row => {
      if (row.match(this.DOC_MATCH)) {
        comments.push(row);
      } else {
        let description = comments.pop();
        rules.push({
          titles: comments ? comments : [],
          doc: description ? (description.match(this.DESCRIPTION_EXTRACT) ? this.getDoc(description) : description) : '',
          asp: row
        });
      }
    })

    return rules;
  }

  dracoASP2json(asps: string): Constraint[] {
    const rules = asps.match(this.RULE_SPLIT);
    if (!this.getAST(asps)) {
      throw Error('invalid asp');
    }
    return rules.map((s): Constraint => {
      const doc = this.getDocDraco(s);
      const asp = this.getAsp(s);
      return {
        ...doc,
        ...asp,
        constraintType: null
      };
    });
  }

  isConstraint(asp: string): boolean {
    return asp.match(this.SOFT_MATCH) !== null || asp.match(this.HARD_MATCH) !== null;
  }

  constraints2json(constraintsAsp: string, weightsAsp?: string): Constraint[] {
    const constraints = constraintsAsp.match(this.CONSTRAINT_MATCH);
    if (!constraints) {
      throw Error('invalid constraints');
    }
    const result = constraints.map((s): Constraint => {
      const doc = this.getDoc(s);
      const asp = this.getAsp(s);
      return {
        ...doc,
        ...asp,
        constraintType: null
      };
    });
    if (weightsAsp) {
      const weights = weightsAsp.match(this.WEIGHTS_MATCH);
      const weightMap = this.getWeightMap(weights);
      if (!weights) {
        throw Error('invalid weights');
      }
      for (const constraint of result) {
        const name = constraint.name;
        constraint.weight = weightMap[name];
      }
    }
    return result;
  }
  getDocDraco(s) {
    const docMatch = s.match(this.DOC_SPLIT_MATCH);
    if (docMatch) {
      const docString = docMatch[0];
      const descriptionParts = this.DOC_SPLIT_DESCRIPTION_EXTRACT.exec(docString);
      if (descriptionParts) {
        return {
          description: descriptionParts[1],
        };
      }
    }
    return null;
  }
  getDoc(s) {
    const docMatch = s.match(this.DOC_MATCH);
    if (docMatch) {
      const docString = docMatch[0];
      const descriptionParts = this.DESCRIPTION_EXTRACT.exec(docString);
      if (descriptionParts) {
        return {
          description: descriptionParts[1],
        };
      }
    }
    return null;
  }
  getAsp(s) {
    const aspMatch = s.match(this.ASP_MATCH);
    if (aspMatch) {
      const asp = aspMatch.join('\n');
      const type = 'rule';
      const nameExtract = this.NAME_EXTRACT.exec(asp);
      if (!nameExtract) {
        throw Error(`invalid asp: ${asp}`);
      }
      const name = nameExtract[1];
      const hierarchy = name.split(this.HIERARCHY_DIVIDER);
      return {
        type,
        name,
        asp,
        hierarchy
      };
    }
    return null;
  }
  getWeightMap(weights) {
    const map = {};
    for (const weight of weights) {
      const nameExtract = this.WEIGHT_NAME_EXTRACT.exec(weight);
      if (!nameExtract) {
        throw Error(`invalid weight: ${weight}`);
      }
      const name = nameExtract[1];
      const valueExtract = this.WEIGHT_VALUE_EXTRACT.exec(weight);
      if (!valueExtract) {
        throw Error(`invalid weight: ${weight}`);
      }
      const value = +valueExtract[1];
      map[name] = value;
    }
    return map;
  }
}