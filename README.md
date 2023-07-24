# Visual Analytics for Understanding Draco’s Knowledge Base

This project presents a web-based Visual Analytics approach which helps to better understand the **Draco** (<https://uwdata.github.io/draco/>) visualization recommender systems' knowledge base.

Draco has been developed as an automated visualization recommendation system formalizing design knowledge as logical constraints in ASP (Answer-Set Programming). With an increasing set of constraints and incorporated design knowledge, even visualization experts lose overview in Draco and struggle to retrace the automated recommendation decisions made by the system. We propose a Visual Analytics (VA) approach to visualize and analyze Draco’s constraints. Our VA approach is supposed to enable visualization experts to accomplish identified tasks regarding the knowledge base and support them in better understanding Draco:

![Teaser](https://github.com/vrvis/vis_draco_kb/raw/main/teaser.png?raw=true)

We extend the existing data extraction strategy of Draco with a data processing architecture capable of extracting features of interest from the knowledge base. A revised version of the ASP grammar provides the basis for this data processing strategy. The resulting incorporated and shared features of the constraints are then visualized using a hypergraph structure inside the radial-arranged constraints of the elaborated visualization. The hierarchical categories of the constraints are indicated by arcs surrounding the constraints. Our approach is supposed to enable visualization experts to interactively explore the design rules’ violations based on highlighting respective constraints or recommendations. A qualitative and quantitative evaluation of the prototype confirms the prototype’s effectiveness and value in acquiring insights into Draco’s recommendation process and design constraints.


## Demo

You can view an online demo here:
https://vrvis.github.io/projects/sel_angular_brushing


## Reference

This work will be presented at this' years VIS conference.

Please cite the following paper when using the code:

> Johanna Schmidt, Bernhard Pointner, and Silvia Miksch (2023).
> *Visual Analytics for Understanding Draco’s Knowledge Base*.
> In Proceedings of VIS 2023. To appear in IEEE Transactions on Visualization and Computer Graphics.

https://diglib.eg.org/bitstream/handle/10.2312/evs20211064/109-113.pdf


## Installation

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.12. Run `npm install` for installing all required modules.

**Please note**:
* Newer Angular versions are not supported unless `angular-resize-event` supports it.
* Add `"allowSyntheticDefaultImports": true` to tsconfig.ts (https://github.com/vega/vega-lite/issues/4461, https://github.com/vega/vega-embed/issues/151).
* Delete all vega dependencies in `./node_modules/draco-core/node_modules/`. Unfortunately, Draco has not been updated yet to support the newest version of Vega.

### Local development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `./dist` directory.


## Vision
Automated visualization recommendation systems should be capable of creating charts of extensible specifications. ML based approaches are therefore, limited to a small predefined number of possible specifications and chart types. Vega-Lite is such an declarative specification language for creating various types of visualizations and specification, even with basic interaction possibilites. So, the vision is to extend the formal model of Draco to cover all possible visualizations of vega-lite and rank them by criteria of expressivness and effectiveness.

Because Draco's knowledge base is based on an incomplete set of rules, design experts and researchers have to extend this model to enhance Draco's recommendation capabilities. Extending this model requires the understanding of the syntax of these constraints and the structure and content of the current implemented knowledge base. As the the learning curve for this task is quite high, there is a need of an interactive system to search in this knowledge base, filter it, interact with it and showing coherences and dependencies.
