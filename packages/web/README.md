Welcome to your new TanStack Start app!

# Getting Started

To run this application:
# Web Client

TanStack Start and React client for browsing events and booking tickets.

## Run locally

```bash
npm install
npm run dev
```

The client is available at `http://localhost:3000`.

## Commands

```bash
npm run build
npm run lint
npm run check
```

## Authentication

The login and registration screens are presentation views. Connect them to the auth service before enabling account creation or login; do not store passwords in browser storage.
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
