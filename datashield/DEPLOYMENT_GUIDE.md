# Deployment Guide

This guide explains how to deploy the DataShield application across modern hosting platforms: Vercel for frontend and Render for backend and ML service. It also covers MongoDB Atlas configuration.

## Frontend Deployment on Vercel

### 1. Create a Vercel Project
- Sign in to Vercel and create a new project.
- Connect your GitHub repository.
- Select the `frontend` folder as the deployment root.

### 2. Configure Build Settings
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### 3. Set Environment Variables
- `VITE_API_URL` – the public backend URL (for example, `https://your-backend.onrender.com`)

### 4. Deploy
- Trigger a deploy from Vercel.
- Verify the site loads and the dashboard can reach the backend API.

## Backend Deployment on Render

### 1. Create a Render Web Service
- Sign in to Render.
- Create a new Web Service and connect your GitHub repository.
- Set the root directory to `backend`.

### 2. Configure Build & Start Commands
- Build Command: `npm install`
- Start Command: `npm run start`
- Environment: `Node 18` or later

### 3. Set Environment Variables
- `MONGO_URI` – MongoDB Atlas connection string
- `JWT_SECRET` – a secure secret
- `PORT` – typically `10000` or the Render-assigned port
- `ML_API_URL` – `https://<ml-service>.onrender.com/predict`

### 4. Deploy and verify
- Deploy the backend service.
- Confirm the API is reachable from the browser or `curl`.

## ML Deployment on Render

### 1. Create a Render Web Service
- Use the `ml-service` folder as the root for the service.
- Choose Python runtime.

### 2. Configure Build & Start Commands
- Build Command: `pip install -r requirements.txt`
- Start Command: `python app.py`

### 3. Set Environment Variables
- `PORT` – as provided by Render or default to `8000`

### 4. Deploy and verify
- Confirm the `/health` endpoint responds.
- Confirm the backend can successfully call `POST /predict`.

## MongoDB Atlas Configuration

### 1. Create a Cluster
- Sign in to MongoDB Atlas and create a new cluster.
- Choose a modern MongoDB version and region.

### 2. Create Database User
- Add a database user with a strong password.
- Grant the user access to the required database.

### 3. Configure Network Access
- Add IP access rules for your deployment environment or use `0.0.0.0/0` temporarily during setup.

### 4. Get Connection String
- Copy the connection string and update it with your username, password, and database name.
- Example:
  ```
  mongodb+srv://<username>:<password>@cluster0.mongodb.net/datashield?retryWrites=true&w=majority
  ```

### 5. Set the Atlas URI in Render
- Use the `MONGO_URI` environment variable in Render.

## Production Best Practices

- Use HTTPS for all services.
- Keep `JWT_SECRET` confidential.
- Use environment-specific variables in Vercel and Render.
- Enable monitoring and logging for backend and ML services.
- Configure backup and recovery for MongoDB Atlas.

## Validation Steps

- Confirm frontend loads and authenticates successfully.
- Confirm backend responds to `/api/auth/me`, `/api/scans`, and `/api/alerts`.
- Confirm ML endpoint at `/health` and `/predict` responds correctly.
- Confirm Socket.IO real-time events deliver alerts and scans.

## Notes

- Render automatically exposes the port based on service configuration.
- Vercel serves the frontend statically and should point to the backend API URL.
- `ML_API_URL` must be accessible from the backend deployment.
