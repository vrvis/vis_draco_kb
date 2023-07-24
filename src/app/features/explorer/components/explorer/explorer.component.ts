import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { HypergraphComponent } from 'src/app/shared/components';
import { HypergraphData } from 'src/app/shared/interfaces/hypergraph.interface';
import { KnowledgeBaseService } from 'src/app/core/services/knowledge-base.service';
import { Subscription } from 'rxjs';

//import { HypergraphComponent } from 'src/app/shared/components/hypergraph/hypergraph.component';

@Component({
  selector: 'app-model',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit, OnDestroy {
  nodes: any[];
  links: any[];
  hypergraphData: HypergraphData;

  subscriptions: Subscription[] = [];

  @ViewChild(HypergraphComponent) hypergraph: HypergraphComponent;

  constructor(private knowledgeBaseService: KnowledgeBaseService) {
    let node_subscription = this.knowledgeBaseService.nodes_soft.subscribe(data => this.nodes = data);
    let links_subscription = this.knowledgeBaseService.links_soft.subscribe(data => this.links = data);
    this.subscriptions.push(node_subscription);
    this.subscriptions.push(links_subscription);
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription:Subscription) => {
      if(subscription) {
        subscription.unsubscribe();
      }
    });
  }

  draw() {
    this.hypergraphData = { nodes: this.nodes, links: this.links };
  }
}
