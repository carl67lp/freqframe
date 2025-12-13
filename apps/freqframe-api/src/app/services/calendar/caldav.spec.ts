import { TestBed } from '@angular/core/testing';

import { CaldavService } from './caldav';

describe('Caldav', () => {
  let service: CaldavService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaldavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
