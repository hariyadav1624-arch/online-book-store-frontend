# BookNest frontend

BookNest is a React frontend for the Spring Boot online bookstore API.

## Requirements

- Node.js 18 or newer
- The backend running on `http://localhost:8080`

## Run locally

From this folder:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The development server proxies `/api` requests to the backend, so the browser does not need a separate CORS configuration.

## Production build

```sh
npm run build
npm run preview
```

The API defaults to `/api/books`. To use a different API base URL, set `VITE_API_URL` in the environment before building or running Vite.

## Features

- Browse books with server-side pagination and sorting
- Search by title or author
- Add, edit, and delete books through the bookstore API
- Responsive layout for desktop and mobile
