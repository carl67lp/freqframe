import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, interval, switchMap, startWith } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeatherData {
  /** Set when current conditions could not be fetched; no readings are present. */
  unavailable?: boolean;
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
            // Extract today and tomorrow forecast
            // daypart[0] arrays alternate day/night starting with today's
            // daytime, which the API nulls out once the day period has passed —
            // hence the fall back to today's night entry. Use ?? rather than ||
            // so that icon code 0 (tornado) is not treated as "missing".
            const daypart = forecastData.daypart?.[0];
            // The API returns null for periods that have passed; normalise to
            // undefined so the declared `number | undefined` type holds and the
            // template can test for presence without a null check too.
            const opt = <T,>(value: T | null | undefined): T | undefined => value ?? undefined;
            const result: WeatherData = {
              ...currentConditions,
              todayCondition: opt(daypart?.wxPhraseShort?.[0] ?? daypart?.wxPhraseShort?.[1]),
              todayIconCode: opt(daypart?.iconCode?.[0] ?? daypart?.iconCode?.[1]),
              todayHigh: opt(forecastData.temperatureMax?.[0]),
              todayLow: opt(forecastData.temperatureMin?.[0]),
              tomorrowCondition: opt(daypart?.wxPhraseShort?.[2]),
              tomorrowIconCode: opt(daypart?.iconCode?.[2]),
              tomorrowHigh: opt(forecastData.temperatureMax?.[1]),
              tomorrowLow: opt(forecastData.temperatureMin?.[1]),
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
        // Flag the failure rather than emitting zeros — on an always-on wall
        // display a fabricated "0°F / 0% humidity" reads as real weather.
        return of({
          unavailable: true,
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
