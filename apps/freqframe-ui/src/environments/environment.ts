// Development environment configuration
// Fill in your actual API keys and endpoints here.
// This file is in .gitignore and should NOT be committed with real keys.

export const environment = {
  production: false,
  weatherApi: {
    baseUrl: 'https://api.weather.com/v2/pws/observations/current',
    stationId: 'WEATHER_STATION_ID_REDACTED',
    apiKey: 'WEATHER_API_KEY_REDACTED',
  },
  solarApi: {
    baseUrl:
      'https://services.swpc.noaa.gov/json/solar-indices/27-day-outlook.json',
  },
  calendars: [
    {
      id: 'carl',
      name: 'Carl',
      url: 'https://example.com/calendar.ics',
      color: '#39a855ff',
      enabled: true,
    },
  ],
};
