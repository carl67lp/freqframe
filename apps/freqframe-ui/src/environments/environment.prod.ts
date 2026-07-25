// Production environment configuration
// Fill in your actual API keys and endpoints here.
// This file is in .gitignore and should NOT be committed with real keys.

export const environment = {
  production: true,
  apiBaseUrl: '', // Empty string means use relative path (current origin)
  apiKey: 'change-me-in-production',
  weatherApi: {
    baseUrl: 'https://api.weather.com/v2/pws/observations/current',
    stationId: 'WEATHER_STATION_ID_REDACTED',
    // Required by the daily forecast call — "lat,lon", e.g. '42.0367,-83.3411'.
    geocode: 'WEATHER_GEOCODE_REDACTED',
    apiKey: 'WEATHER_API_KEY_REDACTED',
  },
  solarApi: {
    baseUrl: 'https://services.swpc.noaa.gov/json/solar-indices/27-day-outlook.json',
  },
  radar: {
    lat: 42.037,
    lon: -83.341,
    zoom: 7,
  },
};
