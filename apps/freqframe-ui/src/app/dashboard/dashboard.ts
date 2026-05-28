import { Component } from '@angular/core';
import { WeatherPane } from '../weather-pane/weather-pane';
import { CalendarPane } from '../calendar-pane/calendar-pane';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WeatherPane, CalendarPane],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
