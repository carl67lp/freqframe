import { Component } from '@angular/core';
import { WeatherPane } from '../weather-pane/weather-pane';
import { QsoPane } from '../qso-pane/qso-pane';
import { SolarPane } from '../solar-pane/solar-pane';
import { CalendarPane } from '../calendar-pane/calendar-pane';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WeatherPane, CalendarPane, QsoPane, SolarPane],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
