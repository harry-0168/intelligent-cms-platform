# Intelligent CMS Publishing Platform

A WordPress + FastAPI + React system that reads a brand theme config, generates brand-consistent page copy and hero imagery with AI, and publishes directly to WordPress.

## Project Structure

- `wordpress-theme/` custom WordPress theme and brand rules
- `backend/` FastAPI AI publishing pipeline (Dockerized)
- `frontend/` React dashboard for brief submission and live results
- `design-assets/` source design files and promo notes

## Setup

### WordPress

1. Create a local WordPress site (LocalWP recommended).
2. Copy `wordpress-theme/` into `wp-content/themes/` and activate it.
3. Create an application password for your WP user.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Or Docker:

```bash
cd backend
docker-compose up --build
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API

- `GET /health`
- `POST /generate` with:

```json
{
  "title": "Top 5 Reasons to Switch to Cloud Storage",
  "topic": "Cloud storage for businesses",
  "target_audience": "SMB owners",
  "additional_notes": "Include migration concerns"
}
```
