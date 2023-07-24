import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { SelectedSet, SolutionSet } from 'src/app/shared/interfaces/solution-set.interface';

import * as d3 from 'd3';
import embed, { EmbedOptions } from 'vega-embed';
import { KnowledgeBaseService } from 'src/app/core/services/knowledge-base.service';
import { Subscription } from 'rxjs';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';
import { sum } from 'd3';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss']
})
export class RecommendationsComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild("diagrams") private diagrams: ElementRef<HTMLElement>;
  @ViewChild("diagramsSelected") private diagramsSelected: ElementRef<HTMLElement>;
  @ViewChild("chartDummy") private chartDummy: ElementRef<HTMLElement>;

  selectedVizRecSets: SelectedSet[] = [];
  hoveredVizRecSet: SelectedSet;
  selectedHypergraphSet: Constraint[];
  hoveredHypergraphSet: Constraint[];

  subscriptions: Subscription[] = [];


  @ViewChild("legend") private legend: ElementRef<HTMLElement>;
  @ViewChild("zommedChart") private zommedChart: ElementRef;
  _legendVisible = false;
  _legendData = {
    title: "",
    id: null,
    description: null,
    model: null,
    spec: null,
    visEl: null,
    weight: 0,
    hasContent: false // true ... has content, false ... does not have content
  }
  _legendPos = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  }
  _legendHovered = false;
  _legendFadeOut = false;

  _data: SolutionSet;
  @Input() set data(data: SolutionSet) {
    this._data = data;
    if (data && data.specs && data.specs.length > 0) {
      this.draw();
    }
  }

  constructor(private knowledgeBaseSerice: KnowledgeBaseService, private renderer: Renderer2) {
    const selectedHypergraphSet = this.knowledgeBaseSerice.selectedHypergraphSet.subscribe(selected => {
      if (selected) {
        this.selectedHypergraphSet = selected;
        this.showConstraintsViolations(selected);
      }
    });
    const hoveredHypergraphSet = this.knowledgeBaseSerice.hoveredHypergraphSet.subscribe(hovered => {
      if (hovered) {
        this.hoveredHypergraphSet = hovered;
        this.showConstraintsViolations(hovered);
      }
    });
    this.subscriptions.push(selectedHypergraphSet);
    this.subscriptions.push(hoveredHypergraphSet);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    /*this.legend.nativeElement.addEventListener("mouseenter", (e) => {
      this._legendHovered = true;
      this._legendVisible = true;
      d3.select("#chart-" + this._legendData.id).classed("hovered", true);
    });
    this.legend.nativeElement.addEventListener("mouseleave", (e) => {
      this._legendHovered = false;
      this._legendVisible = false;
      this._legendFadeOut = true;
      d3.select("#chart-" + this._legendData.id).classed("hovered", false);
    });*/
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  showConstraintsViolations(constraints: Constraint[]) {
    const charts = d3.selectAll(".chart")
    charts.classed("violated", false);
    charts.selectAll(".rec>.cost").style("display", "block");

    let total = [], multiple = [], found = false;
    if (constraints.length > 0) {
      //console.log(constraints);
      this._data.models.forEach((model, i) => {
        constraints.forEach((constraint, j) => {
          const violated = model.violations.filter(violation => constraint.name == violation.name && constraint.constraintType == violation.type);
          if (violated.length != 0) {
            total.push(violated.length * violated[0].weight);
            found = true;
          }
          if (violated.length > 1) {
            multiple.push(violated);
          }
        });

        if (found) {
          d3.select("#chart-" + i + ">.rec>.cost").style("display", "none");
          d3.select("#chart-" + i).classed("violated", true);
          const costEl = d3.select("#chart-" + i + ">.overlay.cost");
          costEl.select("span:first-child").html("" + sum(total));
          costEl.select("span:last-child").html("/" + this._data.models[i].costs[0]);
          d3.select("#chart-" + i + ">.overlay.number-multiples").html(multiple.length > 0 ? multiple.length + " rule" + (multiple.length > 1 ? "s" : "") + " multiple times" : "");
          d3.select("#chart-" + i + ">.overlay.number-violations").html(total.length + " violated rule" + (total.length > 1 ? "s" : ""));
          found = false;
          multiple = [];
          total = [];
        }
      });
    }
  }

  draw() {
    let _this = this;
    this.diagrams.nativeElement.innerHTML = "";

    /* Source: https://github.com/vega/vega-embed */
    const options: EmbedOptions = {
      width: 150,
      height: 150,
      padding: 10,
      renderer: 'canvas',
      actions: true
    };

    this._data.specs.forEach((spec, i) => {
      const cost = this._data.models[i].costs[0];

      const dummy = d3.select(this.chartDummy.nativeElement).clone(true);

      // embed vega-lite chart
      const vega = dummy.select('.vega');
      dummy.select('.cost>span').html("" + cost);
      this.embedVis(vega.node() as HTMLElement, spec, options);

      dummy.select(".title").text("Chart " + (i + 1))
      dummy.attr("id", "chart-" + i)
        .classed("hidden", false)
        .on("click", function (e) {
          const index = +this.id.split('-')[1];
          const model = _this._data.models[index];
          const spec = _this._data.specs[index];

          _this.selectedVizRecSets.forEach((set: SelectedSet, i: number) => {
            d3.select(".selected-" + i).classed("selected-" + i, false);
          });

          const selected = _this.selectedVizRecSets.map(set => set.index).includes(i);

          const chart = d3.select(dummy.node());
          chart.classed("locked", selected ? false : chart.classed("locked"));
          chart.classed("selected", !selected);

          if (!selected) {
            _this.selectedVizRecSets.push({ model: _this._data.models[index], spec: _this._data.specs[index], index: index });
          } else if (selected && _this.selectedVizRecSets.length - 1 > 0) {
            const index = _this.selectedVizRecSets.map(set => set.index).indexOf(i);
            _this.selectedVizRecSets.splice(index, 1);
          } else {
            _this.selectedVizRecSets = [];
          }

          if (_this.selectedVizRecSets.length > 2) {
            const old = _this.selectedVizRecSets.shift();
            d3.select("#chart-" + old.index).classed("locked", false).classed("selected", false);
          }

          _this.diagramsSelected.nativeElement.innerHTML = "";
          _this.selectedVizRecSets.forEach((set: SelectedSet, i: number) => {
            const chart = d3.select("#chart-" + set.index);
            chart.classed("selected-" + i, true);
            chart.select(".multi-selection-number").text(i + 1);

            //const oldCanvas = _this.cloneCanvas(chart.select("canvas"));
            //const cloned = chart.clone(true).attr("id","#chart-cloned-" + set.index );
            //const newCanvas = _this.replaceCanvas(cloned.select("canvas"), oldCanvas);

            //_this.diagramsSelected.nativeElement.appendChild(chart.node() as HTMLElement);
          });
          if (_this.selectedVizRecSets.length > 0) {
            //d3.select(".diagrams-selected").style("opacity",1).style("height","auto");
            const data = _this.selectedVizRecSets[_this.selectedVizRecSets.length-1];
            
            _this._legendVisible = true; // changed to not visible
            _this._legendFadeOut = false; // changed to not visible
            _this._legendData.title = "Chart " + (data.index + 1);
            _this._legendData.id = data.index;
            _this._legendData.hasContent = true;
            _this._legendData.weight = data.model.costs[0];
            _this._legendData.model = data.model;
            _this._legendData.spec = data.spec;
            _this._legendHovered = false;
            _this._legendVisible = true;
          } else {
            _this._legendVisible = false;
            _this._legendFadeOut = true;
            _this._legendHovered = false;
          }

          _this.knowledgeBaseSerice.setSelectedVizRecSets(_this.selectedVizRecSets);
        })
        .on("mouseenter", function (e) {
          const index = +this.id.split('-')[1];
          const model = _this._data.models[index];
          const spec = _this._data.specs[index];
          //console.log(this, spec,model);
          const selected = _this.selectedVizRecSets.map(set => set.index).includes(i);
          if (!selected) {
            _this.hoveredVizRecSet = { model: model, spec: spec, index: index };
            _this.knowledgeBaseSerice.setHoveredVizRecSet(_this.hoveredVizRecSet);
          }

          // const container = document.createElement("div");
          //_this.embedVis(container, spec, {...options, renderer: 'svg', actions: false});
          //_this.updateTooltipVis(<any>container);
        })
        .on("mouseleave", function (e) {
          _this.knowledgeBaseSerice.setHoveredVizRecSet(null);
          /*_this._legendVisible = false;
          setTimeout(() => {
            if (!_this._legendHovered && !_this._legendVisible) {
              _this._legendFadeOut = true;
              _this._legendHovered = false;
            }
          }, 1000);*/
        });

      dummy.select(".multiple-selection")
        .on("click", function (e) {
          const chart = d3.select(dummy.node());
          const locked = chart.classed("locked");
          chart.classed("locked", !locked);
        });

      this.diagrams.nativeElement.appendChild(dummy.node() as HTMLElement);
    });
  }

  private cloneCanvas(oldCanvas) {
    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    //return the new canvas
    return newCanvas;
  }
  private replaceCanvas(oldCanvas, newCanvas) {
    oldCanvas.getContext('2d').drawImage(newCanvas, 0, 0);
  }

  private embedVis(container: HTMLElement, spec, options: EmbedOptions) {
    embed(container, spec, options).then(result => {
      //result.view.renderer('svg');
    });
  }

  private updateTooltipVis(vis: HTMLElement) {
    if (vis) {
      // remove old content
      const childElements = this.zommedChart.nativeElement.childNodes;
      for (let child of childElements) {
        this.renderer.removeChild(this.zommedChart.nativeElement, child);
      }

      // add new content
      this.renderer.appendChild(this.zommedChart.nativeElement, vis);
    }
  }

  closeLegend() {
    this._legendVisible = false;
    this._legendFadeOut = true;
    this._legendHovered = false;
  }
}
