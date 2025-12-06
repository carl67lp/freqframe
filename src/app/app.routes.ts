import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { WeatherPane } from './weather-pane/weather-pane';
import { BandConditionsPane } from './band-conditions-pane/band-conditions-pane';
import { QsoPane } from './qso-pane/qso-pane';
import { SolarPane } from './solar-pane/solar-pane';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'weather',
        component: WeatherPane
    },
    {
        path: 'band-conditions',
        component: BandConditionsPane
    },
    {
        path: 'qso-list',
        component: QsoPane
    },
    {
        path: 'solar-data',
        component: SolarPane
    }
];
