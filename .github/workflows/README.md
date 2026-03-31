# LBaraka CI/CD Pipeline

This directory contains the GitHub Actions workflow used for continuous integration.

## Workflow File: `ci.yml`

This pipeline is designed to ensure the stability of the `main` and `develop` branches. It triggers automatically under the following conditions:
- A `push` to the `main` or `develop` branch.
- A `pull_request` targeting the `main` or `develop` branch.

### Jobs:

1. **`backend-test`**
   - **Environment:** Ubuntu (latest version)
   - **Environment Setup:** Node.js version 20
   - **Steps:** 
     1. Checks out the code repository.
     2. Sets up the Node.js 20 environment.
     3. Installs package dependencies specifically in the `backend/` directory (`npm install`).
     4. Generates the Prisma Client (`npx prisma generate`).
     5. Builds the NestJS backend application (`npm run build`).

2. **`docker-build`**
   - **Environment:** Ubuntu (latest version)
   - **Dependency:** It strictly requires the `backend-test` job to pass successfully before running.
   - **Steps:**
     1. Checks out the code repository.
     2. Verifies the Docker Compose configuration by building all required services using `docker compose build`.

### Objective
This CI aims to keep the workflow extremely simple without requiring deployment steps. It acts as a safety measure preventing broken changes and ensuring both the backend server and Docker build environments act as expected prior to any merges.
