# Freqframe

A self-hosted home dashboard, built with Angular and NestJS in an Nx monorepo.
It is meant to run full-screen on an always-on display.

## Features

-   **Weather**: Current conditions from a Weather.com personal weather station,
    plus today's and tomorrow's forecast.
-   **Calendar**: CalDAV integration showing upcoming events across several
    calendars, grouped by day.
-   **Chores**: A read-only view of the [Cloud 9 task board](https://github.com/carl67lp/cloud9-chore-tracker) —
    month total against goal, pace, outstanding weekly jobs and bonus progress.
-   **Radar**: Leaflet map with a RainViewer precipitation overlay. Built, but
    currently off the dashboard — reachable at `/radar`.

## Architecture

### Apps

-   **freqframe-ui**: Angular 20 standalone components with modern control flow
-   **freqframe-api**: NestJS REST API with TypeScript

### Shared

-   **shared-types**: Common TypeScript interfaces and types

### Tech Stack

-   **Frontend**: Angular 20, RxJS, modern `@if`/`@for` syntax, Leaflet
-   **Backend**: NestJS, ical.js, Jest
-   **Infrastructure**: Docker, nginx reverse proxy
-   **Testing**: Jest with unit tests

## Development

### Prerequisites

-   Node.js
-   Docker and Docker Compose

### Configuration

Both of these are gitignored and must be created locally:

-   `.env` in the repo root — copy `.env.example` and fill in the CalDAV
    credentials and an `API_KEY`. The API rejects every request when `API_KEY`
    is unset. Set `CLOUD9_BASE_URL` to reach the Cloud 9 task board; leave it
    unset and the chore pane simply reports itself unavailable.
-   `apps/freqframe-ui/src/environments/environment.ts` — copy
    `environment.example.ts` and fill in the weather station ID, geocode,
    weather API key, and an `apiKey` matching the `API_KEY` above.

Calendar URLs live in `apps/freqframe-api/src/app/config/calendars.*.yaml`; see
[CALDAV_SETUP.md](CALDAV_SETUP.md).

### Local Development

Run the API:

```sh
npx nx serve freqframe-api
```

Run the UI:

```sh
npx nx serve freqframe-ui
```

Run lint, tests and builds:

```sh
npx nx run-many -t lint test build
```

### Docker Deployment

Build and start all services:

```sh
docker compose up --build
```

Services:

-   **UI**: https://localhost:8443 (HTTPS) or http://localhost:8080 (HTTP)
-   **API**: http://localhost:3000 (internal)
-   **nginx**: Reverse proxy with SSL termination

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full homelab setup.

### API Endpoints

All endpoints require an `X-Api-Key` header matching `API_KEY`.

-   `GET /api/calendars` — list the configured calendar names
-   `GET /api/calendars/events?name=&startDate=&endDate=` — events across all
    configured calendars, or one named calendar. Dates are ISO strings; events
    overlapping the window are returned, not only those starting inside it.
-   `GET /api/chores` — the Cloud 9 task board's state, fetched server-side from
    `CLOUD9_BASE_URL` and cached for 30s. Returns `{"unavailable": true, ...}`
    when the board is unreachable and nothing has been cached, or the last good
    response marked `"stale": true` when it has. It never returns zeroed
    figures, which would render as a real month with nothing earned.

## Project Structure

```
freqframe/
├── apps/
│   ├── freqframe-api/             # NestJS backend
│   │   └── src/app/
│   │       ├── calendars/         # Calendars controller
│   │       ├── chores/            # Cloud 9 task board proxy + cache
│   │       ├── config/            # Calendar YAML config loader
│   │       ├── guards/            # API key guard
│   │       └── services/calendar/ # CalDAV fetch and ICS expansion
│   └── freqframe-ui/              # Angular frontend
│       └── src/app/
│           ├── dashboard/         # Grid layout
│           ├── weather-pane/
│           ├── calendar-pane/
│           ├── chore-pane/        # Cloud 9 board, styled on-brand
│           ├── radar-pane/        # Not on the dashboard; routed at /radar
│           └── services/          # HTTP services
├── shared-types/                  # Shared TypeScript types
├── docker-compose.yml
└── nginx.conf
```

## Additional Documentation

-   [CalDAV Setup](CALDAV_SETUP.md)
-   [Deployment Guide](DEPLOYMENT.md)

## License

Private project
