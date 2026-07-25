import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { WeatherDataService, WeatherData } from './weather-data';

describe('WeatherDataService', () => {
  let service: WeatherDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should flag the reading as unavailable when the PWS call fails', (done) => {
    service.getWeather().subscribe((data: WeatherData) => {
      // Without the flag the pane cannot tell a real 0°F from a failed fetch.
      expect(data.unavailable).toBe(true);
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/pws/observations/current'));
    req.error(new ProgressEvent('network error'));
  });

  it('should still return current conditions when only the forecast fails', (done) => {
    service.getWeather().subscribe((data: WeatherData) => {
      expect(data.unavailable).toBeUndefined();
      expect(data.temperature).toBe(41);
      expect(data.humidity).toBe(72);
      expect(data.todayCondition).toBeUndefined();
      done();
    });

    httpMock
      .expectOne((r) => r.url.includes('/pws/observations/current'))
      .flush({
        observations: [
          {
            humidity: 72,
            winddir: 250,
            imperial: { temp: 41, heatIndex: 41, windChill: 38, windSpeed: 6 },
          },
        ],
      });

    httpMock
      .expectOne((r) => r.url.includes('/forecast/daily/5day'))
      .error(new ProgressEvent('network error'));
  });

  it('should keep icon code 0 rather than falling through to the night entry', (done) => {
    service.getWeather().subscribe((data: WeatherData) => {
      expect(data.todayIconCode).toBe(0);
      done();
    });

    httpMock
      .expectOne((r) => r.url.includes('/pws/observations/current'))
      .flush({
        observations: [
          {
            humidity: 72,
            winddir: 250,
            imperial: { temp: 41, heatIndex: 41, windChill: 38, windSpeed: 6 },
          },
        ],
      });

    httpMock.expectOne((r) => r.url.includes('/forecast/daily/5day')).flush({
      temperatureMax: [50, 48],
      temperatureMin: [30, 28],
      daypart: [
        {
          wxPhraseShort: ['Tornado', 'Clear', 'Sunny'],
          iconCode: [0, 31, 32],
        },
      ],
    });
  });
});
