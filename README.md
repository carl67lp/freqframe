# Freqframe

A home dashboard application for amateur radio operators, built with Angular and NestJS in an Nx monorepo.

## Features

### Ham Radio Dashboard

-   **Band Conditions**: Real-time propagation data
-   **Solar Data**: Current solar weather and indices
-   **Weather**: Local weather conditions
-   **Calendar**: CalDAV integration for viewing events
-   **QSO Pane**: Family notes with voice input via Siri

### Family Notes API

Voice-controlled note-taking system with iOS Shortcuts integration:

-   Create notes via Siri: "Hey Siri, Family Note"
-   Auto-refresh display every 15 seconds
-   SQLite database with persistent storage
-   REST API endpoints for external integration

## Architecture

### Apps

-   **freqframe-ui**: Angular 20 standalone components with modern control flow
-   **freqframe-api**: NestJS REST API with TypeScript

### Shared

-   **shared-types**: Common TypeScript interfaces and types

### Tech Stack

-   **Frontend**: Angular 20, RxJS, modern `@if`/`@for` syntax
-   **Backend**: NestJS, better-sqlite3, Jest
-   **Infrastructure**: Docker, nginx reverse proxy, ngrok for external access
-   **Testing**: Jest with unit tests

## Development

### Prerequisites

-   Node.js
-   Docker and Docker Compose
-   ngrok (for external API access)

### Local Development

Run the API:

```sh
npx nx serve freqframe-api
```

Run the UI:

```sh
npx nx serve freqframe-ui
```

Run tests:

```sh
npx nx test freqframe-api
npx nx test freqframe-ui
```

### Docker Deployment

Build and start all services:

```sh
docker-compose up --build
```

Services:

-   **UI**: https://localhost:8443 (HTTPS) or http://localhost:8080 (HTTP)
-   **API**: http://localhost:3000 (internal)
-   **nginx**: Reverse proxy with SSL termination

### API Endpoints

#### Notes

-   `GET /api/notes` - Fetch all notes
-   `GET /api/notes/:id` - Fetch single note
-   `POST /api/notes` - Create note
    ```json
    {
        "author": "Device Name",
        "content": "Note content",
        "expiresAt": "2026-01-07T00:00:00Z"
    }
    ```
-   `DELETE /api/notes/:id` - Delete note

### iOS Shortcuts Integration

1. Set up ngrok tunnel: `ngrok http 8080`
2. Create iOS Shortcut with:
    - Dictation action
    - Set device name variable
    - POST to `https://your-ngrok-url.ngrok-free.dev/api/notes`
3. Trigger with: "Hey Siri, Family Note"

## Database

Notes stored in SQLite: `./data/db/notes.db` (persisted via Docker volume)

Schema:

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  expiresAt TEXT
);
```

## Project Structure

```
freqframe/
├── apps/
│   ├── freqframe-api/        # NestJS backend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── notes/    # Notes controller
│   │       │   └── services/
│   │       │       └── notes/ # Notes service & repository
│   │       └── main.ts
│   └── freqframe-ui/         # Angular frontend
│       └── src/
│           └── app/
│               ├── qso-pane/ # Notes display component
│               └── services/ # HTTP services
├── shared-types/             # Shared TypeScript types
├── docker-compose.yml
└── nginx.conf
```

## Additional Documentation

-   [CalDAV Setup](CALDAV_SETUP.md)
-   [Deployment Guide](DEPLOYMENT.md)

## License

Private project
