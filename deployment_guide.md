# Deployment Guide: Email Outreach CRM

This document guides you through deploying your application: **Frontend on Vercel**, **Backend on Render**, and **Redis setup** on Upstash/Redis Labs.

---

## 1. Backend Deployment on Render

### Step 1: Create a Render Account & New Web Service
1. Go to [Render](https://render.com) and sign in.
2. Click **New +** and select **Web Service**.
3. Connect your Git repository.

### Step 2: Configure Web Service Settings
* **Name**: `email-outreach-backend` (or similar)
* **Root Directory**: `backend`
* **Runtime**: `Node`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Instance Type**: `Web Service (Free or Paid)`

### Step 3: Add Environment Variables
In your Render Service Dashboard, navigate to the **Environment** tab and add the following variables:

| Variable Name | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Set to production environment |
| `API_BASE_URL` | `https://your-backend-url.onrender.com` | Your generated Render Web Service URL |
| `FIREBASE_DATABASE_URL` | `https://your-project.firebaseio.com` | Firebase Realtime Database URL |
| `FIREBASE_SERVICE_ACCOUNT` | `{"type": "service_account", ...}` | Paste the entire content of your `firebase-service-account.json` file as a one-line JSON string |
| `REDIS_URL` | `redis://...` or `rediss://...` | Connection URL for your Redis instance (see Section 2) |
| `SMTP_HOST` | `smtp.gmail.com` | Google/Gmail SMTP Host |
| `SMTP_PORT` | `465` | SMTP Port |
| `SMTP_SECURE` | `true` | Secure connection indicator |
| `SMTP_USER` | `your-email@gmail.com` | SMTP Email username |
| `SMTP_PASS` | `your-app-password` | App Password (not account password) |

---

## 2. Setting Up Redis (Alternative Hosting)

If Render Redis is not available on your account (or requires card validation), you can easily host your Redis server for free on one of these services:

### Option A: Upstash Serverless Redis (Recommended & Easiest)
Upstash offers a serverless Redis database with a generous free tier (10,000 requests per day), which is perfect for this CRM.
1. Register/Sign in to [Upstash](https://upstash.com/) (using GitHub or Google).
2. Click **Create Database**.
3. Choose a name (e.g., `outreach-redis`) and select the region closest to your Render backend location.
4. Under the **Connect to your database** section, find **Redis Connect URL** (starting with `rediss://`).
5. Copy that URL.
6. In your Render Backend Web Service's **Environment** tab, add:
   * Key: `REDIS_URL`
   * Value: `rediss://default:yourpassword@yourhost.upstash.io:32154` (your copied connection URL)

---

### Option B: Redis Cloud by Redis Labs (Official Hosting)
Redis Labs offers a free subscription with 30MB of RAM, which is more than enough for BullMQ jobs.
1. Sign up at [Redis Cloud](https://redis.com/redis-enterprise-cloud/overview/).
2. Create a new Free Subscription and database.
3. Once active, go to your Database settings and copy the **Public Endpoint** (e.g., `redis-12345.c250.us-east-1-1.ec2.cloud.redislabs.com:12345`).
4. Note down the **Redis password** in the Security section of the database settings.
5. Combine them into a single connection string:
   `redis://default:password@endpoint:port`
6. In your Render Backend Web Service's **Environment** tab, add:
   * Key: `REDIS_URL`
   * Value: `redis://default:your_redis_password@redis-12345.c250.us-east-1-1.ec2.cloud.redislabs.com:12345`

---

## 3. Frontend Deployment on Vercel

### Step 1: Create a Vercel Project
1. Go to [Vercel](https://vercel.com) and log in.
2. Click **Add New** -> **Project**.
3. Import your Git repository.

### Step 2: Configure Project Settings
* **Framework Preset**: `Vite`
* **Root Directory**: Click *Edit* and select the **`frontend`** directory.

### Step 3: Add Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend-url.onrender.com/api` | **Must end in `/api`** |

### Step 4: Click Deploy 🚀
Vercel will build the frontend bundle and serve the app. 

> [!IMPORTANT]
> A custom `vercel.json` has been created inside your frontend folder. It routes all direct page access (like reloading on `/leads`) back to `/index.html` so that React Router's client-side navigation functions flawlessly without 404 errors.
