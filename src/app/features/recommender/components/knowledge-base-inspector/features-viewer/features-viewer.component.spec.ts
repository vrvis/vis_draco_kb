import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesViewerComponent } from './features-viewer.component';

describe('FeaturesViewerComponent', () => {
  let component: FeaturesViewerComponent;
  let fixture: ComponentFixture<FeaturesViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeaturesViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
