import { Component } from '@angular/core';
import { WeatherPane } from "../weather-pane/weather-pane";
import { BandConditionsPane } from "../band-conditions-pane/band-conditions-pane";
import { QsoPane } from "../qso-pane/qso-pane";
import { SolarPane } from "../solar-pane/solar-pane";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WeatherPane, BandConditionsPane, QsoPane, SolarPane],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard {

}
