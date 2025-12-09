import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
    return this.http.get<WeatherData>(this.apiUrl).pipe(
      map((data: any) => ({
        temperature: data.observations[0].imperial.temp,
        humidity: data.observations[0].humidity,
        windSpeed: data.observations[0].imperial.windSpeed,
        windDirection: data.observations[0].winddir,
      }))
    );
  }
}
