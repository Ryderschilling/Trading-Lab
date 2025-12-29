# 🗄️ Setup Neon Database - Step by Step

## Step 1: Get Your Neon Connection String

1. Go to: https://neon.tech
2. Sign in to your account
3. Click on your project/database
4. Go to "Connection Details" or "Connection String"
5. Copy the connection string
   - It should look like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`
   - Or you might see separate fields (host, database, user, password)

---

## Step 2: Add to Vercel

1. Go to: https://vercel.com
2. Click your "Trading-Lab" project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. **Key:** `DATABASE_URL`
6. **Value:** Paste your full Neon connection string
   - Make sure it includes `?sslmode=require` at the end if it's not there
   - Full format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`
7. Check all environments (Production, Preview, Development)
8. Click **"Save"**

---

## Step 3: Create Database Tables

After adding DATABASE_URL, you need to create the tables. Run this locally:

1. **Open Terminal on your Mac**
2. **Navigate to your project:**
   ```bash
   cd "/Users/ryderschilling/AI/Robinhood app"
   ```

3. **Create a .env file with your DATABASE_URL:**
   ```bash
   echo 'DATABASE_URL="your-neon-connection-string-here"' > .env
   ```
   (Replace with your actual Neon connection string)

4. **Run the database setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Wait for it to finish** - it will create all the tables

---

## Step 4: Redeploy on Vercel

1. Go to Vercel → Your Project → **Deployments**
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

---

## ✅ That's It!

After this, your app should work! The database will be connected and all tables will be created.

---

## Common Issues:

**If connection fails:**
- Make sure your connection string includes `?sslmode=require`
- Check that your Neon database allows connections from Vercel IPs
- Verify the password is correct

**If tables don't create:**
- Make sure DATABASE_URL is in your local .env file
- Run `npx prisma generate` first, then `npx prisma db push`

