import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeBaseInspectorComponent } from './knowledge-base-inspector.component';

describe('KnowledgeBaseInspectorComponent', () => {
  let component: KnowledgeBaseInspectorComponent;
  let fixture: ComponentFixture<KnowledgeBaseInspectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KnowledgeBaseInspectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBaseInspectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
