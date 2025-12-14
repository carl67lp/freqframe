import { Component, inject } from '@angular/core';
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
export class WeatherPane {
  private weatherService = inject(WeatherDataService);
  weatherData$: Observable<WeatherData> = this.weatherService.getWeatherAutoRefresh();

  DIRECTIONS = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];

  bearingToDirection(deg: number): string {
    const index = Math.floor((deg + 11.25) / 22.5) % 16;
    return this.DIRECTIONS[index];
  }

}
