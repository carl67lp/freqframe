import { Component } from '@angular/core';
import { WeatherPane } from '../weather-pane/weather-pane';
import { CalendarPane } from '../calendar-pane/calendar-pane';
import { RadarPane } from '../radar-pane/radar-pane';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WeatherPane, CalendarPane, RadarPane],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
