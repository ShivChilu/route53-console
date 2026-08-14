# AWS Route 53 Clone

A production-quality clone of the **AWS Route 53 web console**, focusing on Hosted Zones and DNS Records management workflows.

This application replicates the AWS Route 53 console layout, UI/UX, navigation, tables, forms, validation, and API behavior with persistent local database storage.

---

## Tech Stack

*   **Frontend**: Next.js (App Router), TypeScript, React, Tailwind CSS, Lucide Icons.
*   **Backend**: FastAPI (Python), REST API, Pydantic, SQLAlchemy.
*   **Database**: SQLite (persistent local database file `route53.db`).

---

## Architecture Diagram

```text
Browser (Next.js client)
   ↓ (REST API with cookies/bearer JWT authentication)
FastAPI Backend
   ↓ (SQLAlchemy ORM)
SQLite Database (route53.db)
```

---

## Folder Structure

```text
route53-clone/
│
├── frontend/
│   ├── app/                      # App router page templates
│   ├── components/               # Reusable UI controls and app shell layouts
│   │   ├── layout/               # Header, Sidebar, Breadcrumbs, AppLayout
│   │   └── ui/                   # AWS-style dense Button, Modal, Input, Select, Toast
│   ├── lib/
│   │   └── api/                  # API client modules
│   ├── hooks/                    # useAuth authentication provider state hook
│   ├── types/                    # Domain typescript definitions
│   ├── public/
│   ├── styles/                   # globals.css custom layouts
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry config and stats router
│   │   ├── database.py           # SQLAlchemy setup
│   │   ├── dependencies.py       # Current user injection
│   │   ├── models/               # ORM database models (User, HostedZone, DNSRecord)
│   │   ├── schemas/              # Input/output Pydantic schemas (with validators)
│   │   ├── routers/              # Controller path routes (auth, hosted zones, records)
│   │   ├── services/             # Core business service logic
│   │   └── seed.py               # Database initialization and seeder script
│   └── requirements.txt
│
└── README.md
```

---

## Database Schemas

### `users`
*   `id` (Integer, Primary Key)
*   `email` (String, Unique, Index)
*   `password_hash` (String)
*   `name` (String)
*   `created_at` (DateTime)

### `hosted_zones`
*   `id` (Integer, Primary Key)
*   `user_id` (Integer, Foreign Key)
*   `zone_id` (String, Unique, Index)
*   `name` (String, Index)
*   `type` (String) - `"public"` or `"private"`
*   `description` (String)
*   `private_zone` (Boolean)
*   `created_at` (DateTime)
*   `updated_at` (DateTime)

### `dns_records`
*   `id` (Integer, Primary Key)
*   `hosted_zone_id` (Integer, Foreign Key, CASCADE ON DELETE)
*   `name` (String, Index) - e.g. `www.example.com.`
*   `type` (String, Index) - e.g. `A`, `AAAA`, `MX`, `TXT`, etc.
*   `ttl` (Integer)
*   `value` (String)
*   `routing_policy` (String) - default `"Simple"`
*   `alias` (Boolean) - default `False`
*   `health_check_id` (String, Nullable)
*   `created_at` (DateTime)
*   `updated_at` (DateTime)

---

## API Endpoints

### Authentication
*   `POST /api/auth/login` - Set session cookie & returns user object
*   `POST /api/auth/logout` - Clear session cookie
*   `GET /api/auth/me` - Retrieve current active user profile

### Hosted Zones
*   `GET /api/hosted-zones` - Paginated & search/filter query
*   `POST /api/hosted-zones` - Creates zone & default NS/SOA records
*   `GET /api/hosted-zones/{zone_id}` - Retrieve details
*   `PATCH /api/hosted-zones/{zone_id}` - Modify description
*   `DELETE /api/hosted-zones/{zone_id}` - Wipes zone and related records

### DNS Records
*   `GET /api/hosted-zones/{zone_id}/records` - Paginated records list inside zone
*   `POST /api/hosted-zones/{zone_id}/records` - Validates & adds DNS record
*   `PATCH /api/hosted-zones/{zone_id}/records/{record_id}` - Edit TTL/Values
*   `DELETE /api/hosted-zones/{zone_id}/records/{record_id}` - Delete DNS record (restricted for default root NS/SOA)

---

## Demo Credentials

Use these credentials to sign in immediately:
*   **Email**: `admin@example.com`
*   **Password**: `admin123`

---

## Local Setup

### 1. Run Backend API
Navigate to the `backend` folder:
```bash
cd backend
# Activate Python Virtual Environment
.\venv\Scripts\activate
# Install requirements
pip install -r requirements.txt
# Run database seeder (seeds default admin user & demo zones)
python -m app.seed
# Run FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Run Frontend
Navigate to the `frontend` folder:
```bash
cd frontend
# Install packages
npm install
# Run Development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
