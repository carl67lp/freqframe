import { TestBed } from '@angular/core/testing';

import { WeatherData } from './weather-data';

describe('WeatherData', () => {
  let service: WeatherData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeatherData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
