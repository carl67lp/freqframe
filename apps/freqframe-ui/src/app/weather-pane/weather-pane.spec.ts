import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherPane } from './weather-pane';

describe('WeatherPane', () => {
  let component: WeatherPane;
  let fixture: ComponentFixture<WeatherPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPane],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPane);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
