// This is a template for environment configuration.
// Copy this file to environment.ts and environment.prod.ts,
// then fill in your actual API keys and endpoints.
// DO NOT commit files with real API keys.

export const environment = {
  production: false,
  apiKey: 'your-api-key-here',
  weatherApi: {
    baseUrl: 'https://api.weather.com/v2/pws/observations/current',
    stationId: 'YOUR_STATION_ID',
    geocode: 'LAT,LON',
    apiKey: 'YOUR_WEATHER_API_KEY',
  },
  solarApi: {
    baseUrl: 'https://services.swpc.noaa.gov/json/solar-indices/27-day-outlook.json',
  },
  radar: {
    lat: 0,
    lon: 0,
    zoom: 7,
  },
};
