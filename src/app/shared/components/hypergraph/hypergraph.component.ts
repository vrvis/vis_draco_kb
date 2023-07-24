import { Component, Input, OnInit } from '@angular/core';

import * as d3 from 'd3';
import { default as hypergraph } from 'd3-hypergraph/src/hypergraph';
import { HypergraphData } from '../../interfaces/hypergraph.interface';

@Component({
  selector: 'app-hypergraph',
  templateUrl: './hypergraph.component.html',
  styleUrls: ['./hypergraph.component.scss']
})
export class HypergraphComponent implements OnInit {
  drawn = false;
  loading = true;

  _bilinks: any[];
  _links: any;
  _nodes: any;

  _transferColor: any = d3.interpolateRdBu;
  _ticks: 10;
  _max: number = -1;

  _drag: any;
  _simulation: any;

  _nodes_g: any;
  _links_g: any;
  _links_g_paths: any;

  svg;
  nodeR = 20
  lNodeR = 8;

  _height = 500;
  _width = 0;
  _test = 0;

  @Input() set containerWidth(width: number) {
    if (this._width == 0) {
      this._width = width;
    }
  }

  _data: HypergraphData;
  @Input() set data(data: HypergraphData) {
    this._data = data;
    if (data && data.nodes && data.nodes.length > 0) {
      this.prepareData();

      if (!this.drawn) {
        this.drawn = true;
        this.create();
      } else {
        this.update();
      }
    }
  }

