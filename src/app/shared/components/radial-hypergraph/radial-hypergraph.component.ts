import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from "@angular/core";

import * as d3 from "d3";
import "d3-selection-multi";
import { ZoomBehavior } from "d3";
import { default as dracoHypergraph } from "../../../../assets/js/draco-hypergraph";
import { Datum } from "vega";
import { ASP_CONSTRAINT_TYPE } from "../../models/asp-constraint-type.model";

import { ResizedEvent } from "angular-resize-event";
import { Constraint, ConstraintHighlight } from "../../interfaces/constraint.interface";
import { INTERACTION_TYPE } from "../../models/interaction-type.model";
import { Order } from "../../models/order.model";
import { ColorService } from "src/app/core/services/color.service";
import { TextService } from "src/app/core/services/text.service";
import { RadialHypergraphData } from "../../interfaces/radial-hypergraph-data.interface";
import { Node, NodeHighlight } from "../../interfaces/node.interface";
import { ConstraintsHighlight } from "../../interfaces/constraints-highlight.interface";

interface FlattenedHierarchy {
  level: number,
  arc: any
}

@Component({
  selector: "app-radial-hypergraph",
  templateUrl: "./radial-hypergraph.component.html",
  styleUrls: ["./radial-hypergraph.component.scss"]
})
export class RadialHypergraphComponent implements OnInit {
  _drawn = false;
  _loading = true;

  // data
  _links: any;
  _nodes: any;
  _bilinks: any[];
  _nodes_constraints: Node[];
  _nodes_features: any;

  _highlighted: ConstraintsHighlight[] = [];

  _flattened_hierarchy: FlattenedHierarchy[];
  _isFiltered = false;

  // html elements
  _nodes_g: any;
  _links_g: any;
  _links_g_paths: any;

  // svg
  svg;
  graph;

  // positioning and dimensions
  _window_width = window.innerWidth;
  _height = 5;
  _width = 5;
  _centerX = 0;
  _centerY = 0;

  // arcs
  _arcWidth = 40;
  _arcGap = 10;
  _arcGapRadial = 0.2;
  _arcHover = 6;

  // radius
  _hypergraphRadius = 0;
  _hypergraphMinRadius = 0;
  _constraintRadius = 16; // pixels
  _featureRadius = 16; // pixels

  // constraint colormaps
  _transferColorWeights: any = d3.interpolateRdBu;
  _transferColorRainbow: any = d3.interpolateRainbow;
  _defaultColorNoWeight = "#343a40"; //"rgb(5, 48, 97)";
  _defaultForegroundColorNoWeight = "#fff";
  _ticks = 10;

  // constraints weight measurements
  _min = 1000000; // max weight of constraints
  _max = -1; // max weight of constraints
  _maxDivisor = -1;

  // interactions and simulation
  _drag: any;
  _dragged = false;
  _zoom: ZoomBehavior<any, Datum>;
  _initial_zoom = 0.20;
  _simulation: any;
  _rotating = false;
  _old_rotation = 0;
  _simulation_iterations = 0;
  _simulation_iterations_max = 30;
  _startTime = Date.now();

  // legend constraint colormap
  @ViewChild("legendTransfer") private _legendTransferEl: ElementRef<HTMLElement>;
  _legendTransferVisible = false;
  _legendTransfer = {
    rectHeight: 7,
    height: 23,
    width: -1,
    labelsTop: 22,
    rectTop: 0
  }

