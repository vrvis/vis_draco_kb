import { TestBed } from '@angular/core/testing';

import { AspVlMapperService } from './asp-vl-mapper';

describe('AspVlMapperService', () => {
  let service: AspVlMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AspVlMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
