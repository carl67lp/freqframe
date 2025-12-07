// This is a template for environment configuration.
// Copy this file to environment.ts and environment.prod.ts,
// then fill in your actual API keys and endpoints.
// DO NOT commit files with real API keys.

export const environment = {
  production: false,
  weatherApi: {
    baseUrl: 'https://api.weather.com/v2/pws/observations/current',
    stationId: 'YOUR_STATION_ID',
    apiKey: 'YOUR_WEATHER_API_KEY',
  },
  solarApi: {
    baseUrl:
      'https://services.swpc.noaa.gov/json/solar-indices/27-day-outlook.json',
  },
  bandConditionsApi: {
    baseUrl: 'https://www.hamqsl.com/solar.html',
  },
};
