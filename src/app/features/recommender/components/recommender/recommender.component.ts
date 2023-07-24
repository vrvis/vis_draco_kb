import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { first } from 'rxjs/operators';

import * as ace from "ace-builds";
import { ParserService } from 'src/app/features/explorer/services/parser.service';
import { DracoService } from '../../services/draco.service';
import { ASPFeatures } from 'src/app/shared/interfaces/asp-features.interface';
import { AST } from 'src/app/shared/interfaces/ast.interface';
import { ASP_IDENTIFIERES } from 'src/app/shared/models/asp-identifiers.model';

import { DatabaseService } from 'src/app/core/services/database.service';
import { KnowledgeBaseService } from 'src/app/core/services/knowledge-base.service';
import { Subscription } from 'rxjs';
import { SelectedSet, SolutionSet } from 'src/app/shared/interfaces/solution-set.interface';
import { Hyperlink } from 'src/app/shared/interfaces/hyperlink.interface';
import { Node } from 'src/app/shared/interfaces/node.interface';
import { ASP_CONSTRAINT_TYPE } from 'src/app/shared/models/asp-constraint-type.model';
import { ASP_FEATURE_TYPE } from 'src/app/shared/models/asp-feature-type.model';

import { breakpoints } from '../../../../../_breakpoints';
import { INTERACTION_TYPE } from 'src/app/shared/models/interaction-type.model';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { RadialHypergraphData } from 'src/app/shared/interfaces/radial-hypergraph-data.interface';
import { HierarchyGroupedEntry } from 'src/app/shared/interfaces/hierarchy-grouped-entry.interface';
import { features } from 'src/app/core/models/features.model';
import { Feature } from 'src/app/shared/interfaces/feature.interface';


interface ConstraintFilterCategories extends HierarchyGroupedEntry {
  selected: boolean;
}

@Component({
  selector: 'app-recommender',
  templateUrl: './recommender.component.html',
  styleUrls: ['./recommender.component.scss']
})
export class RecommenderComponent implements OnInit, OnDestroy, AfterViewInit {
  knowledgeBaseDataLoading = true;

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;

  direction = window.innerWidth < breakpoints.lg ? "vertical" : "horizontal";
  gutter = {
    recommender: {
      current: "expanded",
      minSize: 32, /* in pixel */
      maxSize: 301, /* in pixel */
      lock: false,
      size: <any>[301, 301] /* first ... current value, second ... default value */
    },
    recommendations: {
      current: "expanded",
      minSize: 30, /* in pixel */
      maxSize: '*', /* in pixel */
      lock: false,
      size: <any>[window.innerWidth * 3 / 10, window.innerWidth * 3 / 10] /* in pixel */
    },
    knowledgeBaseInspector: {
      current: "expanded",
      minSize: 30, /* in pixel */
      maxSize: '*', /* in pixel */
      lock: false,
      size: <any>['*', '*'] /* in pixel */
    },
    inspector: {
      current: "expanded",
      minSize: 350, /* in pixel */
      maxSize: 350, /* in pixel */
      lock: true,
      size: <any>[350, 30, 350] /* in pixel */
    }
  }

  nodes: Node[];
  links: Hyperlink[];
  radialHypergraphData: RadialHypergraphData;
  filtered: boolean = false;

  subscriptions: Subscription[] = [];

  numModels: number = 30;
  solutionSet: SolutionSet;
  selectedVizRecConstraints: (Constraint[])[];
  hoveredVizRecConstraints: (Constraint[])[];

  aceEditor: ace.Ace.Editor;

  constraintTypes = ASP_CONSTRAINT_TYPE;
  selectedConstraintType: ASP_CONSTRAINT_TYPE = ASP_CONSTRAINT_TYPE.SOFT;
  featureTypes = ASP_FEATURE_TYPE;
  features = features;
  selectedFeature: Feature = features[0];

  sample1 = `% ====== Data definitions ======
  data("assets/data/cars.json").
  num_rows(142).

  fieldtype(horsepower,number).
  cardinality(horsepower,94).

  % ====== Query constraints ======
  encoding(e0).
  :- not field(e0,horsepower).
  :- not bin(e0,_).


  `;

