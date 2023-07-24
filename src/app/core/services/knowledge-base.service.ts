import { Injectable } from '@angular/core';
import { constraints } from 'draco-core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { concatAll, map } from 'rxjs/operators';
import { ParserService } from 'src/app/features/explorer/services/parser.service';
import { AST } from 'src/app/shared/interfaces/ast.interface';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';
import { Constraints } from 'src/app/shared/interfaces/constraints.interface';
import { Feature } from 'src/app/shared/interfaces/feature.interface';
import { Graph } from 'src/app/shared/interfaces/graph.interface';
import { HierarchyGroupedEntry } from 'src/app/shared/interfaces/hierarchy-grouped-entry.interface';
import { HierarchyGrouped } from 'src/app/shared/interfaces/hierarchy-grouped.interface';
import { Hierarchy } from 'src/app/shared/interfaces/hierarchy.interface';
import { Hyperlink } from 'src/app/shared/interfaces/hyperlink.interface';
import { Node } from 'src/app/shared/interfaces/node.interface';
import { RadialHypergraphData } from 'src/app/shared/interfaces/radial-hypergraph-data.interface';
import { SelectedSet } from 'src/app/shared/interfaces/solution-set.interface';
import { ASP_CONSTRAINT_TYPE } from 'src/app/shared/models/asp-constraint-type.model';
import { ASP_FEATURE_TYPE } from 'src/app/shared/models/asp-feature-type.model';
import { features } from '../models/features.model';
import { DatabaseHelperService } from './database-helper.service';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {

  private _loaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _constraints: Constraints = {};

  private _variables: any;
  private _identifiers: any;

  private _nodes_soft: BehaviorSubject<Node[]> = new BehaviorSubject<Node[]>([]);
  private _links_soft: BehaviorSubject<Hyperlink[]> = new BehaviorSubject<Hyperlink[]>([]);
  private _nodes_hard: BehaviorSubject<Node[]> = new BehaviorSubject<Node[]>([]);
  private _links_hard: BehaviorSubject<Hyperlink[]> = new BehaviorSubject<Hyperlink[]>([]);

  private _selectedVizRecSets: BehaviorSubject<SelectedSet[]> = new BehaviorSubject<SelectedSet[]>(null);
  private _hoveredVizRecSet: BehaviorSubject<SelectedSet> = new BehaviorSubject<SelectedSet>(null);

  private _selectedHypergraphSet: BehaviorSubject<Constraint[]> = new BehaviorSubject<Constraint[]>(null);
  private _hoveredHypergraphSet: BehaviorSubject<Constraint[]> = new BehaviorSubject<Constraint[]>(null);
  private _filteredHypergraphSet: BehaviorSubject<Constraint[]> = new BehaviorSubject<Constraint[]>(null);

  setSelectedVizRecSets(selected: SelectedSet[]) {
    this._selectedVizRecSets.next(selected);
  }

  get selectedVizRecSets(): Observable<SelectedSet[]> {
    return this._selectedVizRecSets;
  }

  setHoveredVizRecSet(hovered: SelectedSet) {
    this._hoveredVizRecSet.next(hovered);
  }

  get hoveredVizRecSet(): Observable<SelectedSet> {
    return this._hoveredVizRecSet;
  }

  setSelectedHypergraphSet(selected: Constraint[]) {
    this._selectedHypergraphSet.next(selected);
  }

  get selectedHypergraphSet(): Observable<Constraint[]> {
    return this._selectedHypergraphSet;
  }

  setHoveredHypergraphSet(hovered: Constraint[]) {
    this._hoveredHypergraphSet.next(hovered);
  }


  get filteredHypergraphSet(): Observable<Constraint[]> {
    return this._filteredHypergraphSet;
  }

  setFilteredHypergraphSet(filtered: Constraint[]) {
    this._filteredHypergraphSet.next(filtered);
  }


  get hoveredHypergraphSet(): Observable<Constraint[]> {
    return this._hoveredHypergraphSet;
  }

  constructor(private parserService: ParserService, private dbService: DatabaseService, private dbHelperService: DatabaseHelperService) {
    this.loadData();
  }

  get loaded(): Observable<boolean> {
    return this._loaded;
  }

  get nodes_soft(): Observable<Node[]> {
    return this._nodes_soft;
  }

  get links_soft(): Observable<Hyperlink[]> {
    return this._links_soft;
  }

  get nodes_hard(): Observable<Node[]> {
    return this._nodes_hard;
  }

  get links_hard(): Observable<Hyperlink[]> {
    return this._links_hard;
  }

  loadData() {
    const o1$ = this.extractConstraints();

    const o2$ = this.extractFeatures();

    forkJoin([o1$, o2$]).subscribe(([constraints, features]: any) => {
      //console.log(constraints, features);

      const o3$ = this.extractNodesAndLinks(ASP_CONSTRAINT_TYPE.SOFT).pipe(concatAll());
      const o4$ = this.extractNodesAndLinks(ASP_CONSTRAINT_TYPE.HARD).pipe(concatAll());

      forkJoin([o3$, o4$]).subscribe(([hypergraphSoft, hypergraphHard]: any) => {
        //console.log(hypergraphSoft, hypergraphHard);

        this._constraints.soft = constraints[0];
        this._constraints.hard = constraints[1];

        this.extractHierarchies(ASP_CONSTRAINT_TYPE.SOFT, this._constraints.soft);
        this.extractHierarchies(ASP_CONSTRAINT_TYPE.HARD, this._constraints.hard);

        this._loaded.next(true);
      });
    });
  }

  private extractConstraints(): Observable<any> {
    const _this = this;

    const observeables: Observable<any>[] = [];
    if (!this._constraints.soft) {
      const o1 = this.dbService.count(ASP_CONSTRAINT_TYPE.SOFT).pipe(map(count => {
        if (count === 0) {
          this._constraints.soft = this.parserService.constraints2json(constraints.SOFT, constraints.WEIGHTS);
          return this.dbHelperService.addRules(ASP_CONSTRAINT_TYPE.SOFT, this._constraints.soft).pipe(map(() => this._constraints.soft));
        } else {
          return this.dbService.getAll(ASP_CONSTRAINT_TYPE.SOFT);
        }
      }));
      observeables.push(o1.pipe(concatAll()));
    } else {
      observeables.push(of(this._constraints.soft));
    }

    if (!this._constraints.hard) {
      const o2 = this.dbService.count(ASP_CONSTRAINT_TYPE.HARD).pipe(map(count => {
        if (count === 0) {
          this._constraints.hard = this.parserService.constraints2json(constraints.HARD);
          return this.dbHelperService.addRules(ASP_CONSTRAINT_TYPE.HARD, this._constraints.hard).pipe(map(() => this._constraints.hard));
        } else {
          return this.dbService.getAll(ASP_CONSTRAINT_TYPE.HARD);
        }
      }));
      observeables.push(o2.pipe(concatAll()));
    } else {
      observeables.push(of(this._constraints.hard));
    }

    return forkJoin(observeables);
  }

  private extractFeatures() {
    const db_name = 'features';
    // Get ast from SOFT, HARD, DEFINE
    const asps = constraints.DEFINE + constraints.SOFT + constraints.HARD;
    return this.dbService.count(db_name).pipe(map(num_variables => {
      if (num_variables === 0) {
        const ast = this.parserService.getAST(asps);
        let observeables = [];
        features.forEach((feature, f_i: number) => {
          let entries = this.parserService.getFeature(ast, feature.grammar_name).map((entry, i) => {
            return { id: i, name: entry.text, description: entry.text };
          });
          observeables.push(this.dbService.add(db_name, { name: feature.id, entries: entries }).pipe(map(() => entries)));
        });
        return forkJoin(observeables);
      } else {
        return this.dbService.getAll(db_name);
      }
    }), concatAll());
  }

  private extractNodesAndLinks(constraintType: ASP_CONSTRAINT_TYPE): Observable<any> {
    const database_name = 'hyperlinks';

    // If nodes and links aready exist in database, get them and store locally - otherwise, extract and store them in database
    return this.dbService.count(database_name).pipe(map(num_elements => {
      if (num_elements === 0) {
        return this.dbService.getAll(constraintType).pipe(map(db_constraints => {
          return forkJoin(features.map(feature => {
            let name = constraintType + '_' + feature.id;

            const temp_nodes = <any>[];

            return this.dbService.getByKey('features', 'name', feature.id).pipe(map(db_features => {
              const links_db = [];
              const asts: Observable<AST>[] = [];


              db_constraints.forEach((constraint: any, i: number) => {
                temp_nodes.push({ ...constraint, constraintType: constraintType, weight: typeof constraint.weight !== "undefined" ? constraint.weight : -1 });

                const ast = this.parserService.getAST(constraint.asp);
                const features_asp = this.parserService.getFeature(ast, feature.grammar_name);

                let _i = 0;
                const links_db_ids = links_db.map(l => l.feature_id);
                features_asp.forEach((feature: AST, i: number) => {
                  const name = feature.text;

                  // @ts-ignore
                  const db_feature: any = db_features.entries.filter(db_f => db_f.name === name)[0];

                  const links_filtered_index: number = links_db_ids.indexOf(db_feature.id);

                  if (links_filtered_index === -1) {
                    links_db.push({ feature_id: db_feature.id, feature_name: name, constraintType: constraintType, ids: [constraint.id], names: [constraint.name], weights: [constraint.weight || constraint.weight == 0 ? constraint.weight : -1] });
                  } else {
                    links_db[links_filtered_index] = {
                      feature_id: db_feature.id,
                      feature_name: name,
                      constraintType: constraintType,
                      ids: [...links_db[links_filtered_index].ids, constraint.id],
                      names: [...links_db[links_filtered_index].names, constraint.name],
                      weights: [...links_db[links_filtered_index].weights, constraint.weight || constraint.weight == 0 ? constraint.weight : -1],
                    };
                  }
                });
              });

              // delete all links which consist of only one node
              const temp_links: Hyperlink[] = links_db.filter((link: Hyperlink) => link.ids.length >= 2);
              const nodesSorted = temp_nodes.sort((a, b) => { return a.name > b.name ? 1 : a.name == b.name ? 0 : -1 });

              // add to database
              this.dbService.add(database_name, { name: name, contraintType: constraintType, feature: feature, nodes: temp_nodes, nodesSorted: nodesSorted, links: temp_links });

              return { nodes: temp_nodes, nodesSorted: nodesSorted, links: temp_links };
            }));
          }));
        }), concatAll());
      } else {
        return this.dbService.getAll(database_name).pipe(map((db_nodes_links: any) => {
          //console.log(db_nodes_links);
          return { nodes: db_nodes_links.nodes, nodesSorted: db_nodes_links.nodesSorted, links: db_nodes_links.links };
        }));
      }
    }, concatAll()));
  }

  private extractHierarchies(constraintType: ASP_CONSTRAINT_TYPE, constraints: Constraint[]) {
    const database_name = 'hierarchies';

    // sort nodes by names (basically a hierarchical sort over all hierarchy levels of name)
    const nodesSorted = constraints.sort((a, b) => { return a.name > b.name ? 1 : a.name == b.name ? 0 : -1 });

    const unGroupedhierarchy = this.getHierarchy(nodesSorted);
    const groupedHierarchy = this.groupHierarchyByNames(unGroupedhierarchy);

    // add to database
    this.dbService.count(database_name).subscribe(count => {
      if (count === 0) {
        this.dbService.add(database_name, { constraintType: constraintType, hierarchy: unGroupedhierarchy.hierarchy, groupedHierarchy: groupedHierarchy.hierarchy });
      }
    });
  }

  private groupHierarchyByNames(unGroupedHierarchy: Hierarchy): HierarchyGrouped {
    const grouped: HierarchyGroupedEntry[][] = [];
    unGroupedHierarchy.hierarchy.forEach((level, i) => {
      grouped[i] = [];
      level.forEach((entry, j) => {
        if (j > 0 && level[j - 1].name == entry.name && Math.abs(entry.i - level[j - 1].i) == 1) {
          const pi = grouped[i].length - 1; // previous index
          grouped[i][pi].indices.push(entry.i);
          grouped[i][pi].ids.push(entry.id);
          grouped[i][pi].weights.push(entry.weight);
        } else {
          grouped[i].push({ name: entry.name, hierarchy: entry.hierarchy, level: i, indices: [entry.i], ids: [entry.id], weights: [entry.weight] })
        }
      });
    });

    return { hierarchy: grouped };
  }

  private getHierarchy(nodes): Hierarchy {
    const hierarchy = [];
    nodes.forEach((node: Node, i: number) => {
      node.hierarchy.forEach((el: string, level: number) => {
        if (!hierarchy[level]) {
          hierarchy[level] = [];
        }
        hierarchy[level].push({ name: el, hierarchy: node.hierarchy.slice(0, level + 1), i: i, id: node.id, weight: node.weight });
      });
    });

    return { hierarchy: hierarchy };
  }

  getRadialHypergraphData(constraintType: ASP_CONSTRAINT_TYPE, feature: Feature): Observable<RadialHypergraphData> {
    return forkJoin(this.getNodesAndLinks(constraintType, feature), this.getGroupedHierarchy(constraintType)).pipe(map((data: [Graph, HierarchyGrouped]) => {
      return {
        graph: data[0],
        hierarchy: data[1].hierarchy,
        feature: feature
      }
    }));
  }

  getGroupedHierarchy(constraintType: ASP_CONSTRAINT_TYPE): Observable<HierarchyGrouped> {
    return this.dbService.getByKey('hierarchies', 'constraintType', constraintType).pipe(map((db_hierarchy) => {
      const filterConstraints = this._filteredHypergraphSet.getValue();
      if (filterConstraints) {
        const _hierarchy = this.getHierarchy(filterConstraints);
        return this.groupHierarchyByNames(_hierarchy);
      }

      // @ts-ignore
      return { hierarchy: db_hierarchy.groupedHierarchy };
    }));
  }

  getNodesAndLinks(constraintType: ASP_CONSTRAINT_TYPE, feature: Feature): Observable<Graph> {

    const database_name = 'hyperlinks';
    const name = constraintType + '_' + feature.id;

    return this.dbService.getByKey(database_name, 'name', name).pipe(map((db_nodes_links: any) => {
      let graph: Graph = { nodes: null, nodesSorted: null, links: null };
      let filtered: Graph;
      let filterConstraints: Constraint[] = this._filteredHypergraphSet.getValue();

      if (filterConstraints) {
        filtered = this.filterNodesAndLinks(db_nodes_links.nodes, db_nodes_links.nodesSorted, db_nodes_links.links, filterConstraints);
      }

      graph.nodes = filtered ? filtered.nodes : db_nodes_links.nodes;
      graph.nodesSorted = filtered ? filtered.nodesSorted : db_nodes_links.nodesSorted;
      graph.links = filtered ? filtered.links : db_nodes_links.links;

      if (constraintType == ASP_CONSTRAINT_TYPE.SOFT) {
        this._nodes_soft.next(graph.nodes);
        this._links_soft.next(graph.links);
      }
      if (constraintType == ASP_CONSTRAINT_TYPE.HARD) {
        this._nodes_hard.next(graph.nodes);
        this._links_hard.next(graph.links);
      }

      return graph;
    }));
  }

  private filterNodesAndLinks(nodes: Node[], nodesSorted: Node[], links: Hyperlink[], filterConstraints: Constraint[]): Graph {
    let _nodes = nodes.filter(node => filterConstraints.some((constraint: any) => constraint.id == node.id));
    let _nodesSorted = nodesSorted.filter(node => filterConstraints.some((constraint: any) => constraint.id == node.id));
    let _links: Hyperlink[] = links.map(link => { return { ...link, ids: link.ids.filter(id => filterConstraints.some((constraint: any) => id == constraint.id)) } });
    _links = _links.filter((link: any) => link.ids.length >= 2);

    return { nodes: _nodes, nodesSorted: _nodesSorted, links: _links };
  }
}
