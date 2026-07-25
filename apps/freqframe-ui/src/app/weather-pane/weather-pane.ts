import { Component, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherDataService, WeatherData } from '../services/weather-data';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-weather-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-pane.html',
  styleUrl: './weather-pane.css',
})
export class WeatherPane implements OnDestroy {
  private weatherService = inject(WeatherDataService);
  weatherData$: Observable<WeatherData> = this.weatherService.getWeatherAutoRefresh();
  currentDate = signal(new Date());

  private zone = inject(NgZone);
  private clockTimer!: ReturnType<typeof setInterval>;

  constructor() {
    // Update current date every second. Kept outside the Angular zone: a
    // perpetual 1Hz timer inside it schedules an app-wide change detection
    // every second and leaves the app permanently "unstable", which is why
    // anything awaiting whenStable() used to hang. Setting the signal still
    // refreshes the view on its own.
    this.zone.runOutsideAngular(() => {
      this.clockTimer = setInterval(() => {
        this.currentDate.set(new Date());
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }

  DIRECTIONS = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];

  bearingToDirection(deg: number | undefined): string {
    // A missing wind direction otherwise indexes the array with NaN.
    if (deg == null || Number.isNaN(deg)) return '--';
    const index = Math.floor(((((deg % 360) + 360) % 360) + 11.25) / 22.5) % 16;
    return this.DIRECTIONS[index];
  }

  getWeatherIcon(iconCode: number | undefined): string {
    // Guard on null/undefined only — 0 is a valid icon code (tornado).
    if (iconCode == null) return '❓';

    // Map Weather.com icon codes to emoji
    // Based on: https://docs.dtn.com/api/tables/icon-code-weather-forecast-icon-code/
    const iconMap: { [key: number]: string } = {
      0: '🌪️',
      1: '🌪️',
      2: '🌪️', // Tornado/Tropical Storm/Hurricane
      3: '⛈️',
      4: '⛈️', // Severe Thunderstorms
      5: '🌧️',
      6: '🌧️',
      7: '🌨️', // Rain/Snow Mix
      8: '🌧️',
      9: '🌧️',
      10: '🌧️',
      11: '🌧️',
      12: '🌧️', // Drizzle/Light Rain/Rain
      13: '🌨️',
      14: '🌨️',
      15: '🌨️',
      16: '🌨️', // Snow
      17: '🌧️',
      18: '🌧️', // Sleet/Rain and Sleet
      19: '🌫️',
      20: '🌫️',
      21: '🌫️', // Dust/Haze/Fog
      22: '🌫️',
      23: '💨',
      24: '💨', // Smoke/Windy/Breezy
      25: '🥶',
      26: '☁️',
      27: '☁️',
      28: '☁️', // Cold/Cloudy
      29: '⛅',
      30: '⛅', // Partly Cloudy Night/Day
      31: '🌙',
      32: '☀️', // Clear Night/Sunny
      33: '🌙',
      34: '🌤️', // Fair Night/Day
      35: '🌧️',
      36: '🌡️', // Mixed Rain/Hot
      37: '⛈️',
      38: '⛈️',
      39: '🌧️', // Isolated Thunderstorms/Showers
      40: '🌧️',
      41: '🌨️',
      42: '🌨️',
      43: '🌨️', // Heavy Rain/Snow
      44: '⛅',
      45: '⛈️',
      46: '🌨️',
      47: '⛈️', // Partly Cloudy/Storms/Snow Showers
    };

    return iconMap[iconCode] || '🌤️';
  }
}
