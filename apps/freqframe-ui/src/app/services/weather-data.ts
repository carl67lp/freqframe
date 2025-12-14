import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, interval, switchMap, startWith, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  // Forecast data
  todayCondition?: string;
  todayIconCode?: number;
  todayHigh?: number;
  todayLow?: number;
  tomorrowCondition?: string;
  tomorrowIconCode?: number;
  tomorrowHigh?: number;
  tomorrowLow?: number;
}

@Injectable({
  providedIn: 'root',
})

export class WeatherDataService {
  private pwsApiUrl = `${environment.weatherApi.baseUrl}?stationId=${environment.weatherApi.stationId}&format=json&units=e&apiKey=${environment.weatherApi.apiKey}`;
  private forecastApiUrl = `https://api.weather.com/v3/wx/forecast/daily/5day?geocode=${environment.weatherApi.geocode}&format=json&units=e&language=en-US&apiKey=${environment.weatherApi.apiKey}`;
  private http: HttpClient = inject(HttpClient);

  getWeather(): Observable<WeatherData> {
    // Fetch both current conditions and forecast in parallel
    return this.http.get<any>(this.pwsApiUrl).pipe(
      switchMap((pwsData: any) => {
        console.log('PWS API response:', pwsData);
        if (!pwsData || !pwsData.observations || !pwsData.observations[0]) {
          throw new Error('Invalid PWS API response structure');
        }
        
        const obs = pwsData.observations[0];
        const temp = obs.imperial.temp;
        const heatIndex = obs.imperial.heatIndex;
        const windChill = obs.imperial.windChill;
        
        // Use heat index if temp >= 70°F, wind chill if temp <= 61°F, otherwise actual temp
        const feelsLike = temp >= 70 ? heatIndex : (temp <= 61 ? windChill : temp);
        
        const currentConditions = {
          temperature: temp,
          feelsLike: feelsLike,
          humidity: obs.humidity,
          windSpeed: obs.imperial.windSpeed,
          windDirection: obs.winddir,
        };

        // Now fetch forecast data
        return this.http.get<any>(this.forecastApiUrl).pipe(
          map((forecastData: any) => {
            console.log('Forecast API response:', forecastData);
            
            // Extract today and tomorrow forecast
            const result: WeatherData = {
              ...currentConditions,
              todayCondition: forecastData.daypart?.[0]?.wxPhraseShort?.[0] || forecastData.daypart?.[0]?.wxPhraseShort?.[1],
              todayIconCode: forecastData.daypart?.[0]?.iconCode?.[0] || forecastData.daypart?.[0]?.iconCode?.[1],
              todayHigh: forecastData.temperatureMax?.[0],
              todayLow: forecastData.temperatureMin?.[0],
              tomorrowCondition: forecastData.daypart?.[0]?.wxPhraseShort?.[2],
              tomorrowIconCode: forecastData.daypart?.[0]?.iconCode?.[2],
              tomorrowHigh: forecastData.temperatureMax?.[1],
              tomorrowLow: forecastData.temperatureMin?.[1],
            };
            
            return result;
          }),
          catchError((forecastError) => {
            console.warn('Forecast API error, using current conditions only:', forecastError);
            // Return at least current conditions
            return of(currentConditions);
          })
        );
      }),
      catchError((error) => {
        console.error('Weather API error:', error);
        // Return dummy data so pane doesn't crash
        return of({
          temperature: 0,
          feelsLike: 0,
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
