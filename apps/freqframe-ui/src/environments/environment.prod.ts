// Production environment configuration
// Fill in your actual API keys and endpoints here.
// This file is in .gitignore and should NOT be committed with real keys.

export const environment = {
  production: true,
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
