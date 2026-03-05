# sloppy.ai

> Proof-of-concept AI chat platform — Node.js + MongoDB + Docker.

## Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Backend    | Node.js + Express              |
| Auth       | express-session + bcryptjs     |
| Database   | MongoDB (via Mongoose)         |
| Frontend   | Vanilla JS / HTML / CSS (SPA)  |
| Container  | Docker + docker-compose        |

## Project structure

```
sloppy.ai/
├── server.js              # Express entry point
├── models/
│   └── User.js            # Mongoose User model (bcrypt hashed passwords)
├── routes/
│   ├── auth.js            # /api/auth — login, register, logout, me
│   └── chat.js            # /api/chat — message endpoint (auth-guarded)
├── public/
│   ├── index.html         # Single-page app shell
│   ├── style.css          # Dark-mode UI styles
│   └── app.js             # Frontend SPA logic
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Quick start (Docker — recommended)

```bash
docker compose up --build
```

Open http://localhost:3000

## Quick start (local dev)

```bash
# Requires a local MongoDB instance on port 27017
npm install
npm run dev
```

## Environment variables

| Variable         | Default                              | Description                    |
|------------------|--------------------------------------|--------------------------------|
| `PORT`           | `3000`                               | HTTP port                      |
| `MONGO_URI`      | `mongodb://localhost:27017/sloppy-ai`| MongoDB connection string      |
| `SESSION_SECRET` | `sloppy-ai-secret-...`              | **Change this in production!** |

## API

| Method | Path                  | Auth? | Description             |
|--------|-----------------------|-------|-------------------------|
| POST   | /api/auth/register    | ✗     | Create account          |
| POST   | /api/auth/login       | ✗     | Log in, start session   |
| POST   | /api/auth/logout      | ✓     | Destroy session         |
| GET    | /api/auth/me          | ✓     | Current user info       |
| POST   | /api/chat/message     | ✓     | Send chat message       |

## UI Screens

- **Login screen** — username + password, register link auto-creates account then logs in
- **Chat screen** — ChatGPT-style bubbles; bot echoes your message in *italics*
