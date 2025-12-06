import { Component } from '@angular/core';
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
  weatherData$: Observable<WeatherData>;

  constructor(private weatherService: WeatherDataService) {
    this.weatherData$ = this.weatherService.getWeather();
  }
}