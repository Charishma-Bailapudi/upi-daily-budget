# Specification: Day 01 — Scaffolding & Setup

## 1. Goal

Initialize a Node.js + Express backend and a React + Vite frontend with clean environment templates.

## 2. Files to Create

- `backend/package.json`
- `backend/.env.example`
- `backend/.env`
- `backend/server.js`
- `backend/src/app.js`
- `frontend/` (Vite React app)

## 3. Backend Requirements

- Express app with: `helmet`, `cors`, `morgan`, and `express.json()`.
- Root route: `GET /` returning `{ "status": "UPI Budget API running" }`.
- Read port from `process.env.PORT` (default 5000).

## 4. Frontend Requirements

- React Vite application.
