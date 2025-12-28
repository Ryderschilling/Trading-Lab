# 🗄️ Setup Database - Fix the Server Error

## The Error You're Seeing
After signing up, you're getting a server error because the database isn't connected yet.

## ✅ Easiest Fix: Use Vercel Postgres

### Step 1: Go to Vercel Dashboard
1. Go to: https://vercel.com
2. Click your **"Trading-Lab"** project

### Step 2: Create Database
1. Click the **"Storage"** tab (in the top menu)
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Name it: `trading-lab-db`
5. Click **"Create"**
6. Wait 1-2 minutes for it to create

### Step 3: Vercel Auto-Adds DATABASE_URL
- Vercel will automatically add the `DATABASE_URL` environment variable
- You don't need to do anything else!

### Step 4: Setup Database Tables
You need to run this command **once** to create the database tables:

**Option A - In Vercel (Easier):**
1. Go to your project in Vercel
2. Go to **"Settings"** → **"Functions"**
3. Or use Vercel CLI: `vercel exec -- npm run db:push`

**Option B - Run Locally:**
1. In your project folder, run:
   ```bash
   npx prisma db push
   ```

### Step 5: Redeploy
1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

---

## ✅ That's It!

After setting up the database and redeploying, your app should work!

The error happens because when you sign up, the app tries to save your user info to the database, but there's no database connected yet. Once you add Vercel Postgres, it will work!

