import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { WeatherPane } from './weather-pane/weather-pane';
import { CalendarPane } from './calendar-pane/calendar-pane';
import { RadarPane } from './radar-pane/radar-pane';
import { ChorePane } from './chore-pane/chore-pane';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: Dashboard,
  },
  {
    path: 'weather',
    component: WeatherPane,
  },
  {
    path: 'calendar',
    component: CalendarPane,
  },
  {
    path: 'radar',
    component: RadarPane,
  },
  {
    path: 'chores',
    component: ChorePane,
  },
];