  sample2 = `% ====== Data definitions ======
  data("assets/data/cars.json").
  num_rows(142).

  fieldtype(horsepower,number).
  cardinality(horsepower,94).

  fieldtype(cylinders,string).
  cardinality(cylinders,5).

  fieldtype(acceleration,number).
  cardinality(acceleration,94).

  fieldtype(origin,string).
  cardinality(origin,3).

  % ====== Query constraints ======
  encoding(e0).
  :- not field(e0,horsepower).

  encoding(e1).
  :- not field(e1,cylinders).
  :- not type(e1,nominal).
  :- not channel(e1,color).

  encoding(e2).
  :- not field(e2,acceleration).

  encoding(e3).
  :- not field(e3,origin).
  :- not channel(e3,column).

  `;

  sample3 = `% ====== Data definitions ======
  data("assets/data/cars.json").
  num_rows(142).

  fieldtype(horsepower,number).
  cardinality(horsepower,94).

  fieldtype(miles_per_gallon,number).
  cardinality(miles_per_gallon,94).

  fieldtype(cylinders,string).
  cardinality(cylinders,5).

  % ====== Query constraints ======
  encoding(e0).
  :- not field(e0,horsepower).

  encoding(e1).
  :- not field(e1,miles_per_gallon).

  encoding(e2).
  :- not field(e2,cylinders).
  :- not channel(e2, color).
  :- not type(e2,nominal).


  `;

  aspFeatures: ASPFeatures = {
    asps: [],
    variables: [],
    identifiers: [],
    facts: [],
    integrity_constraints: [],
    choice_rules: [],
    cardinality_constraints: [],
    weight_constraints: [],
    optimisation_constructs: []
  };

  ast: AST;
  astSuccess: boolean = true;

  visible_diagrams = false;
  visible_hypergraph = false;
  visible_variables = false;

  // Categories selection and filtering with checkboxes
  @ViewChild('categoriesFilterSelect') categoriesFilterSelect: MatSelect;
  categoriesFilterData: ConstraintFilterCategories[] = null;
  selectedCategories: ConstraintFilterCategories[] = null;
  allCategoriesSelected = false;
  allSelectionProcess = false;
  categoryOptionChanged = false;

