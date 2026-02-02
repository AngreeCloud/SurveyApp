# Satisfaction Feedback Kiosk

A customer satisfaction feedback application with a kiosk interface for collecting feedback and an admin dashboard for viewing statistics.

## Overview

This application allows customers to rate their experience with three satisfaction levels (Muito Satisfeito, Satisfeito, Insatisfeito) via a kiosk interface. Administrators can view statistics and export data through a protected dashboard.

## Architecture

- **Frontend**: Next.js 16 with React 19, TypeScript, TailwindCSS, and Radix UI components
- **Backend**: Python Flask API with psycopg for PostgreSQL connectivity
- **Database**: PostgreSQL (Replit-managed)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard (protected)
│   ├── kiosk/              # Customer feedback kiosk
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Redirects to /admin
├── backend/                # Flask API
│   ├── app.py              # Main API application
│   └── requirements.txt    # Python dependencies
├── components/             # UI components (shadcn/ui)
├── lib/                    # Utility functions
├── public/                 # Static assets
└── styles/                 # Global styles
```

## Running the Application

### Development

The application runs with two workflows:
- **Frontend**: `npm run dev -- -p 5000 -H 0.0.0.0` (port 5000)
- **Backend**: `cd backend && python app.py` (port 3001)

The Next.js frontend proxies API requests to the Flask backend via rewrites.

### Production

Build with `npm run build`, then run both the Next.js server and Flask backend.

## API Endpoints

- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get feedback entries
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/export` - Export data (CSV/TXT)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `ADMIN_PASSWORD` - Admin dashboard password (default: admin123)

## Database Schema

```sql
CREATE TABLE satisfaction_feedback (
    id SERIAL PRIMARY KEY,
    satisfaction_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Recent Changes

- 2026-02-02: Initial Replit setup with database, workflows, and deployment configuration
