import { AfterViewInit, Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Constraint } from 'src/app/shared/interfaces/constraint.interface';
import { ASP_CONSTRAINT_TYPE } from 'src/app/shared/models/asp-constraint-type.model';

@Component({
  selector: 'app-constraints-inspector',
  templateUrl: './constraints-inspector.component.html',
  styleUrls: ['./constraints-inspector.component.scss']
})
export class ConstraintsInspectorComponent implements OnInit, AfterViewInit {
  constraintTypes = ASP_CONSTRAINT_TYPE;
  filter = null;

  constraints: Constraint[] = [];
  type = ASP_CONSTRAINT_TYPE.SOFT;

  constructor(private databaseService: DatabaseService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.getConstraints(this.type);
  }

  getConstraints(type: ASP_CONSTRAINT_TYPE) {
    this.databaseService.getAll(type == ASP_CONSTRAINT_TYPE.SOFT ? ASP_CONSTRAINT_TYPE.SOFT : ASP_CONSTRAINT_TYPE.HARD).subscribe(constraints => {
      this.constraints = constraints
    });
  }
}
