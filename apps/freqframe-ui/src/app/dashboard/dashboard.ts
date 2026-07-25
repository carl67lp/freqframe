import { Component } from '@angular/core';
import { WeatherPane } from '../weather-pane/weather-pane';
import { CalendarPane } from '../calendar-pane/calendar-pane';
import { ChorePane } from '../chore-pane/chore-pane';

// RadarPane is intentionally not shown on the dashboard right now — the
// component is kept (and still reachable at /radar) for future use.

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WeatherPane, CalendarPane, ChorePane],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
