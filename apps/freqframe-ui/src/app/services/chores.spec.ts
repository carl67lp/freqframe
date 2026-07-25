import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ChoresService } from './chores';
import { ChoreBoardState, isChoreBoardUnavailable } from '@freqframe/shared-types';
import { environment } from '../../environments/environment';

describe('ChoresService', () => {
  let service: ChoresService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChoresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send the API key header', () => {
    service.getBoard().subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/chores'));
    expect(req.request.headers.get('X-Api-Key')).toBe(environment.apiKey);
    req.flush({ unavailable: true, reason: 'unreachable' });
  });

  it('should pass through the board state', (done) => {
    service.getBoard().subscribe((state: ChoreBoardState) => {
      expect(isChoreBoardUnavailable(state)).toBe(false);
      done();
    });

    httpMock
      .expectOne((r) => r.url.endsWith('/api/chores'))
      .flush({ month: { earned: 12.5 } });
  });

  it('should report unavailable rather than erroring when the API fails', (done) => {
    service.getBoard().subscribe((state: ChoreBoardState) => {
      // A thrown error would kill the polling observable for the rest of the day.
      expect(state).toEqual({ unavailable: true, reason: 'unreachable' });
      done();
    });

    httpMock
      .expectOne((r) => r.url.endsWith('/api/chores'))
      .error(new ProgressEvent('network error'));
  });

  it('should emit immediately rather than waiting out the first interval', (done) => {
    service.getBoardAutoRefresh(60_000).subscribe(() => done());

    httpMock
      .expectOne((r) => r.url.endsWith('/api/chores'))
      .flush({ month: { earned: 0 } });
  });
});
