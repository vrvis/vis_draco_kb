import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadialHypergraphComponent } from './radial-hypergraph.component';

describe('RadialHypergraphComponent', () => {
  let component: RadialHypergraphComponent;
  let fixture: ComponentFixture<RadialHypergraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RadialHypergraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RadialHypergraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
