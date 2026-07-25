import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WeatherPane } from './weather-pane';

describe('WeatherPane', () => {
  let component: WeatherPane;
  let fixture: ComponentFixture<WeatherPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPane],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPane);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    // Clean up to stop setInterval
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a currentDate signal', () => {
    expect(component.currentDate).toBeDefined();
    expect(typeof component.currentDate).toBe('function'); // Signals are functions
    expect(component.currentDate()).toBeInstanceOf(Date);
  });

  it('should update currentDate signal over time', fakeAsync(() => {
    const initialDate = component.currentDate();

    // Fast-forward 1 second
    tick(1000);

    const updatedDate = component.currentDate();
    expect(updatedDate.getTime()).toBeGreaterThanOrEqual(initialDate.getTime());
  }));

  it('should render the date in the template', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const dateElement = compiled.querySelector('h2');

    expect(dateElement).toBeTruthy();
    expect(dateElement?.textContent).toContain(new Date().getFullYear().toString());
  });

  describe('getWeatherIcon', () => {
    it('should map icon code 0 rather than reporting it as unknown', () => {
      // 0 is tornado; a falsy check used to render it as the unknown glyph.
      expect(component.getWeatherIcon(0)).toBe('🌪️');
    });

    it('should report a missing icon code as unknown', () => {
      expect(component.getWeatherIcon(undefined)).toBe('❓');
    });
  });

  describe('bearingToDirection', () => {
    it.each([
      [0, 'N'],
      [90, 'E'],
      [180, 'S'],
      [270, 'W'],
      [350, 'N'],
    ])('should map %i° to %s', (deg, expected) => {
      expect(component.bearingToDirection(deg)).toBe(expected);
    });

    it('should not index the table with NaN when direction is missing', () => {
      expect(component.bearingToDirection(undefined)).toBe('--');
    });
  });
});