  _selected: any[];
  @Input() set selected(selected: any[]) {
    this._selected = selected;
    if (selected && selected.length > 0 && this.drawn) {
      this.highlight();
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

  prepareData() {
    const _this = this;
    //d3.hypergraph invocation passing links and nodes
    let hyperdata = hypergraph(this._data.links.map(link => link.ids), [...this._data.nodes]);
    //d3.hypergraph links
    this._links = hyperdata.links;
    //d3.hypergraph nodes
    this._nodes = hyperdata.nodes;

    this._max = Math.max(...hyperdata.nodes.map(node => node.weight).filter(weight => weight != null));

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

  createSimulation() {
    //force layout definition	
    this._simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.id))//.distance(80).strength(1))
      .force("charge", d3.forceManyBody().strength(-50).distanceMin(30).distanceMax(200))
      .force("center", d3.forceCenter(this._width / 2, this._height / 2))
      .force("collide", d3.forceCollide(50));
  }

  updateSimulation() {
    const _this = this;
    this._simulation
      .nodes(this._nodes)
      .on("tick", this.ticked.bind(_this))
      .force("links", d3.forceLink(this._links));
  }

  create() {
    let _this = this;

    let dataMarker = { id: 0, name: 'circle', path: 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0', viewbox: '-6 -6 12 12' }

    //zoom handler
    let zoom = d3.zoom()
      .scaleExtent([1 / 8, 10])
      .on("zoom", _this.zoomed.bind(_this));

    //drag handler
    this._drag = d3.drag()
      .on("start", _this.dragstarted.bind(_this))
      .on("drag", _this.dragged.bind(_this))
      .on("end", _this.dragended.bind(_this));

    //svg creation	
    _this.svg = d3.select("#hypergraph")
      .attr("height", this._height)
      .call(zoom)
      .append("g");
    zoom.scaleTo(_this.svg, 1 / 4);

    //defs creation for markers
    let defs = _this.svg.append("defs");

    //sphere marker
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

    this.createSimulation();

    this.updateSimulation();


    this.createLinks();
    this.createNodes();

    // -------------------------------------------------------------
    // set loading false
    this.loading = false;
  }

  createLinks() {
    const _this = this;

    this._links_g = this.svg.selectAll(".link")
      .data(this._bilinks)
      .enter().append("g")
      .attr("class", (d: any) => {
        if (!d[2].link) {
          return "link " + "link-to-" + (d[0].constraintType ? d[0].constraintType + '-' : '') + d[2].id;
        } else {
          return "link " + "link-to-" + (d[0].constraintType ? d[0].constraintType + '-' : '') + d[0].id;
        }
      })
      .attr("id", (d: any) => {
        if (!d[2].link) {
          return "link-" + (d[0].constraintType ? d[0].constraintType + '-' : '') + d[2].id + "-" + d[0].id;
        } else {
          return "link-" + (d[0].constraintType ? d[0].constraintType + '-' : '') + d[0].id + "-" + d[2].id;
        }
      });
    this._links_g_paths = this._links_g
      .append("path")
      .attr("marker-start", "url(#circleMarker)")
      .attr("marker-mid", "url(#textMarker)")
      .attr("marker-end", (d: any) => {
        if (!d[2].link)
          return "url(#circleMarker)";
        else
          return "null";
      });
    this._links_g.append("title")
      .text((d: any) => {
        if (d[0].asp)
          return d[0].asp;
        else
          return "null";
      });
  }

  createNodes() {
    const _this = this;

    this._nodes_g = this.svg.selectAll(".node")
      .data(this._nodes.filter((d: any) => d.id))
      .enter()
      .append("g")
      .attr("class", (d: any) => (d.link ? "linknode" : "node") + (d.constraintType ? ' ' + d.constraintType : ''))
      .attr("id", (d: any) => "node-" + (d.constraintType ? d.constraintType + '-' : '') + d.id)
      .on("mouseover", function (e, d: any) {
        const color = d3.select(this).select("circle").attr("fill");
        const connected = d3.selectAll(".link-to-" + (d.constraintType ? d.constraintType + '-' : '') + d.id);
        connected.classed("hovered", true);
        connected.select("path").attr("stroke", color);
      })
      .on("mouseout", function (e, d: any) {
        const connected = d3.selectAll(".link-to-" + (d.constraintType ? d.constraintType + '-' : '') + d.id);
        connected.classed("hovered", false);
        connected.select("path").attr("stroke", "#bbb");
      });

    //for every node -> svg circle creation
    this._nodes_g.append("circle")
      .attr("r", (d: any) => {
        if (d.link) {
          return _this.lNodeR;
        } else {
          return _this.nodeR;
        }
      })
      .attr("fill", (d: any, i) => {
        if (d.asp && d.weight != -1) {
          return _this._transferColor(1 - d.weight / _this._max);
        } else {
          return "rgb(5, 48, 97)";
        }
      });

    //id text
    this._nodes_g.append("text")
      .attr("dx", 22)
      .attr("dy", ".35em")
      .text((d: any) => {
        if (!d.link) {
          return d.id + (d.weight != -1 ? (" - weight: " + d.weight) : '');
        } else {
          return null;
        }
      });

    //onmouseover id text
    this._nodes_g.append("title")
      .text((d: any) => {
        if (!d.link) {
          return d.asp + (d.weight != -1 ? (" - weight: " + d.weight) : '');
        } else {
          return null;
        }
      });

    this._nodes_g.call(this._drag);
  }

  update() {
    const _this = this;

    const t = this.svg.transition().duration(750);

    this._links_g.remove();
    this._nodes_g.remove();

    this.createLinks();
    this.createNodes();

    this.createSimulation();
    this.updateSimulation();
  }

  highlight() {
    d3.selectAll(".node").classed("selected", false);
    d3.selectAll(".link").classed("selected", false);

    this._selected.forEach((selected: any, i: number) => {
      const node = d3.select("#node-" + selected.constraintType + "-" + selected.id);
      const link = d3.selectAll(".link-to-" + selected.constraintType + "-" + selected.id);
      node.classed("selected", true);
      link.classed("selected", true);
    });
  }

  /* private helper methods */

  ticked() {
    this._links_g_paths.attr("d", (d: any) => this.positionLink(d));
    this._nodes_g.attr("transform", this.positionNode);
  }

  positionLink(d: any) {
    const _this = this;

    let diffX0 = d[0].x - d[1].x;
    let diffY0 = d[0].y - d[1].y;
    let diffX2 = d[2].x - d[1].x;
    let diffY2 = d[2].y - d[1].y;

    let pathLength01 = Math.sqrt((diffX0 * diffX0) + (diffY0 * diffY0));
    let pathLength12 = Math.sqrt((diffX2 * diffX2) + (diffY2 * diffY2));

    let offsetX0 = (diffX0 * _this.nodeR) / pathLength01;
    let offsetY0 = (diffY0 * _this.nodeR) / pathLength01;
    let offsetX2, offsetY2;
    if (!d[2].link) {
      offsetX2 = (diffX2 * _this.nodeR) / pathLength12;
      offsetY2 = (diffY2 * _this.nodeR) / pathLength12;
    } else {
      offsetX2 = (diffX2 * _this.lNodeR) / pathLength12;
      offsetY2 = (diffY2 * _this.lNodeR) / pathLength12;
    }

    let x0Pos, y0Pos, x2Pos, y2Pos;

    if (d[0].link) {
      x0Pos = d[0].x;
      y0Pos = d[0].y;
    } else {
      x0Pos = d[0].x - offsetX0;
      y0Pos = d[0].y - offsetY0;
    }
    if (d[2].link) {
      x2Pos = d[2].x;
      y2Pos = d[2].y;
    } else {
      x2Pos = d[2].x - offsetX2;
      y2Pos = d[2].y - offsetY2;
    }

    return "M" + x0Pos + "," + y0Pos
      + "S" + d[1].x + "," + d[1].y
      + " " + x2Pos + "," + y2Pos;
    /*return "M" + d[0].x + "," + d[0].y
        + "S" + d[1].x + "," + d[1].y
        + " " + d[2].x + "," + d[2].y;*/
  }

  positionNode(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }

  dragstarted(event, d) {
    if (!event.active) this._simulation.alphaTarget(0.3).restart();
    d.fx = d.x, d.fy = d.y;
    event.sourceEvent.stopPropagation();
  }

  dragged(event, d) {
    d.fx = event.x, d.fy = event.y;
  }

  dragended(event, d) {
    if (!event.active) this._simulation.alphaTarget(0);
    d.fx = null, d.fy = null;
  }

  zoomed(event, d) {
    this.svg.attr("transform", event.transform);
  }
}
