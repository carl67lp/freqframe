import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, interval, switchMap, startWith } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
}

@Injectable({
  providedIn: 'root',
})

export class WeatherDataService {
  private apiUrl = `${environment.weatherApi.baseUrl}?stationId=${environment.weatherApi.stationId}&format=json&units=e&apiKey=${environment.weatherApi.apiKey}`;
  private http: HttpClient = inject(HttpClient);

  getWeather(): Observable<WeatherData> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((data: any) => {
        console.log('Weather API response:', data);
        if (!data || !data.observations || !data.observations[0]) {
          throw new Error('Invalid weather API response structure');
        }
        return {
          temperature: data.observations[0].imperial.temp,
          humidity: data.observations[0].humidity,
          windSpeed: data.observations[0].imperial.windSpeed,
          windDirection: data.observations[0].winddir,
        };
      }),
      catchError((error) => {
        console.error('Weather API error:', error);
        // Return dummy data so pane doesn't crash
        return of({
          temperature: 0,
          humidity: 0,
          windSpeed: 0,
          windDirection: 0,
        });
      })
    );
  }

  getWeatherAutoRefresh(refreshIntervalMs = 300000): Observable<WeatherData> {
    return interval(refreshIntervalMs).pipe(
          startWith(0),
          switchMap(() => this.getWeather())
        );
  }
}
