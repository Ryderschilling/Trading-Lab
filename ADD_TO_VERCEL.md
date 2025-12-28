# 🔐 Add Clerk Keys to Vercel - Simple Steps

## Step 1: Go to Your Vercel Project
1. Go to: **https://vercel.com**
2. Sign in if needed
3. Find your **"Trading-Lab"** project
4. Click on it

---

## Step 2: Go to Settings
1. Look at the top menu/tabs
2. Click on **"Settings"**

---

## Step 3: Go to Environment Variables
1. On the left sidebar, look for **"Environment Variables"**
2. Click on it

---

## Step 4: Add Your First Key
1. You'll see a form with fields:
   - **Key:** (this is the name)
   - **Value:** (this is your actual key)
   - **Environment:** (leave as "Production, Preview, Development")

2. **Add Publishable Key:**
   - In **Key** field, type: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - In **Value** field, paste your Publishable Key (starts with `pk_test_...`)
   - Click **"Save"**

---

## Step 5: Add Your Second Key
1. Click **"Add New"** or the **"+"** button
2. **Add Secret Key:**
   - In **Key** field, type: `CLERK_SECRET_KEY`
   - In **Value** field, paste your Secret Key (starts with `sk_test_...`)
   - Click **"Save"**

---

## Step 6: Redeploy
1. Go back to your project (click the project name at top)
2. Go to **"Deployments"** tab
3. Click the **"..."** (three dots) on the latest deployment
4. Click **"Redeploy"**
5. Click **"Redeploy"** again to confirm

OR it will automatically redeploy when you push new code!

---

## ✅ That's It!

Your app should now work! After redeploy, visit your site and it should load properly.