  constructor(private dracoSerice: DracoService, private knowledgeBaseService: KnowledgeBaseService, private parserSerice: ParserService, private databaseService: DatabaseService) {
    //console.log("Init wasm clingo");
    this.dracoSerice.init().then(() => {
      //console.log("Loaded wasm clingo");
    });

    const data_loaded_subscription = this.knowledgeBaseService.loaded.subscribe(loaded => {
      this.knowledgeBaseDataLoading = !loaded;
    });
    this.subscriptions.push(data_loaded_subscription);

    let selected_viz_rec_subscription = this.knowledgeBaseService.selectedVizRecSets.subscribe(selected => this.mapToDatabaseConstraints(selected, INTERACTION_TYPE.SELECTED));
    let hovered_viz_rec_subscription = this.knowledgeBaseService.hoveredVizRecSet.subscribe(hovered => this.mapToDatabaseConstraints(hovered ? [hovered] : null, INTERACTION_TYPE.HOVERED));
    this.subscriptions.push(selected_viz_rec_subscription);
    this.subscriptions.push(hovered_viz_rec_subscription);

    const data_filtered_subsbscription = this.knowledgeBaseService.filteredHypergraphSet.subscribe(data => {
      if (data || this.filtered) {
        this.filtered = !!data;
        this.updateRadialHypergraph();
      }
    });
    this.subscriptions.push(data_filtered_subsbscription);
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  ngAfterViewInit(): void {
    ace.config.set("fontSize", "12px");

    ace.config.set('basePath', 'assets/ace/');

    this.aceEditor = ace.edit(this.editor.nativeElement);
    this.aceEditor.session.setValue(this.sample3);

    this.aceEditor.setTheme('ace/theme/twilight');
    this.aceEditor.session.setMode('ace/mode/gringo');
  }

  @HostListener('window:resize')
  onResized(event) {
    if (window.innerWidth < breakpoints.lg) {
      this.direction = "vertical";
    } else {
      this.direction = "horizontal";
    }

    this.gutter.recommender.size = [301, 301] /* first ... current value, second ... default value */
    this.gutter.recommendations.size = [window.innerWidth * 3 / 10, window.innerWidth * 3 / 10] /* in pixel */
    this.gutter.knowledgeBaseInspector.size = ['*','*'] /* in pixel */
    this.gutter.inspector.size = [350, 30, 350] /* in pixel */
  }

  collapseOrExpand(e: { gutterNum: number; sizes: Array<number> }, hierarchy: string, gutterNum?: number, type?: any) {
    //console.log(...arguments);

    const num = e.gutterNum ? 0 : gutterNum;

    if(type && type.lock) {
      type.current = (type.size[0] == type.size[2]) ? "collapsed" : "expanded";
      if(type.size[0] == type.size[2]) {
        type.size[0] = type.size[1];
        type.minSize = type.size[1];
        type.maxSize = type.size[1];
      } else {
        type.size[0] = type.size[2];
        type.minSize = type.size[2];
        type.maxSize = type.size[2];
      }
    } else {
      if (hierarchy === 'outer') {
        const expanded_0 = this.gutter.recommender.size[0] != this.gutter.recommender.minSize;
        this.gutter.recommender.current = expanded_0 ? "collapsed" : "expanded";
        this.gutter.recommender.size = [expanded_0 ? this.gutter.recommender.minSize : this.gutter.recommender.size[1], this.gutter.recommender.size[1]];
      } else if (hierarchy === 'inner' && this.gutter.recommendations == type) {
        const expanded_0 = this.gutter.recommendations.size[0] == '*' || this.gutter.recommendations.size[0] != this.gutter.recommendations.minSize;
        const expanded_1 = this.gutter.knowledgeBaseInspector.size[0] == '*';

        type.size[0] = expanded_0 ? type.minSize : type.size[1];
        this.gutter.knowledgeBaseInspector.size[0] = '*';

        this.gutter.recommendations.current = expanded_0 ? "collapsed" : "expanded";
        this.gutter.knowledgeBaseInspector.current = expanded_0 && !expanded_1 ? "expanded" : this.gutter.knowledgeBaseInspector.current;
      } else if (hierarchy === 'inner' && this.gutter.knowledgeBaseInspector == type) {
        const expanded_0 = this.gutter.recommendations.size[0] != this.gutter.recommendations.minSize;
        const expanded_1 = this.gutter.knowledgeBaseInspector.size[0] == '*';

        type.size[0] = expanded_1 ? type.minSize : type.size[1];
        this.gutter.recommendations.size[0] = expanded_1 ? '*' : this.gutter.recommendations.size[1];

        this.gutter.knowledgeBaseInspector.current = expanded_1 ? "collapsed" : "expanded";
        this.gutter.recommendations.current = expanded_0 && !expanded_1 ? "expanded" : this.gutter.recommendations.current;
      }
    }
  }

  private mapToDatabaseConstraints(sets: SelectedSet[], type: INTERACTION_TYPE) {
    if (sets && sets.length > 0) {
      let sets_constraints_db: (Constraint[])[] = [];

      sets.forEach((set: SelectedSet, set_i: number) => {
        let set_constraints_db = [];

        const facts = set.model.facts;
        facts.forEach((fact, fact_i) => {
          if (this.parserSerice.isConstraint(fact + ".")) {
            const prepared = `% @constraint .
            ` + fact + `:-.
            `;
            const constraint: Constraint[] = this.parserSerice.constraints2json(prepared);
            this.databaseService.getByKey(ASP_CONSTRAINT_TYPE.SOFT, 'name', constraint[0].name).subscribe(soft_db => {
              // @ts-ignore
              set_constraints_db.push({ ...soft_db, constraintType: ASP_CONSTRAINT_TYPE.SOFT });

              if(fact_i == facts.length - 1) {
                sets_constraints_db.push(set_constraints_db);
              }

              if (set_i == sets.length - 1 && fact_i == facts.length - 1 && type == INTERACTION_TYPE.SELECTED) {
                this.selectedVizRecConstraints = sets_constraints_db;
              } else if (set_i == sets.length - 1 && fact_i == facts.length - 1 && type == INTERACTION_TYPE.HOVERED) {
                this.hoveredVizRecConstraints = sets_constraints_db;
              }
            });
          }
        });

      })
    } else if (type == INTERACTION_TYPE.SELECTED) {
      this.selectedVizRecConstraints = [];
    }
    else if (type == INTERACTION_TYPE.HOVERED) {
      this.hoveredVizRecConstraints = [];
    }
  }

  updateAce() {
    this.parse();
  }

  recommend() {
    this.dracoSerice.solve(this.aceEditor.getValue(), { models: this.numModels, relaxHard: false }).pipe(first()).subscribe(res => {
      console.log(res);
      this.solutionSet = res;

      if (!this.radialHypergraphData) {
        this.knowledgeBaseService.getRadialHypergraphData(this.selectedConstraintType, this.selectedFeature).pipe(first()).subscribe(data => {
          //console.log(data);

          this.radialHypergraphData = data;

          this.categoriesFilterData = data.hierarchy[0].map(category => { return {...category, selected: true}});
          this.selectedCategories = this.categoriesFilterData;
          this.allCategoriesSelected = true;
        });
      }

      this.visible_diagrams = true;
      this.visible_hypergraph = true;
    });
  }

  setSelectedConstraints(constraints: Constraint[]) {
    this.knowledgeBaseService.setSelectedHypergraphSet(constraints);
  }

  setHoveredConstraints(constraints: Constraint[]) {
    this.knowledgeBaseService.setHoveredHypergraphSet(constraints);
  }

  setFilteredConstraints(constraints: Constraint[]) {
    this.knowledgeBaseService.setFilteredHypergraphSet(constraints);
  }

  toggleAllConstraintCategoriesSelection() {
    this.categoryOptionChanged = true;
    if (this.allCategoriesSelected) {
      this.selectAllConstraintCategories();
    } else {
      this.deselectAllConstraintCategories();
    }
  }

  selectAllConstraintCategories() {
    this.categoriesFilterSelect.options.forEach((item: MatOption, i: number) => item.select());
  }

  deselectAllConstraintCategories() {
    this.categoriesFilterSelect.options.forEach((item: MatOption, i: number) => item.deselect());
  }

  optionClick() {
    this.categoryOptionChanged = true;
    let allCategoriesSelected = true;
    this.categoriesFilterSelect.options.forEach((item: MatOption) => {
      if (!item.selected) {
        allCategoriesSelected = false;
      }
    });
    this.allCategoriesSelected = allCategoriesSelected;
  }

  applyFilter() {
    if (this.categoryOptionChanged && this.selectedCategories.length > 0) {
      const ids = this.selectedCategories.map(category => category.ids).reduce((prev, curr) => prev.concat(curr));
      const filtered = this.radialHypergraphData.graph.nodes.filter((node: any) => ids.find(id => id == node.id));
      this.knowledgeBaseService.setFilteredHypergraphSet(filtered.length > 0 ? filtered : null);
      this.categoryOptionChanged = false;
    } else if(this.selectedCategories.length == 0) {
      this.knowledgeBaseService.setFilteredHypergraphSet(null);
      this.categoryOptionChanged = false;
    }
    this.categoriesFilterSelect.close();
  }
  removeAllFilters() {
    this.knowledgeBaseService.setFilteredHypergraphSet(null);
    this.categoriesFilterSelect.close();
  }

  updateRadialHypergraph() {
    //console.log(this.selectedConstraintType, this.selectedFeatureType);
    this.knowledgeBaseService.getRadialHypergraphData(this.selectedConstraintType, this.selectedFeature).pipe(first()).subscribe(data => {
      this.categoriesFilterData = data.hierarchy[0].map(category => { return {...category, selected: true}});
      this.selectedCategories = this.categoriesFilterData;
      this.allCategoriesSelected = true;

      this.radialHypergraphData = data;
    });
  }

  parse() {

    this.ast = this.parserSerice.getAST(this.aceEditor.getValue());

    this.astSuccess = (this.ast != null);
    this.visible_variables = this.astSuccess;

    if (this.astSuccess) {
      this.aspFeatures.asps = this.ast.children;
      this.aspFeatures.facts = this.parserSerice.getFeature(this.ast, ASP_IDENTIFIERES.fact);
      this.aspFeatures.integrity_constraints = this.parserSerice.getFeature(this.ast, ASP_IDENTIFIERES.integrity_constraint);
      this.aspFeatures.variables = this.parserSerice.getFeature(this.ast, ASP_IDENTIFIERES.VARIABLE);
      this.aspFeatures.identifiers = this.parserSerice.getFeature(this.ast, ASP_IDENTIFIERES.ID);
    }
  }
}