  // Legend additional information
  @ViewChild("legendTooltip") private _legendTooltipEl: ElementRef<HTMLElement>;
  _legendData = {
    id: null,
    title: "",
    asp: "",
    link: false, // if it is a link node (ln) or not
    nodes: new Array<Node>(), // list of nodes which are selected/hovered
    nodesHighlight: new Array<NodeHighlight>(), // list of nodes which are selected/hovered
    description: null,
    weight: 0,
    constraintType: ASP_CONSTRAINT_TYPE.SOFT,
    selected: false,
    filtered: false,
    visible: false,
    fadeOut: false,

    titleColorBackground: "#fff",
    titleColorText: "#333",
    closeButtonColor: "#333"
  }
  _legendPos = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  }
  _legendContainer = {
    padding: 0,
    margin: 10
  }

  @ViewChild("hypergraphContainer") hypergraphContainer: ElementRef;

  _data: RadialHypergraphData;
  _dataFiltered: RadialHypergraphData;
  @Input() set data(data: RadialHypergraphData) {
    this._data = data;
    if (data && data.graph.nodes && data.graph.nodes.length > 0) {
      this.prepareData();

      if (!this._drawn) {
        this.create();
        this._drawn = true;
      } else {
        this.closeLegend();
        this.update();
      }
    }
  }

  _selected: (Constraint[])[];
  @Input() set selected(selected: (Constraint[])[]) {
    this._selected = selected;
    if (this._drawn && this._highlighted) {
      this.highlight(selected, INTERACTION_TYPE.SELECTED);
    }
  }

  _hovered: (Constraint[])[];
  @Input() set hovered(hovered: (Constraint[])[]) {
    this._hovered = hovered;
    if (this._drawn && this._highlighted) {
      this.highlight(hovered, INTERACTION_TYPE.HOVERED);
    }
  }

  @Output() selectConstraints = new EventEmitter<Constraint[]>();
  @Output() hoverConstraints = new EventEmitter<Constraint[]>();
  @Output() filterConstraints = new EventEmitter<Constraint[]>();

  constructor(private colorService: ColorService, private textService: TextService) { }

  ngOnInit(): void {
  }

  @HostListener("window:resize")
  onResized(event) {
    this._window_width = window.innerWidth;
    this._width = this.hypergraphContainer.nativeElement.getBoundingClientRect().width;
    this._height = this.hypergraphContainer.nativeElement.getBoundingClientRect().height;
    this._centerX = this._width / 2;
    this._centerY = this._height / 2;
  }

  onContainerResized(event: ResizedEvent) {
    this.onResized(null);
  }

  prepareData() {
    const _this = this;
    //d3.hypergraph invocation passing links and nodes
    let hyperdata = dracoHypergraph(this._data.graph.links, [...this._data.graph.nodesSorted]);
    //d3.hypergraph links
    this._links = hyperdata.links;
    //d3.hypergraph nodes
    this._nodes = hyperdata.nodes;

    this._nodes_constraints = this._nodes.filter((d: any) => d.id && !d.link);
    this._nodes_features = this._nodes.filter((d: any) => d.id && d.link);

    const weightsTemp = this._nodes_constraints.map(node => node.weight).filter(weight => weight != null);
    this._min = Math.min(...weightsTemp);
    this._max = Math.max(...weightsTemp);
    this._maxDivisor = _this._max == 0 ? 1 : _this._max;
    this._legendTransferVisible = this._min != this._max;

    // flatten hierarchy
    this._flattened_hierarchy = this._data.hierarchy.reduce((prev, curr) => prev.concat(curr));

    //data reading from json file 
    _this._bilinks = [];

    this._links.forEach((link: any) => {
      let s = link.source = this._nodes.find((d) => d.id == link.source),
        t = link.target = this._nodes.find((d) => d.id == link.target),
        i = {}; // intermediate node
      this._nodes.push(i);
      this._links.push({ source: s, target: i }, { source: i, target: t });
      _this._bilinks.push([s, i, t]);
    });
  }

  create() {
    let _this = this;

    // svg width and center
    this._width = this.hypergraphContainer.nativeElement.getBoundingClientRect().width;
    this._height = this.hypergraphContainer.nativeElement.getBoundingClientRect().height;
    this._centerX = this._width / 2;
    this._centerY = this._height / 2;

    //zoom handler
    this._zoom = d3.zoom()
      .scaleExtent([.1, 10])
      .extent([[0, 0], [this._width, this._width]])
      .on("zoom", _this.zoomed.bind(_this));

    //drag handler
    this._drag = d3.drag()
      .on("start", _this.dragstarted.bind(_this))
      .on("drag", _this.dragged.bind(_this))
      .on("end", _this.dragended.bind(_this));

    // svg and graph creation
    this.svg = d3.select("#hypergraph");
    this.graph = this.svg.append("g");
    this.svg.call(this._zoom).call(this._zoom.transform, d3.zoomIdentity.translate(this._centerX, this._centerY).scale(_this._initial_zoom));

    // graph rotation
    this.svg.on("contextmenu", (e) => e.preventDefault());
    this.graph.on("contextmenu", (e) => e.preventDefault());
    this.svg.on("mousedown", (e: any) => {
      if (e.which == 3) {
        this.rotateGraph(e.x);
        this._rotating = true;
      }
    });
    this.svg.on("mousemove", (e) => {
      if (this._rotating) {
        this.rotateGraph(e.x);
      }
    });
    this.svg.on("mouseup", (e: any) => {
      if (this._rotating) {
        this.rotateGraph(e.x);
        this._old_rotation = e.x;
        this._rotating = false;
      }
    });

    // append nodes and links containers
    this.graph.append("g").attr("class", "links");
    this.graph.append("g").attr("class", "nodes");
    this.graph.append("g").attr("class", "arcs");

    //defs creation for markers
    let defs = this.svg.append("defs");
    let marker = defs.append("marker")
      .attr("id", "circleMarker")
      .attr("markerHeight", 5)
      .attr("markerWidth", 5)
      .attr("markerUnits", "strokeWidth")
      .attr("orient", "auto")
      .attr("refX", 0)
      .attr("refY", 0)
      .attr("viewBox", "-6 -6 12 12")
      .append("path")
      .attr("d", "M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0")
      .attr("fill", "black");

    const t = this.graph.transition().duration(0);

    this.calcNeededRadius();

    this.updateArcs(t);
    this.updateLinks(t);
    this.updateNodes(t);

    this.createSimulation();
    this.updateSimulation();

    this.createLegendTransfer();

    _this._highlighted = [];

    // set _loading false
    this._loading = false;
  }

  update() {
    const _this = this;

    const t = this.graph.transition().duration(750);

    this.calcNeededRadius();

    this.updateArcs(t);
    this.updateLinks(t);
    this.updateNodes(t);

    this.updateSimulation();

    this.updateLegendTransfer();

    this.highlight(this._highlighted.filter(set => set.type == INTERACTION_TYPE.SELECTED).map(s => s.constraints), INTERACTION_TYPE.SELECTED);
    this.highlight(this._highlighted.filter(set => set.type == INTERACTION_TYPE.HOVERED).map(s => s.constraints), INTERACTION_TYPE.HOVERED);

    this._loading = false;
  }

  createLegendTransfer() {
    const _this = this;
    this._legendTransfer.width = d3.select(this._legendTransferEl.nativeElement).node().clientWidth;
    const legendEl = d3.select(this._legendTransferEl.nativeElement).append("svg").attr("width", this._legendTransfer.width).append('g');

    const colorTicker = (ticks: number, order: Order): any => {
      return Array.from(Array(ticks + 1), (_, i) => i).map((_, i) => this._transferColorWeights(order === Order.ASC ? i / ticks : (1 - i / ticks)));
    }


    const gradient = <any>legendEl.append('defs').append('linearGradient')
      .attr('id', 'legend-transfer-defs');

    gradient.selectAll('stop')
      .data(colorTicker(_this._ticks, Order.DESC))
      .enter().append('stop')
      .attr('offset', (d: any, i: number) => (100 * i / 10) + '%')
      .attr('stop-color', d => d);

    legendEl.append('rect')
      .attr('transform', `translate(0,${_this._legendTransfer.rectTop})`)
      .attr('width', this._legendTransfer.width)
      .attr('height', _this._legendTransfer.rectHeight)
      .style('fill', 'url(#legend-transfer-defs)');

    legendEl.append('g')
      .attr('class', 'legend-transfer-ticks')
      .attr('transform', `translate(0,${_this._legendTransfer.rectTop + _this._legendTransfer.rectHeight})`)
      .selectAll('.legend-transfer-tick')
      .data(Array.from(Array(_this._ticks + 1), (_, i) => i))
      .enter()
      .append('line')
      .attr("class", "legend-transfer-tick")
      .attr("x1", (d: any, i: number) => (this._legendTransfer.width - 2) * i / _this._ticks + 1)
      .attr("x2", (d: any, i: number) => (this._legendTransfer.width - 2) * i / _this._ticks + 1)
      .attr("y1", 0)
      .attr("y2", 4);

    legendEl.append('g')
      .attr("class", "legend-transfer-label-texts")
      .attr('transform', 'translate(0,' + this._legendTransfer.labelsTop + ')').selectAll('text')
      .data(Array.from(Array(_this._ticks + 1), (_, i) => i))
      .enter().append('text')
      .attr("class", "legend-transfer-label-text")
      .attr("x", (d: any, i: number) => this._legendTransfer.width * i / _this._ticks)
      .attr("y", 0)
      .attr("text-anchor", (d: any, i: number) => i === 0 ? 'start' : i === _this._ticks ? 'end' : 'middle')
      .text((d: any, i: number) => (this._max % _this._ticks) != 0 ? (i / _this._ticks * _this._max).toFixed(1) : Math.floor(i / _this._ticks * _this._max));
  }

  updateLegendTransfer() {
    const _this = this;
    const legendEl = d3.select(this._legendTransferEl.nativeElement).select("svg");

    // remove old
    legendEl.selectAll('.legend-transfer-tick').remove();
    legendEl.selectAll('.legend-transfer-label-text').remove();

    legendEl.select('.legend-transfer-ticks').selectAll('.legend-transfer-tick')
      .data(Array.from(Array(_this._ticks + 1), (_, i) => i))
      .enter()
      .append('line')
      .attr("class", "legend-transfer-tick")
      .attr("x1", (d: any, i: number) => (this._legendTransfer.width - 2) * i / _this._ticks + 1)
      .attr("x2", (d: any, i: number) => (this._legendTransfer.width - 2) * i / _this._ticks + 1)
      .attr("y1", 0)
      .attr("y2", 4);

    legendEl.select(".legend-transfer-label-texts").selectAll('text')
      .data(Array.from(Array(_this._ticks + 1), (_, i) => i))
      .enter().append('text')
      .attr("class", "legend-transfer-label-text")
      .attr("x", (d: any, i: number) => this._legendTransfer.width * i / _this._ticks)
      .attr("y", 0)
      .attr("text-anchor", (d: any, i: number) => i === 0 ? 'start' : i === _this._ticks ? 'end' : 'middle')
      .text((d: any, i: number) => (this._max % _this._ticks) != 0 ? (i / _this._ticks * _this._max).toFixed(1) : Math.floor(i / _this._ticks * _this._max));
  }

  createSimulation() {
    //force layout definition	
    this._simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.id))//.distance(80).strength(1))
      .force("charge", d3.forceManyBody().strength(-5))
      .force("center", d3.forceCenter(0, 0))
      .force("collide", d3.forceCollide(this._featureRadius * 2));
  }

  updateSimulation() {
    const _this = this;

    this._simulation_iterations = 0;
    this._startTime = Date.now();

    this._simulation
      .nodes(this._nodes)
      .on("tick", this.ticked.bind(_this))
      .force("links", d3.forceLink(this._links))
      .alphaTarget(0)
      .alphaMin(0.3)
      .on("end", function () {
        //console.log("_simulation_iterations: " + _this._simulation_iterations);
        //console.log("time: " + (Date.now() - _this._startTime));
      });

    this._simulation.alpha(0.5).restart();
  }

  calcNeededRadius() {
    // Get radius from circumference
    // U = 2*r*PI
    // A = r^2*PI
    const numConstraints = this._nodes_constraints.length;
    const nodesGap = this._constraintRadius / 10;
    this._hypergraphMinRadius = (this._nodes_features.length > 5 ? (this._nodes_features.length * 0.75) : 5) * this._constraintRadius * 2;
    this._hypergraphRadius = (this._constraintRadius * 2 * numConstraints + nodesGap * numConstraints) / 2 / Math.PI;
    this._hypergraphRadius = (this._hypergraphRadius < this._hypergraphMinRadius ? this._hypergraphMinRadius : this._hypergraphRadius);
  }

  updateLinks(t) {
    const _this = this;

    this._links_g = this.graph.select(".links").selectAll(".link").data(this._bilinks);

    // Remove old ones
    this._links_g.exit().remove();

    // update old ones
    this._links_g.each((d, i, n) => {
      const link = d3.select(n[i]);

      link.attr("class", (d: any) => {
        if (!d[2].link && !d[0].link) {
          return "link " + "link-to-" + (d[0].constraintType ? d[0].constraintType + "-" : "") + d[0].id + " link-to-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[2].id;
        } else if (!d[2].link) {
          return "link " + "link-to-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[2].id;
        } else if (!d[0].link) {
          return "link " + "link-to-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[0].id;
        } else {
          return "link " + "link-to-" + (d[0].constraintType ? d[0].constraintType + "-" : "") + d[0].id;
        }
      })
        .attr("id", (d: any) => {
          if (!d[2].link) {
            return "link-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[2].id + "-" + d[0].id;
          } else {
            return "link-" + (d[0].constraintType ? d[0].constraintType + "-" : "") + d[0].id + "-" + d[2].id;
          }
        });
      link.select("path")
        .attr("marker-end", (d: any) => {
          if (!d[2].link)
            return "url(#circleMarker)";
          else
            return "null";
        });
    });

    // add new ones
    const enter = this._links_g
      .enter().append("g")
      .attr("class", (d: any) => {
        if (!d[2].link && !d[0].link) {
          return "link " + "link-to-" + (d[0].constraintType ? d[0].constraintType + "-" : "") + d[0].id + " link-to-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[2].id;
        } else if (!d[2].link) {
          return "link " + "link-to-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[2].id;
        } else if (!d[0].link) {
          return "link " + "link-to-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[0].id;
        } else {
          return "link " + "link-to-" + (d[0].constraintType ? d[0].constraintType + "-" : "") + d[0].id;
        }
      })
      .attr("id", (d: any) => {
        if (!d[2].link) {
          return "link-" + (d[2].constraintType ? d[2].constraintType + "-" : "") + d[2].id + "-" + d[0].id;
        } else {
          return "link-" + (d[0].constraintType ? d[0].constraintType + "-" : "") + d[0].id + "-" + d[2].id;
        }
      });
    enter
      .append("path")
      .attr("marker-start", "url(#circleMarker)")
      .attr("marker-mid", "url(#textMarker)")
      .attr("marker-end", (d: any) => {
        if (!d[2].link)
          return "url(#circleMarker)";
        else
          return "null";
      });

    this._links_g = this._links_g.merge(enter);
  }

  updateNodes(t) {
    const _this = this;

    const numConstraints = this._nodes_constraints.length;

    this._nodes_g = this.graph.select(".nodes").selectAll(".node,.linknode").data(this._nodes.filter((d: any) => d && d.id));

    // reset selected violations
    this._nodes_g.classed(".violated-selected", false);

    // reset hovered violations
    this._nodes_g.classed(".violated-hovred", false);

    // reset violations tags
    d3.selectAll(".node-num-violation").classed("show", false);

    // Remove old ones
    const rm = this._nodes_g.exit()
      .transition(t)
      .remove();
    rm.select("circle")
      .attr("transform", "translate(0,0)")
      .style("fill-opacity", 1e-6);
    rm.select("text.node-title")
      .attr("transform", "translate(0,0)")
      .style("opacity", 1e-6);

    // update old ones
    this._nodes_g.each((d, j, n) => {
      const node = d3.select(n[j]);

      node
        .attr("class", (d: any) => d.link ? "linknode" : "node")
        .attr("id", (d: any) => "node-" + (d.constraintType ? d.constraintType + "-" : "") + d.id)

      node.select("circle")
        .transition(t)
        .attr("r", (d: any) => !d.link ? _this._constraintRadius : _this._featureRadius)
        .attr("transform", (d: any) => !d.link ? `
          translate(${this._hypergraphRadius * Math.sin(-(Math.PI * 2 * (j / numConstraints + 0.5)))},${this._hypergraphRadius * Math.cos(-(Math.PI * 2 * (j / numConstraints + 0.5)))})
        ` : `translate(0,0)`)
        .attr("fill", (d: any) => {
          if (d.asp && d.weight != -1) {
            return _this._transferColorWeights(1 - d.weight / _this._maxDivisor);
          } else {
            return _this._defaultColorNoWeight;
          }
        });

      node.select("text.node-title")
        .transition(t)
        .attr("dx", (d: any) => !d.link ? "0" : "-.5em")
        .attr("dy", (d: any) => !d.link ? "0.31em" : "-.5em")
        .attr("transform", (d: any) => !d.link ? `
          rotate(${(j / numConstraints) * 360 - 90})
          translate(${this._hypergraphRadius + _this._constraintRadius + _this._arcGap * 2 + (d.hierarchy.length * (this._arcWidth + this._arcGap))},0)
          ${(j / numConstraints) < 0.5 ? "" : " rotate(180)"}
          ` : ``)
        .attr("text-anchor", (d: any) => (j / numConstraints) < 0.5 ? "start" : "end")
        .text((d: any) => !d.link ? ((j / numConstraints) < 0.5 ? d.hierarchy.join(" > ") : d.hierarchy.slice().reverse().join(" < ")) : d.feature_name); //!d.link ? ((j / numConstraints) < 0.5 ? (d.hierarchy.join(" > ") + (d.weight != -1 ? (" (" + d.weight + ")") : "")) : ((d.weight != -1 ? ("(" + d.weight + ") ") : "") + d.hierarchy.join(" > "))) : d.feature_name);

      node.select(".node-num-violation")
        .transition(t)
        .attr("transform", (d: any) => !d.link ? `
          rotate(${(j / numConstraints) * 360 - 90})
          translate(${this._hypergraphRadius - 55},0)
        `: "").select("text")
        .attr("dx", (d: any) => !d.link ? ((j / numConstraints) < 0.5 ? "1em" : "-1em") : "0")
        .attr("dy", (d: any) => !d.link ? ((j / numConstraints) < 0.5 ? ".6em" : ".6em") : "0")
        .attr("transform", (d: any) => (j / numConstraints) < 0.5 ? "" : " rotate(180)");

      node.select(".cost")
        .attr("transform", (d: any) => !d.link ? `
          rotate(${(j / numConstraints) * 360 - 90})
          translate(${this._hypergraphRadius},0)
          ${(j / numConstraints) < 0.5 ? "" : " rotate(180)"}
        `: "")
        .attr("fill", (d: any) => _this._max >= 0 ? _this.colorService.getForgroundColorFromStringToString(_this._transferColorWeights(1 - d.weight / _this._maxDivisor), 180) : _this._defaultForegroundColorNoWeight)
        .text((d: any, i: number) => d.asp && d.weight != -1 ? d.weight : "");
    });

    const enter = this._nodes_g
      .enter()
      .append("g")
      .attr("class", (d: any) => d.link ? "linknode" : "node")
      .attr("id", (d: any) => "node-" + (d.constraintType ? d.constraintType + "-" : "") + d.id)
      .on("mouseover", function (e, d: any) {
        if (!_this._legendData.selected) {
          _this._legendData.id = d.id;

          const color = d3.select(this).select("circle").attr("fill");
          const textColor = _this.colorService.getForgroundColorFromStringToString(color, 180);

          if (d.link) {
            d.ids.forEach((id, i) => {
              const el = d3.selectAll("#link-" + (d.constraintType ? d.constraintType + "-" : "") + id + "-" + d.id);
              el.raise().classed("hovered", true);
              const nodeEls = d3.select("#node-" + (d.constraintType ? d.constraintType + "-" : "") + id);
              nodeEls.classed("hovered", true);
            });
          } else {
            const connected = d3.selectAll(".link-to-" + (d.constraintType ? d.constraintType + "-" : "") + d.id);
            connected.raise().classed("hovered", true).select("path").attr("stroke", color);
            _this._legendData.nodes = [d];
          }

          // show legend
          _this._legendData.visible = true;
          _this._legendData.fadeOut = false;
          _this._legendData.link = d.link;
          _this._legendData.asp = d.link ? null : d.asp;
          _this._legendData.description = d.description;
          _this._legendData.weight = d.link ? null : d.weight;
          _this._legendData.constraintType = d.constraintType;
          _this._legendPos.right = _this._legendContainer.margin;
          _this._legendPos.bottom = _this._legendContainer.margin;
          _this._legendData.title = d.link ? d.feature_name : d.hierarchy.map(txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).join(" > ");

          // change legend colors
          _this._legendData.titleColorBackground = color;
          _this._legendData.titleColorText = textColor;
          _this._legendData.closeButtonColor = textColor;

          // Emit selected constraints
          _this.selectConstraints.emit(_this._legendData.nodes);
        }
      })
      .on("mouseout", function (e, d: any) {
        if (!_this._legendData.selected) {
          _this._legendData.id = null;

          if (d.link) {
            d3.selectAll(".link").classed("hovered", false);
            d3.selectAll(".node").classed("hovered", false);
          } else {
            const connected = d3.selectAll(".link-to-" + (d.constraintType ? d.constraintType + "-" : "") + d.id);
            connected.classed("hovered", false);
            connected.select("path").attr("stroke", "#bbb");
          }

          // Emit deselected constraints
          _this.hoverConstraints.emit([]);

          if (!_this._legendData.selected) {
            _this._legendData.fadeOut = true;
          }
        }
      })
      .on("click", function (e, d: any) {
        if (d.link && (!_this._legendData.selected || (_this._legendData.selected && d.id != _this._legendData.id))) {
          _this._legendData.id = d.id;

          const color = d3.select(this).select("circle").attr("fill");
          const textColor = _this.colorService.getForgroundColorFromStringToString(color, 180);

          d3.selectAll(".link").classed("hovered", false);
          d.ids.forEach((id, i) => {
            const el = d3.selectAll("#link-" + (d.constraintType ? d.constraintType + "-" : "") + id + "-" + d.id);
            el.raise().classed("hovered", true);
          });

          // show legend
          _this._legendData.visible = true;
          _this._legendData.fadeOut = false;
          _this._legendData.selected = true;

          // get filtered constraints and add html code to highlight filter parameter
          const listedNodes = _this._nodes_constraints.filter((n: Node) => d.ids.includes(n.id));
          const listedNodesHighlight = listedNodes.map(node => {
              return { ...node, asp: _this.splitBeforeAndAfterKey(node.asp, d.feature_name)}
            });

          _this._legendData.link = d.link;
          _this._legendData.asp = d.link ? null : d.asp;
          _this._legendData.description = d.description;
          _this._legendData.weight = d.link ? null : d.weight;
          _this._legendData.constraintType = d.constraintType;
          _this._legendData.nodes = listedNodes;
          _this._legendData.nodesHighlight = listedNodesHighlight;
          _this._legendData.title = d.feature_name;
          _this._legendPos.right = _this._legendContainer.margin;
          _this._legendPos.bottom = _this._legendContainer.margin;

          // Emit selected constraints
          _this.selectConstraints.emit(_this._legendData.nodes);
        } else if (d.link && _this._legendData.selected) {
          _this.closeLegend();
        }
      });

    //for every node -> svg circle creation
    enter.append("circle")
      .attr("transform", "translate(0,0)")
      .style("fill-opacity", 1e-6)
      .transition(t)
      .style("fill-opacity", 1)
      .attr("r", (d: any) => !d.link ? _this._constraintRadius : _this._featureRadius)
      .attr("transform", (d: any, i: number) => !d.link ? `
        translate(${this._hypergraphRadius * Math.sin(-(Math.PI * 2 * (i / numConstraints + 0.5)))},${this._hypergraphRadius * Math.cos(-(Math.PI * 2 * (i / numConstraints + 0.5)))})
        ` : `translate(0,0)`)
      .attr("fill", (d: any, i: number) => {
        if (d.asp && d.weight != -1) {
          return _this._transferColorWeights(1 - d.weight / _this._maxDivisor);
        } else {
          return _this._defaultColorNoWeight;
        }
      });

    enter.append("text")
      .attr("class", "cost")
      .attr("transform", (d: any, i: number) => !d.link ? `
        rotate(${(i / numConstraints) * 360 - 90})
        translate(${this._hypergraphRadius},0)
        ${(i / numConstraints) < 0.5 ? "" : " rotate(180)"}
      `: "")
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this.colorService.getForgroundColorFromStringToString(_this._transferColorWeights(1 - d.weight / _this._maxDivisor), 180) : _this._defaultForegroundColorNoWeight)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text((d: any, i: number) => d.asp && d.weight != -1 ? d.weight : "");

    const numViolations = enter.append("g")
      .attr("class", "node-num-violation")
      .attr("transform", (d: any, i: number) => !d.link ? `
        rotate(${(i / numConstraints) * 360 - 90})
        translate(${this._hypergraphRadius - 52},0)
      `: "").append("g").attr("class", "dummy");
    numViolations.append("rect")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("x", 0)
      .attr("y", -10)
      .attr("height", 20);
    let tContainer = numViolations.append("text")
      .attr("dx", (d: any, i: number) => !d.link ? ((i / numConstraints) < 0.5 ? "1.1em" : "-1.1em") : "0")
      .attr("dy", (d: any, i: number) => !d.link ? ((i / numConstraints) < 0.5 ? ".6em" : ".6em") : "0")
      .attr("text-anchor", "middle")
      .attr("transform", (d: any, i: number) => (i / numConstraints) < 0.5 ? "" : " rotate(180)")
    tContainer.append("tspan").attr("class", "num");
    tContainer.append("tspan").text("x");

    let radiusText = this._hypergraphRadius + this._constraintRadius + this._arcGap;
    enter.append("text")
      .attr("class", "node-title")
      .attr("transform", "translate(0,0)")
      .transition(t)
      .attr("dx", (d: any, i: number) => !d.link ? "0" : "-.5em")
      .attr("dy", (d: any, i: number) => !d.link ? "0.31em" : "-.5em")
      .attr("transform", (d: any, i: number) => !d.link ? `
        rotate(${(i / numConstraints) * 360 - 90})
        translate(${this._hypergraphRadius + _this._constraintRadius + _this._arcGap * 2 + (d.hierarchy ? (d.hierarchy.length * (this._arcWidth + this._arcGap)) : 0)},0)
        ${(i / numConstraints) < 0.5 ? "" : " rotate(180)"}
      `: "")
      .attr("text-anchor", (d: any, i: number) => (i / numConstraints) < 0.5 ? "start" : "end")
      .text((d: any, i: number) => !d.link ? ((i / numConstraints) < 0.5 ? d.hierarchy.join(" > ") : d.hierarchy.slice().reverse().join(" < ")) : d.feature_name);

    this._nodes_g = this._nodes_g.merge(enter);

    this._nodes_g.each((d, i, n) => {
      const x = this._hypergraphRadius * Math.sin(-(Math.PI * 2 * (i / numConstraints + 0.5)));
      const y = this._hypergraphRadius * Math.cos(-(Math.PI * 2 * (i / numConstraints + 0.5)));
      if (!d.link) {
        d.fx = x;
        d.fy = y;
      }
    });

    this.graph.selectAll(".node").on("mousedown.drag", null);
    this.graph.selectAll(".linknode").call(this._drag);
  }

  updateArcs(t) {
    const _this = this;

    const numNodes = this._nodes_constraints.length;
    let innerR = this._hypergraphRadius + this._constraintRadius + this._arcGap;
    let outerR = innerR + this._arcWidth;
    const corr = 1 / numNodes * 360 / 2;

    const numConstraints = this._nodes_constraints.length;

    const toRad = (degree) => {
      return degree * Math.PI / 180;
    }


    const startAngleDegree = function (d: any, i: number, _arcGapRadial) {
      return (i == 0 ? 0 : d.indices[0] / numNodes * 360) - corr + _arcGapRadial;
    }

    const endAngleDegree = function (d: any, i: number, _arcGapRadial) {
      return ((i == 0 ? d.indices.length : (d.indices.length == 1 ? (d.indices[0] + 1) : ((d.indices[d.indices.length - 1] + 1)))) / numNodes * 360) - corr - _arcGapRadial;
    }

    const arcLength = function (startAngle: number, endAngle: number, radius: number) {
      return (Math.abs(endAngle - startAngle) / 360) * 2 * Math.PI * radius;
    }

    const drawArc = d3.arc()
      .innerRadius((d: any, i: number) => innerR + (d.level * (this._arcWidth + this._arcGap)))
      .outerRadius((d: any, i: number) => outerR + (d.level * (this._arcWidth + this._arcGap)))
      .startAngle((d: any, i: number) => toRad(startAngleDegree(d, i, this._arcGapRadial)))
      .endAngle((d: any, i: number) => toRad(endAngleDegree(d, i, this._arcGapRadial)));

    const drawArcHover = d3.arc()
      .innerRadius((d: any, i: number) => innerR + (d.level * (this._arcWidth + this._arcGap)) - this._arcHover)
      .outerRadius((d: any, i: number) => outerR + (d.level * (this._arcWidth + this._arcGap)) + this._arcHover)
      .startAngle((d: any, i: number) => toRad(startAngleDegree(d, i, this._arcGapRadial)))
      .endAngle((d: any, i: number) => toRad(endAngleDegree(d, i, this._arcGapRadial)));

    let arcs = this.graph.select(".arcs").selectAll(".arc").data(this._flattened_hierarchy);

    // Remove old ones
    arcs.exit().remove();


    // Update old arcs
    arcs.attr("id", (d: any) => "arc-" + d.name)
      .attr("class", (d: any) => "arc" + " level" + d.level + " filterable" + ((d.indices.length > 1 && _this._data.hierarchy[d.level].length > 1) ? " filter-in" : (_this._isFiltered ? " filter-out" : "")))

    arcs.select(".arc-path")
      .attr("d", drawArc)
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this._transferColorWeights(1 - (d.weights.reduce((a, b) => a + b) / d.weights.length / this._maxDivisor)) : _this._defaultColorNoWeight);

    arcs.select(".arc-path-hover")
      .attr("d", drawArcHover)
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this._transferColorWeights(1 - (d.weights.reduce((a, b) => a + b) / d.weights.length / this._maxDivisor)) : _this._defaultColorNoWeight); // d3.interpolateRainbow(d.indices[Math.floor(d.indices.length / 2)] / numNodes))

    arcs.select("text")
      .transition(t)
      .attr("transform", (d: any, i: number) => `
          rotate(${(((d.indices[0] + d.indices[d.indices.length - 1]) / 2) / numConstraints) * 360 - 90})
          translate(${this._hypergraphRadius + _this._constraintRadius + _this._arcGap * 2 + d.level * (this._arcWidth + this._arcGap) + this._arcWidth / 4},0)
          ${((d.indices[0] / numConstraints) < 0.25 || (d.indices[0] / numConstraints) > 0.75) ? " rotate(90)" : " rotate(" + (180 + 90) + ")"}
        `)
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this.colorService.getForgroundColorFromStringToString(_this._transferColorWeights(1 - (d.weights.reduce((a, b) => a + b) / d.weights.length / this._maxDivisor)), 180) : _this._defaultForegroundColorNoWeight)
      .text((d: any, i: number) => {
        const t_l = this.textService.getSVGTextDimension(d.name.substr(0, d.name.length), 12).width;
        const a_l = arcLength(startAngleDegree(d, i, _this._arcGapRadial), endAngleDegree(d, i, _this._arcGapRadial), outerR + (d.level * (this._arcWidth + this._arcGap)));
        return t_l / a_l > 1.0 ? _this.textService.shortenText(d.name, (Math.floor(d.name.length * a_l / t_l) - 3) < 1 ? 1 : Math.floor(d.name.length * a_l / t_l) - 3) : d.name;
      });

    // Creae new arcs if necessary
    const enter = arcs.enter()
      .append("g")
      .attr("class", (d: any) => "arc" + " level" + d.level + " filterable" + ((d.indices.length > 1 && _this._data.hierarchy[d.level].length > 1) ? " filter-in" : (_this._isFiltered ? " filter-out" : "")))
      .attr("id", (d: any) => "arc-" + d.name)
      .on("mouseover", function (e, d: any) {
        if (!_this._legendData.selected) {
          const path = d3.select(this).select(".arc-path-hover");
          const color = path.attr("fill");
          const textColor = _this.colorService.getForgroundColorFromStringToString(color, 180);
          
          path.classed("show", true);
          _this._legendData.visible = true;
          _this._legendData.fadeOut = false;
          _this._legendData.title = d.hierarchy.join(" > ");
          _this._legendData.filtered = true;
          _this._legendPos = {
            left: e.offsetX + 20,
            top: e.offsetY + 20,
            right: _this._legendContainer.margin,
            bottom: _this._legendContainer.margin
          }

          _this._legendData.titleColorBackground = color;
          _this._legendData.titleColorText = textColor;
          _this._legendData.closeButtonColor = textColor;

          const hovered = _this._data.graph.nodesSorted.filter((node, i: number) => d.indices.indexOf(i) != -1);
          _this.hoverConstraints.emit(hovered);

          // highlight nodes and links
          hovered.forEach((d: any, i: number) => {
            const linkEls = d3.selectAll(".link-to-" + (d.constraintType ? d.constraintType + "-" : "") + d.id);
            linkEls.raise().classed("hovered", true);
            const nodeEls = d3.select("#node-" + (d.constraintType ? d.constraintType + "-" : "") + d.id);
            nodeEls.classed("hovered", true);
          });
        }
      })
      .on("mouseout", function (e, d: any) {
        if (!_this._legendData.selected) {
          const path = d3.select(this).select(".arc-path-hover");
          path.classed("show", false);
          _this._legendData.fadeOut = true;
          _this._legendData.filtered = false;

          // highlight nodes and links
          d3.selectAll(".link").classed("hovered", false);
          d3.selectAll(".node").classed("hovered", false);
          _this.hoverConstraints.emit([]);
        }
      })
      .on("dblclick", function (e, d: any) {
        _this._isFiltered = false;
        _this.filterConstraints.emit(null);
      })
      .on("click", function (e, d: any) {
        const filtered = _this._data.graph.nodesSorted.filter((node, i: number) => d.indices.indexOf(i) != -1);
        _this._isFiltered = d.indices.length > 1 && _this._data.hierarchy[d.level].length > 1;
        if (_this._isFiltered) {
          _this.filterConstraints.emit(filtered);
        } else {
          _this._isFiltered = false;
          _this.filterConstraints.emit(null);
        }

        _this.closeLegend();
      });

    enter.append("path")
      .attr("class", "arc-path")
      .style("fill-opacity", 1e-6)
      .transition(t)
      .style("fill-opacity", 1)
      .attr("d", drawArc)
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this._transferColorWeights(1 - (d.weights.reduce((a, b) => a + b) / d.weights.length / this._maxDivisor)) : _this._defaultColorNoWeight);

    enter.append("path")
      .attr("class", "arc-path-hover")
      .attr("d", drawArcHover)
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this._transferColorWeights(1 - (d.weights.reduce((a, b) => a + b) / d.weights.length / this._maxDivisor)) : _this._defaultColorNoWeight);

    const letterWidth = this.textService.getSVGTextDimension(" ", 12).width;

    enter.append("text")
      .attr("transform", "translate(0,0)")
      .transition(t)
      .attr("transform", (d: any, i: number) => `
          rotate(${(((d.indices[0] + d.indices[d.indices.length - 1]) / 2) / numConstraints) * 360 - 90})
          translate(${this._hypergraphRadius + _this._constraintRadius + _this._arcGap * 2 + d.level * (this._arcWidth + this._arcGap) + this._arcWidth / 4},0)
          ${((d.indices[0] / numConstraints) < 0.25 || (d.indices[0] / numConstraints) > 0.75) ? " rotate(90)" : " rotate(" + (180 + 90) + ")"}
        `)
      .attr("fill", (d: any, i: number) => _this._max >= 0 ? _this.colorService.getForgroundColorFromStringToString(_this._transferColorWeights(1 - (d.weights.reduce((a, b) => a + b) / d.weights.length / this._maxDivisor)), 180) : _this._defaultForegroundColorNoWeight)
      .text((d: any, i: number) => {
        const t_l = this.textService.getSVGTextDimension(d.name.substr(0, d.name.length), 12).width;
        const a_l = arcLength(startAngleDegree(d, i, _this._arcGapRadial), endAngleDegree(d, i, _this._arcGapRadial), outerR + (d.level * (this._arcWidth + this._arcGap)));
        return t_l / a_l > 1.0 ? _this.textService.shortenText(d.name, (Math.floor(d.name.length * a_l / t_l) - 3) < 1 ? 1 : Math.floor(d.name.length * a_l / t_l) - 3) : d.name;
      });

    arcs = arcs.merge(enter);
  }

  highlight(sets: (Constraint[])[], type: INTERACTION_TYPE) {
    this._highlighted = this._highlighted.filter(set => set.type != type);
    sets.forEach(set => this._highlighted.push({constraints: set, type: type}));
    
    d3.selectAll(".node:not(.violated-selected) .node-num-violation").classed("show", false);
    d3.selectAll(".node").classed(type == INTERACTION_TYPE.SELECTED ? "violated-selected" : "violated-hovered", false);
    d3.selectAll(".link").classed(type == INTERACTION_TYPE.SELECTED ? "violated-selected" : "violated-hovered", false);

    d3.selectAll(".violated-selected").classed(".selected-0", false);
    d3.selectAll(".selected-1").classed(".selected-1", false);
    d3.selectAll(".cloned-selected").remove();
    d3.selectAll(".cloned-hovered").remove();

    let s_i = 0; // selected counter
    let c_i = {}; // constraint indent counter
    // Highlight paths and nodes
    this._highlighted.forEach((rec: ConstraintsHighlight, r_i: number) => {
      let highlight = rec.constraints ? rec.constraints.reduce((a, c: any) => (a[c.id] = { num: (a[c.id] ? a[c.id].num : 0) + 1, constraint: c }, a), Object.create(null)) : {};


      Object.entries(highlight).forEach((value: any) => {
        const [key, a] = value;
        const num = a.num;
        const constraint = a.constraint;

        c_i[key] = c_i[key] || c_i[key] == 0  ? (c_i[key] + 1) : 0;

        // Mark nodes
        const node = d3.select("#node-" + constraint.constraintType + "-" + constraint.id);
        node.classed(rec.type == INTERACTION_TYPE.SELECTED ? "violated-selected selected-" + s_i : "violated-hovered color-hovered", true);

        // Add violation numbers
        const violations = node.select(".node-num-violation");
        violations.select("text>tspan.num").text(num);
        const violationNumberCloned = violations.select("g.dummy").clone(true);
        violationNumberCloned
          .attr("class", rec.type == INTERACTION_TYPE.SELECTED ? ("cloned-selected color-" + s_i) : "cloned-hovered color-hovered")
          .attr("transform", `translate(${-c_i[key] * 33},0)`);
        violations.append(() => violationNumberCloned.node());

        // Highlight violated links
        const links = d3.selectAll(".link-to-" + constraint.constraintType + "-" + constraint.id);
        links.each((link, i, n) => {
          const pathCloned = d3.select(n[i]).select("path").clone(true);
          pathCloned.attr("class", rec.type == INTERACTION_TYPE.SELECTED ? ("cloned-selected color-" + s_i) : "cloned-hovered color-hovered");
          d3.select(n[i]).append(() => pathCloned.node());
        });
        links.raise().classed(rec.type == INTERACTION_TYPE.SELECTED ? ("violated-selected selected-" + s_i) : "violated-hovered", true);
      });
      
      // increase counter
      s_i += rec.type == INTERACTION_TYPE.SELECTED ? 1 : 0;
    });
  }

  private splitBeforeAndAfterKey(value: string, key: string) {
    const split = value.split(key);
    let arr = [];
    if(split.length > 1) {
      split.forEach((el,i) => {
        arr.push(el);
        if(i < split.length - 1) arr.push(key);
      });
      return arr;
    }
    return split;
  }

  closeLegend() {
    this._legendData.visible = false;
    this._legendData.fadeOut = true;
    this._legendData.selected = false;
    this.selectConstraints.emit([]);
    d3.selectAll(".link").classed("hovered", false);
    d3.selectAll(".node").classed("hovered", false);
  }

  private ticked() {
    this._simulation_iterations++;

    this._nodes_g.each((d, i, n) => {
      d3.select(n[i]).selectAll("circle,.linknode>text").attr("transform", this.positionNode.bind(this));
    });

    this._links_g.each((d, i, n) => {
      d3.select(n[i]).selectAll("path").attr("d", (d: any) => this.positionLink(d));
    });
  }

  private positionLink(d: any) {
    const _this = this;

    if (d[0].x && d[2].x && d[0].y && d[2].y) {
      return "M" + d[0].x + "," + d[0].y
        + "S" + d[1].x + "," + d[1].y
        + " " + d[2].x + "," + d[2].y;
    } else {
      return "";
    }
  }

  private positionNode(d) {
    const r = Math.sqrt(Math.pow(d.x, 2) + Math.pow(d.y, 2));
    const maxR = this._hypergraphRadius - this._constraintRadius * 2 * 5;
    if (d.link) {
      d.x = r < maxR ? d.x : (maxR / r * d.x);
      d.y = r < maxR ? d.y : (maxR / r * d.y);
    }
    return "translate(" + d.x + "," + d.y + ")";
  }

  private rotateGraph(rotate_x) {
    const oldTransform = this.graph.attr("transform").replace(/(rotate\([^\)]*\))/g, ""); // remove old rotations
    this.graph.attr("transform", `${oldTransform} rotate(${rotate_x})`);
  }

  private dragstarted(event, d) {
    if (!event.active) this.restartSimulation();
    d.fx = d.x, d.fy = d.y;
    event.sourceEvent.stopPropagation();
    this._dragged = true;
  }

  private restartSimulation() {
    this._simulation_iterations = 0;
    this._startTime = Date.now();
    this._simulation
      .alpha(0.5)
      .alphaTarget(0.7)
      .restart();
  }

  private dragged(event, d) {
    d.fx = event.x, d.fy = event.y;
  }

  private dragended(event, d) {
    if (!event.active) this._simulation.alphaTarget(0.1);
    d.fx = null, d.fy = null;
    this._dragged = false;
  }

  zoomed(event, d) {
    this.graph.attr("transform", event.transform);
  }

  resetCamera() {
    const _this = this;
    this.svg.call(this._zoom).call(this._zoom.transform, d3.zoomIdentity.translate(this._centerX, this._centerY).scale(_this._initial_zoom));
  }

  resetFilter() {
    const _this = this;
    this._isFiltered = false;
    this.filterConstraints.emit(null);
  }
}
