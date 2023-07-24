import { TestBed } from '@angular/core/testing';

import { DatabaseHelperService } from './database-helper.service';

describe('DatabaseHelperService', () => {
  let service: DatabaseHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
