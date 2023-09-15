# Visual Analytics for Understanding Draco’s Knowledge Base

This project presents a web-based Visual Analytics approach which helps to better understand the **Draco** (<https://uwdata.github.io/draco/>) visualization recommender systems' knowledge base.

Draco has been developed as an automated visualization recommendation system formalizing design knowledge as logical constraints in ASP (Answer-Set Programming). With an increasing set of constraints and incorporated design knowledge, even visualization experts lose overview in Draco and struggle to retrace the automated recommendation decisions made by the system. We propose a **Visual Analytics (VA) approach** to visualize and analyze Draco’s constraints. Our VA approach is supposed to enable visualization experts to accomplish identified tasks regarding the knowledge base and support them in **better understanding Draco's internal rules**:

![Teaser](https://github.com/vrvis/vis_draco_kb/raw/main/teaser.png?raw=true)

We extend the existing data extraction strategy of Draco with a data processing architecture capable of extracting features of interest from the knowledge base. A revised version of the ASP grammar provides the basis for this data processing strategy. The resulting incorporated and shared features of the constraints are then visualized using a hypergraph structure inside the radial-arranged constraints of the elaborated visualization. The hierarchical categories of the constraints are indicated by arcs surrounding the constraints. Our approach is supposed to enable visualization experts to **interactively explore the design rules' violations** based on highlighting respective constraints or recommendations.


## Demo

You can view an online demo here:
<http://vizrec.bernhardpointner.com/>


## Reference

This work will be presented at VIS 2023 conference.

Please cite the following paper when using the code:

> Johanna Schmidt, Bernhard Pointner, and Silvia Miksch (2023).
> *Visual Analytics for Understanding Draco’s Knowledge Base*.
> In Proceedings of VIS 2023. To appear in IEEE Transactions on Visualization and Computer Graphics.


## Vision

Automated visualization recommendation systems should be capable of creating charts of extensible specifications. ML based approaches are therefore, limited to a small predefined number of possible specifications and chart types. Vega-Lite is such an declarative specification language for creating various types of visualizations and specification, even with basic interaction possibilites. So, the vision is to extend the formal model of Draco to cover all possible visualizations of vega-lite and rank them by criteria of expressivness and effectiveness.

Because Draco's knowledge base is based on an incomplete set of rules, design experts and researchers have to extend this model to enhance Draco's recommendation capabilities. Extending this model requires the understanding of the syntax of these constraints and the structure and content of the current implemented knowledge base. As the the learning curve for this task is quite high, there is a need of an interactive system to search in this knowledge base, filter it, interact with it and showing coherences and dependencies.


## Installation

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

**Please note**:
* Newer Angular/Cli versions newer than 14.3.0 (as defined in the `package.json` file) are not supported unless `angular-resize-event` supports it.
* The parameter `"allowSyntheticDefaultImports": true` had to be added to `tsconfig.json` (<https://github.com/vega/vega-lite/issues/4461>, <https://github.com/vega/vega-embed/issues/151>).
* We deliver Draco as a pre-build library (`./lib/draco-core-0.0.6-prebuild.tgz`) due to conflicts with newer versions of Vega-Lite. We will go back to using the npm version once the references have been updated.

### 1. NodeJS / Angular

NodeJS version 18 and Angular/Cli version 15.2.9 need to be installed.

#### Windows

* Install **NodeJS v18** (https://nodejs.org/en) - we used version [18.17.1 | 64bit](https://nodejs.org/download/release/v18.17.1/node-v18.17.1-x64.msi).

#### Linux

This installation was tested on Ubuntu 22.04. The installation of NodeJS version 18 was done according to the [NodeJS manual](https://github.com/nodesource/distributions).

* Install **curl**, if not available:
  ```
  sudo apt-get install curl
  ```
* Prepare **apt-get** sources:
  ```
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  NODE_MAJOR=18
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
  sudo apt-get update
  ```
* Install **NodeJS v18**:
  ```
  sudo apt-get install nodejs -y
  ```
* Install **Angular/Cli v15.2.9**:
  ```
  sudo npm install -g @angular/cli@15.2.9
  ```

#### MacOS

* Install **NodeJS v18** from the [NodeJS website](https://nodejs.org/) (use [node-v18.17.1.pkg](https://nodejs.org/dist/v18.17.1/node-v18.17.1.pkg)).
* Install **Angular/Cli v15.2.9**:
  ```
  sudo npm install -g @angular/cli@15.2.9
  ```

### 2. Source Code

The source code is available here on Github.

#### Via Git cloning

##### Install Git

Install Git, if not available.

###### Windows

Download [Git for Windows](https://git-scm.com/download/win) and install it. A graphical user interface like [TortoiseGit](https://tortoisegit.org/) is recommended.

###### Linux
    
    sudo apt-get install git

###### MacOS
* Install [MacPorts](https://www.macports.org/install.php) if not available.
* Install Git using MacPorts:
  ```
    sudo port install git
  ```
##### Git Clone
Clone the repository:
  ```
  git clone https://github.com/vrvis/vis_draco_kb
  ```

#### Via direct download

If Git is not installed or should not be used, tt is also possible to download the source code as a **ZIP file** from Github and store it in a local folder.

### 3. Package installation

In the folder of the project (where the `package.json` file is located), run `npm install` for installing all required modules:
```
npm install
```
This will create a folder `node_modules` with all libraries in there and a file `package-lock.json`.

### 4. Additional requirements

It is necessary to manually delete all vega dependencies in `./node_modules/draco-core/node_modules` by deleting all folders that start with `vega-*`. Unfortunately, Draco has not been updated yet to support the newest version of Vega.


## Running the application

The application can be run as a local development server. This is suggested for local development purposes, but not for production purposes.

### Local development server

* Use Angular to start a local development server:
  ```
  ng serve
  ```
  *Autocompletion* and *sharing usage data* do not have to be enabled, when asked.
* Navigate your browser to http://localhost:4200/

### Production Build

Run Angular build:
  ```
  ng build
  ```
or:
  ```
  npm run build
  ```
The build artifacts will be stored in the `./dist` directory.

If you plan to host the website under a specific domain, you will probably have to add `base-href` to the command. For example, in our case, we used:
  ```
  ng build --base-href='https://vrvis.github.io/projects/vis_draco_kb/'
  ```
