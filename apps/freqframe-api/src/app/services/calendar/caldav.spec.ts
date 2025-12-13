import { TestBed } from '@angular/core/testing';

import { Caldav } from './caldav';

describe('Caldav', () => {
  let service: Caldav;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Caldav);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
