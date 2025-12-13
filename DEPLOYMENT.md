# Docker Deployment Guide

This guide walks you through deploying freqframe to your homelab using Docker Compose.

## Prerequisites

- Docker & Docker Compose installed on your Ubuntu server
- Pi-hole running on your network
- CalDAV credentials (username/password)
- mkcert installed (for certificate generation)

## Setup Steps

### 1. Generate SSL Certificates

Install mkcert if you haven't already:
```bash
# On macOS
brew install mkcert

# On Linux (Ubuntu/Debian)
sudo apt-get install libnss3-tools
curl -JLO https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

Generate certificates in your freqframe repo:
```bash
mkdir -p certs
cd certs
mkcert homedashboard.local
cd ..
```

This creates:
- `certs/homedashboard.local.crt`
- `certs/homedashboard.local.key`

### 2. Configure CalDAV Credentials

Create your local calendar configuration:
```bash
cp apps/freqframe-api/src/app/config/calendars.example.yaml apps/freqframe-api/src/app/config/calendars.local.yaml
```

Edit `calendars.local.yaml` with your calendar URLs (see CALDAV_SETUP.md for details).

Create a `.env` file in the repo root:
```bash
CALDAV_USERNAME=your-username
CALDAV_PASSWORD=your-password
```

### 3. Configure Pi-hole DNS

In your Pi-hole dashboard:
1. Go to Local DNS Records
2. Add a new record:
   - Domain: `homedashboard.local`
   - IP Address: `<your-homelab-ip>`
3. Save

### 4. Build and Deploy

```bash
# Build images (first time only, or when code changes)
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Access the Application

Open your browser and navigate to:
```
https://homedashboard.local:8443
```

You'll see a security warning (self-signed cert) — that's normal. Proceed anyway.

## Troubleshooting

### Certificate issues
```bash
# Verify certificates are readable
ls -la certs/

# Regenerate if needed
rm certs/*
# Then run mkcert command again
```

### Container fails to start
```bash
# Check logs
docker-compose logs freqframe-api
docker-compose logs freqframe-ui
docker-compose logs nginx
```

### DNS not resolving
```bash
# Test from homelab server
nslookup homedashboard.local

# If it doesn't resolve, check Pi-hole logs
```

### API connection errors
- Verify `calendars.local.yaml` exists and is readable
- Check `.env` file has correct CalDAV credentials
- Verify calendar URLs are accessible from the server

## Updating the Application

When you pull new code:
```bash
git pull origin alpha
docker-compose build
docker-compose up -d
```

## File Structure

```
freqframe/
├── docker-compose.yml          # Orchestration config
├── Dockerfile.api              # API container build
├── Dockerfile.ui               # UI container build
├── nginx.conf                  # Reverse proxy config
├── certs/                      # SSL certificates (gitignored)
│   ├── homedashboard.local.crt
│   └── homedashboard.local.key
└── .env                        # CalDAV credentials (gitignored)
```

All sensitive files (certs, .env, calendar configs) are in `.gitignore` and won't be pushed to the repo.

## Port Mapping

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| API | 3000 | (via nginx) | NestJS backend |
| UI | 4200 | (via nginx) | Angular frontend |
| nginx | 443 | 8443 | HTTPS reverse proxy |
| nginx | 80 | 80 | HTTP redirect |

## Security Notes

- Self-signed certificates are trusted locally by mkcert
- Network access is limited to your local network (Pi-hole DNS)
- CalDAV credentials stored in `.env` (never commit this!)
- Consider adding authentication layer for family members if needed
