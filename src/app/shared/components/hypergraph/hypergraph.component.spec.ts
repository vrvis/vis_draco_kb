import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HypergraphComponent } from './hypergraph.component';

describe('HypergraphComponent', () => {
  let component: HypergraphComponent;
  let fixture: ComponentFixture<HypergraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HypergraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HypergraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
