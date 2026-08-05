# DRCMS

Disaster Response Coordination Management System (DRCMS) is a simple full-stack demo with a Node.js backend and a static frontend.

## Project structure

- `Backend/` — Node.js API server using PostgreSQL for persistence
- `Frontend/` — Static HTML/CSS/JS app served with `http-server`
- `package.json` — Root script definitions for running the full project
- `.gitignore` — Ignore local build and environment artifacts

## Requirements

- Node.js 18+ recommended
- npm

## Local development

Install dependencies at the root and backend:

```bash
npm install
npm install --prefix Backend
```

Start both servers together:

```bash
npm start
```

Then open the frontend in your browser at:

- `http://127.0.0.1:3000`

The backend API listens on:

- `http://localhost:4000`

## Authentication flow

The app currently redirects unauthenticated visitors to the login page. Sign-up and login are handled by the backend API.

## GitHub deployment

To deploy this project to GitHub, initialize the repo, commit your files, and push to a remote repository:

```bash
git init
git add .
git commit -m "Initial DRCMS project commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## GitHub Actions

A simple validation workflow is included under `.github/workflows/nodejs.yml`. It installs dependencies and checks the backend/frontend JavaScript files for syntax errors.

## Notes

- The backend uses PostgreSQL for persistence and does not commit local database state.
- If you need a production-ready deployment, add a build process and a dedicated hosting service.
 - If you need a production-ready deployment, add a build process and a dedicated hosting service.

## Deploying the Backend to Railway

1. Push the repository to GitHub (if not already):

```bash
git init
git add .
git commit -m "Initial DRCMS project commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

2. On Railway:
- Create a new project and choose "Deploy from GitHub".
- Select your repository and set the Root Directory to `Backend`.
- Railway will detect `package.json` and run `npm install` then `npm start`.

3. Environment and port
- The server reads `process.env.PORT` and falls back to `4000`, so no extra config is needed.

4. PostgreSQL persistence
- The backend uses PostgreSQL for persistence.
- Ensure Railway has a Postgres plugin attached and `DATABASE_URL` is configured.

5. Frontend after deploy
- Update the frontend API base URL to the Railway service URL (for example, `https://your-service.up.railway.app`).

Need help? I can create a `railway.json`, add a README section (this change), or help migrate to Postgres.
 
## Deploying the Backend

### Railway

1. Push the repository to GitHub if you haven't already.
2. Create a new Railway project and connect your repository.
3. Set the root directory to `Backend`.
4. Railway will detect `package.json`, install dependencies, and run `npm start`.
5. Add a PostgreSQL plugin in Railway and set `DATABASE_URL` automatically.

The backend listens on `process.env.PORT` with a fallback to `4000`.

### Heroku / Render

1. Push the repository to GitHub.
2. Create a new app and set the root to `Backend`.
3. Add `DATABASE_URL` in the app's environment variables.
4. Heroku/Render will use `Backend/Procfile` to start the server.

### Frontend

Host `Frontend/` as a static site on any provider (GitHub Pages, Vercel, Netlify, etc.).
Update the frontend API base URL to point to the deployed backend service.

Notes:
- The backend uses PostgreSQL for persistence.
- The backend is ready to deploy with `railway.json` and `Backend/Procfile`.
