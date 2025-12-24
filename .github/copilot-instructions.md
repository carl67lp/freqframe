# Freqframe AI Coding Assistant Instructions

## Project Overview

Freqframe is a **Nx monorepo** containing a ham radio dashboard with calendar integration, weather, solar data, band conditions, and QSO logging.

- **Architecture**: Angular 20 frontend + NestJS backend
- **Type Safety**: TypeScript across entire stack with strict tsconfig
- **Shared Types**: `@freqframe/shared-types` library for frontend-backend contracts
- **CalDAV Integration**: Aggregates calendar events from iCloud, Google, Nextcloud

## Key Architectural Patterns

### Monorepo Structure (Nx)
- **Frontend**: `apps/freqframe-ui/` (Angular 20 standalone components)
- **Backend**: `apps/freqframe-api/` (NestJS with decorators)
- **Shared**: `shared-types/` (exported types for both apps)

All tasks use Nx: `npx nx [target] [project]` (e.g., `npx nx serve freqframe-ui`)

### Frontend: Standalone Angular Components
- Uses **standalone: true** and **imports[]** instead of NgModules
- **Routing**: [app.routes.ts](apps/freqframe-ui/src/app/app.routes.ts) defines 6 panes (dashboard, weather, band-conditions, qso-list, solar-data, calendar)
- **Services**: Inject via Angular's `inject()` function; e.g., `private http = inject(HttpClient)`
- **Common Patterns**:
  - [CalendarService](apps/freqframe-ui/src/app/services/calendar.ts) uses `HttpClient` with `HttpParams` for query strings
  - Smart API URL selection: relative path in production, localhost:3000 in dev
  - RxJS observables for async operations with `shareReplay(1)` for caching

### Backend: NestJS Modules
- **App structure**: [app.module.ts](apps/freqframe-api/src/app/app.module.ts) imports ConfigModule, Controllers, Services
- **Config**: Uses `@nestjs/config` with `envFilePath` fallback to `.env.development` then `.env`
- **CORS Policy**: Explicitly allows `localhost`, `homelab.local`, `192.168.*` (development/homelab networking)
- **Key Services**:
  - [CalendarService](apps/freqframe-api/src/app/services/calendar/calendar.service.ts): Aggregates multiple CalDAV sources
  - [CaldavService](apps/freqframe-api/src/app/services/calendar/caldav.ts): Fetches/parses iCal events

### Cross-App Data Contracts
Types defined in [shared-types/src/lib/calendar.ts](shared-types/src/lib/calendar.ts):
```typescript
export interface CalendarEvent {
  id: string;
  calendarId?: string;
  title: string;
  start: string; // ISO 8601
  end?: string;
  allDay?: boolean;
}
```

Frontend calls `/api/calendars/events` → backend queries configured CalDAV sources → returns typed `CalendarEvent[]`

## Critical Developer Workflows

### Build & Serve
```bash
# Frontend only (dev server on :4200)
npx nx serve freqframe-ui

# Backend only (watches source, rebuilds on change)
npx nx serve freqframe-api

# Build for production
npx nx build freqframe-ui     # outputs to dist/apps/freqframe-ui
npx nx build freqframe-api    # outputs to dist/apps/freqframe-api
```

### Testing
```bash
# Run Jest tests for one project
npx nx test freqframe-ui
npx nx test freqframe-api

# Watch mode
npx nx test freqframe-ui --watch
```

### Linting
```bash
npx nx lint freqframe-ui
npx nx lint freqframe-api
```

### Docker / Production
- **Docker Compose**: Defined in [docker-compose.yml](docker-compose.yml) with 3 services (api, ui, nginx)
- **Nginx Proxy**: Handles SSL termination, reverse-proxies to both containers
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md) covers mkcert setup, CalDAV config, Pi-hole DNS
- Build via `docker-compose build && docker-compose up -d`

## Project-Specific Conventions

### Configuration Management
- **CalDAV Sources**: Defined in YAML (e.g., `calendars.local.yaml`, `calendars.production.yaml`)
- **Ignored by git**: All `calendars.*.yaml` files (see `.gitignore`)
- **Env Variables**: `CALDAV_USERNAME`, `CALDAV_PASSWORD` loaded in NestJS ConfigModule
- **Port Mapping**: API always runs :3000, UI :4200, Nginx :8443 (HTTPS)

### API Endpoints (NestJS Conventions)
- Global prefix: `/api/` (set in [main.ts](apps/freqframe-api/src/main.ts))
- Calendar endpoints:
  - `GET /api/calendars` — List configured calendars
  - `GET /api/calendars/events?startDate=ISO&endDate=ISO` — Fetch events with optional date filtering

### Event Grouping (Frontend Pattern)
- [CalendarPane](apps/freqframe-ui/src/app/calendar-pane/calendar-pane.ts) groups `CalendarEvent[]` by date
- Refreshes every 5 minutes (300000ms interval in Observable)
- Uses `map()` to transform API response → grouped/sorted display model

### Error Handling
- **Backend**: NestJS throws `HttpException(message, HttpStatus.BAD_REQUEST)` for invalid calendars
- **Frontend**: Subscribe error callbacks handle HTTP failures gracefully

## Integration Points & External Dependencies

### CalDAV / iCal Parsing
- Uses `ical.js` library to parse iCalendar format
- Backend validates calendar config exists before fetching
- Converts iCal events → canonical `CalendarEvent` interface

### HTTP Communication
- **Frontend**: `HttpClient` from `@angular/common/http`
- **CORS**: NestJS CORS middleware explicitly configured (not permissive)
- **Auth**: CalDAV URLs may contain embedded credentials (standard CalDAV pattern)

### Environment-Specific Behavior
- **Development**: Frontend hardcoded to `http://localhost:3000` API
- **Production**: Frontend uses relative path (Nginx reverse-proxy handles routing)
- **Docker**: Compose file mounts `calendars.production.yaml` as read-only volume

## Important Files Reference

| File | Purpose |
|------|---------|
| [apps/freqframe-ui/src/app/app.routes.ts](apps/freqframe-ui/src/app/app.routes.ts) | Route definitions for all 6 panes |
| [apps/freqframe-api/src/app/app.module.ts](apps/freqframe-api/src/app/app.module.ts) | NestJS module setup, ConfigModule, providers |
| [shared-types/src/lib/calendar.ts](shared-types/src/lib/calendar.ts) | Canonical `CalendarEvent` type contract |
| [apps/freqframe-ui/src/app/services/calendar.ts](apps/freqframe-ui/src/app/services/calendar.ts) | Frontend HTTP service, API URL logic |
| [apps/freqframe-api/src/app/services/calendar/calendar.service.ts](apps/freqframe-api/src/app/services/calendar/calendar.service.ts) | Backend calendar aggregation logic |
| [CALDAV_SETUP.md](CALDAV_SETUP.md) | How to configure CalDAV sources |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Docker/Nginx/mkcert setup for production |
| [nx.json](nx.json) | Nx task configuration, caching rules |

## Quick Tips

- **Type errors**: Always export/import from `@freqframe/shared-types` (aliased in tsconfig.base.json)
- **New panes**: Add route in `app.routes.ts`, create standalone component, inject `CalendarService` or other services as needed
- **Testing CalDAV**: Set local env vars and run `npx nx serve freqframe-api` — logs will show fetch results
- **Build errors**: Check that `shared-types` rebuilds first (`dependsOn` in project.json)
- **API contract changes**: Update interface in `shared-types/`, run `npx nx build shared-types`, then update API/Frontend code
