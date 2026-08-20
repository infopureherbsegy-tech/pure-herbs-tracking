# Data persistence

The app now has two persistence modes:

1. **Local mode** (no `DATABASE_URL`): data is stored in `src/data.json`, written atomically, and protected by `data.json.bak`. It survives page refreshes and backend restarts on a machine with a persistent disk.
2. **PostgreSQL mode** (`DATABASE_URL` is set): the complete application state is stored in PostgreSQL in the `pure_herbs_state` table. The table is created automatically on first startup. Existing `src/data.json` is imported only when the database is empty.

The application does not automatically clear orders, customers, products, tracking, QC, documents, shipments, notifications, users, history, audit logs, or settings.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL` for production. Never commit `.env`.

For an online deployment, use a PostgreSQL provider with persistent storage and make sure the hosting platform itself does not use an ephemeral filesystem for the application database.
