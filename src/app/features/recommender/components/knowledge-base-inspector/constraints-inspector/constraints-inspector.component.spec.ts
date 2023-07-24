import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstraintsInspectorComponent } from './constraints-inspector.component';

describe('ConstraintsInspectorComponent', () => {
  let component: ConstraintsInspectorComponent;
  let fixture: ComponentFixture<ConstraintsInspectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConstraintsInspectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConstraintsInspectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
