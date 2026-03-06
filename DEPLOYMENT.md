# WalletSecure Deployment Guide

This guide breaks down the deployment into 4 distinct phases. We will deploy the backend first so that the frontend has an API to connect to when it builds.

---

## Phase 1: Preparation (GitHub)
Before deploying, your code must live on GitHub.

1. **Create an account:** Go to [GitHub.com](https://github.com) and create an account if you don't have one.
2. **Create a repository:** Click the `+` icon in the top right and select "New repository". Name it `walletsecure`. Do not initialize it with a README or .gitignore.
3. **Open your terminal:** Open PowerShell or Command Prompt, and navigate to your `walletsecure` project folder.
4. **Run these exact commands** (replace `USERNAME` with your GitHub username):
   ```bash
   git init
   git add .
   git commit -m "Ready for production"
   git branch -M main
   git remote add origin https://github.com/USERNAME/walletsecure.git
   git push -u origin main
   ```
*Verification: Go to your new GitHub URL and verify your files (especially the `frontend` and `backend` folders) are visible.*

---

## Phase 2: Deploy the Backend (Render.com)
We use Render to host the Python/FastAPI backend safely.

1. **Sign Up:** Go to [Render.com](https://render.com) and sign up using your GitHub account.
2. **Create Web Service:** In the Render dashboard, click **New +** and select **Web Service**.
3. **Connect Repo:** Click "Build and deploy from a Git repository". Connect your GitHub account and select your `walletsecure` repository.
4. **Configure Settings:**
   - **Name:** `walletsecure-api` (or whatever you prefer)
   - **Region:** Choose the region closest to you.
   - **Branch:** `main`
   - **Root Directory:** Type exactly `backend`. *(This is critical! It tells Render where the backend Dockerfile is).*
   - **Environment:** Select `Docker`.
   - **Instance Type:** Select the **Free** tier.
5. **Add Environment Variables:** Scroll down to the "Environment Variables" section. Click "Add Environment Variable" for each of these (copy the exact values from your local `backend/.env` file):
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET_KEY` = your secret key
   - `ALCHEMY_API_KEY` = your Alchemy API key
   - `ETHERSCAN_API_KEY` = your Etherscan key
   - `STRIPE_SECRET_KEY` = your stripe key
   - `STRIPE_WEBHOOK_SECRET` = your stripe webhook secret
   - `CORS_ORIGINS` = `http://localhost:3000` *(We will change this in Phase 4!)*
6. **Deploy:** Click **Create Web Service**. 
7. **Wait & Copy URL:** It will take a few minutes to build. Once it says "Live", look near the top left under the name for the URL (it looks like `https://walletsecure-api...onrender.com`). **Copy this URL.**

---

## Phase 3: Deploy the Frontend (Vercel.com)
We use Vercel to host the React UI. It's incredibly fast and free.

1. **Sign Up:** Go to [Vercel.com](https://vercel.com) and sign up using your GitHub account.
2. **Add Project:** Click **Add New** and select **Project**.
3. **Import Repo:** You will see a list of your GitHub repositories. Click **Import** next to `walletsecure`.
4. **Configure Settings:**
   - **Project Name:** `walletsecure`
   - **Framework Preset:** Vercel should auto-detect `Create React App`.
   - **Root Directory:** Click "Edit", select the `frontend` folder, and click Continue. *(This is critical!)*
5. **Add Environment Variables:** Expand the "Environment Variables" section. Add this exactly:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** Paste the URL you copied from Render in Phase 2. *(e.g., `https://walletsecure-api.onrender.com`)*
6. **Deploy:** Click the **Deploy** button.
7. **Wait & Copy URL:** Vercel will build the frontend. When you see the success screen with confetti, click **Continue to Dashboard**. Click the "Visit" button to see your live site, and **copy the URL from your browser address bar** (e.g., `https://walletsecure...vercel.app`).

---

## Phase 4: Final Security Handshake (CORS)
Currently, if you try to use the live frontend, nothing will work because the backend is only allowing connections from "localhost". We must secure this.

1. **Go back to Render:** Open your `walletsecure-api` Web Service in the Render dashboard.
2. **Navigate to Environment:** Click on "Environment" in the left sidebar menu.
3. **Update CORS:** Find the `CORS_ORIGINS` variable you set in Phase 2.
4. **Paste Vercel URL:** Replace `http://localhost:3000` with the live URL of your Vercel frontend. 
   - *CRITICAL RULE: Do NOT put a trailing slash `/` at the end of the URL. It must be exactly `https://walletsecure-xyz.vercel.app`*
5. **Save:** Click **Save Changes**. Render will automatically restart the server to apply the new security rules.

**Congratulations! Your full-stack application is now live on the internet.**
