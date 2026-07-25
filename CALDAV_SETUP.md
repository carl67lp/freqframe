# CalDAV Configuration Setup

This project uses CalDAV to sync calendar events from sources like iCloud, Google Calendar, or Nextcloud.

## Setup Instructions

1. **Copy the template file:**
   ```bash
   cp apps/freqframe-api/src/app/config/calendars.example.yaml apps/freqframe-api/src/app/config/calendars.local.yaml
   ```

2. **Edit the local config file** with your calendar URLs:
   - For **iCloud**: Get your CalDAV URL from iCloud settings
   - For **Google Calendar**: Use Google's CalDAV endpoint
   - For **Nextcloud**: Use your Nextcloud instance URL

3. **Add credentials** (if needed) as environment variables:
   ```bash
   export CALDAV_USERNAME="your-username"
   export CALDAV_PASSWORD="your-password"
   ```

   Or create a `.env.local` file in `apps/freqframe-api/`:
   ```
   CALDAV_USERNAME=your-username
   CALDAV_PASSWORD=your-password
   ```

## Security Note

⚠️ **Never commit calendar configuration files to git!**

The `.gitignore` is configured to ignore `calendars.*.yaml` files. Always keep your local configuration files with sensitive URLs and credentials in `.gitignore`.

## API Endpoints

- `GET /api/calendars` — List available calendars
- `GET /api/calendars/events` — Get all events from all calendars
- `GET /api/calendars/events?name=Home` — Get events from specific calendar
- `GET /api/calendars/events?startDate=2025-01-01&endDate=2025-01-31` — Filter by date range
