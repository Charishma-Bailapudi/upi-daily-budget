# Specification: Day 02 — MongoDB Connection & Health Check

## 1. Objective

Establish a persistent, resilient connection from Express to MongoDB Atlas using Mongoose. Add a non-blocking `GET /health` endpoint so we can instantly verify database health.

## 2. Invariants & Rules

- The MongoDB URI must strictly come from `process.env.MONGODB_URI`. Never hardcode credentials.
- Graceful shutdown: When the server is stopped (SIGINT / Ctrl+C), close the MongoDB connection before shutting down.
- Health check must check `mongoose.connection.readyState` without running heavy queries.

## 3. Files to Touch

- `backend/package.json` (install `mongoose`)
- `backend/src/config/db.js` (create connection logic)
- `backend/src/routes/healthRoutes.js` (create health endpoint)
- `backend/src/app.js` (mount healthRoutes)
- `backend/server.js` (await connectDB before starting server listener)

## 4. Technical Details

### A. Connection Logic (`backend/src/config/db.js`)

- Export an async function `connectDB()`.
- Connect using `mongoose.connect(process.env.MONGODB_URI)`.
- Listen for connection events:
  - `'connected'`: Log `"MongoDB connected successfully"`.
  - `'error'`: Log connection error.
- Handle process termination (`SIGINT`) to close Mongoose connection cleanly.

### B. Health Route (`backend/src/routes/healthRoutes.js`)

- Route: `GET /health`
- Check `mongoose.connection.readyState`:
  - If equal to `1` (connected), return HTTP `200`:
    ```json
    { "status": "healthy", "database": "connected" }
    ```
  - Otherwise, return HTTP `503`:
    ```json
    { "status": "unhealthy", "database": "disconnected" }
    ```
