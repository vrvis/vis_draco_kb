import { TestBed } from '@angular/core/testing';

import { DracoService } from './draco.service';

describe('DracoService', () => {
  let service: DracoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DracoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
