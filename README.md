# College Event Registration System (CERS)

Beginner-friendly diploma PBL project with separate Student Portal, Admin Portal, and Backend API.

This project is built using:
- HTML
- CSS
- JavaScript
- Node.js
- Express
- SQLite

## Project Modules

- backend-api: REST API + SQLite database
- admin-portal: Admin pages for managing events, registrations, feedback
- student-portal: Student pages for browsing events, registration, QR wallet, dashboard

## Features

- Event listing
- Student registration
- Custom event registration fields
- Admin dashboard
- Seat capacity and waitlist
- CSV export for registrations
- Feedback management
- Student dashboard pages (QR wallet, recommendations, waitlist, timeline, feedback center)

## Folder Structure

```text
College Event Registration Sytem/
	backend-api/
	admin-portal/
	student-portal/
	database/
```

## Local Setup

### 1) Backend API

```bash
cd backend-api
npm install
npm start
```

Backend runs on:
- http://localhost:5000

### 2) Admin Portal

```bash
cd admin-portal
npm install
npm start
```

Admin portal runs on:
- http://localhost:4000

### 3) Student Portal

```bash
cd student-portal
npm install
npm start
```

Student portal runs on:
- http://localhost:3000

## Deployment Plan (Option A)

- Backend: Render
- Admin Portal: Vercel
- Student Portal: Vercel

## Deployment Configuration Notes

### Backend Environment Variables (Render)

Set these in Render service environment:

- PORT: Render provides this automatically
- CORS_ORIGINS: Comma-separated frontend domains
- DB_PATH: Absolute path to SQLite DB file (use persistent disk path)

Example CORS_ORIGINS value:

```text
https://your-admin-app.vercel.app,https://your-student-app.vercel.app
```

### Frontend API Base URL

Update both files with your real Render backend URL:

- admin-portal/public/js/api-base.js
- student-portal/public/js/api-base.js

Replace:

```text
https://YOUR-RENDER-BACKEND.onrender.com
```

with your real backend URL.

## Important Runtime Notes

- SQLite is file-based. On Render, use persistent disk for DB data.
- Keep database schema files in repository, but avoid committing runtime DB files.
- CORS must allow your deployed Vercel domains.

## Useful API Routes

- GET /events
- POST /events
- PUT /events/:id
- DELETE /events/:id
- POST /register
- GET /registrations
- DELETE /registrations/:id
- GET /registrations-by-event
- GET /registrations/export/csv
- GET /feedback
- POST /feedback

## Git Commands for Future Updates

```bash
git add .
git commit -m "your update message"
git push
```

## Author

Mahavir Sinh Gohil

Silver Oak University

Diploma IT Semester 4 PBL
