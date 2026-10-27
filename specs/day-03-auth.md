# Specification: Day 03 — User Model & JWT Authentication

## 1. Objective

Implement secure user registration, login with bcrypt password hashing, and stateless JWT token authentication with a protected `/api/v1/users/me` endpoint.

---

## 2. Invariants & Rules

- **Password Security**: Passwords must be hashed using `bcryptjs` with salt rounds = 10 before saving. Passwords must never be stored in plain text.
- **Password Concealment**: The `password` field on `User` must have `select: false` so it is never returned in API responses or generic queries unless explicitly selected.
- **Stateless Auth**: Authentication must use JSON Web Tokens (JWT) passed in the `Authorization: Bearer <token>` header.
- **Fail Fast & Explicit**: Missing or invalid tokens on protected endpoints must immediately return HTTP `401 Unauthorized`.
- **Validation**:
  - `email`: Required, unique, trimmed, lowercase, valid email regex pattern.
  - `password`: Required, minimum 6 characters.
  - `upiId`: Required, unique, trimmed, lowercase.
  - `defaultDailyCap`: Required, Number, default 3300, min 100.
- **No Floating Secrets**: `JWT_SECRET` and `JWT_EXPIRES_IN` must strictly come from `process.env`.

---

## 3. Dependencies to Add

In `backend/package.json`:

- `bcryptjs`
- `jsonwebtoken`

---

## 4. Environment Variables Required

In `backend/.env`:

- `JWT_SECRET`: Secret string for signing tokens (e.g. `upi_budget_jwt_secret_dev_key`)
- `JWT_EXPIRES_IN`: Token lifetime (e.g. `7d`)

---

## 5. Files to Create / Modify

```text
backend/
├── .env                                  # Add JWT_SECRET & JWT_EXPIRES_IN
├── package.json                          # Add bcryptjs & jsonwebtoken
├── src/
│   ├── models/
│   │   └── User.js                       # Update schema with password, hooks & methods
│   ├── middlewares/
│   │   └── authMiddleware.js             # Bearer token verification middleware (protect)
│   ├── controllers/
│   │   └── authController.js             # register, login, getMe handlers
│   ├── routes/
│   │   ├── authRoutes.js                 # POST /register, POST /login
│   │   └── userRoutes.js                 # GET /me (protected)
│   └── app.js                            # Mount /api/v1/auth and /api/v1/users
```
