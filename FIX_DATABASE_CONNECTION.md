# How to Fix Database Connection Issue

## Problem

The website `youssef.ymoo.site` is showing an error:
```
getaddrinfo ENOTFOUND
db.cqrdffcvmoxwzjrsymvm.supabase.co
```

This error indicates that the application cannot connect to the Supabase database.

## Solution

### Step 1: Check Supabase Database Status

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `cqrdffcvmoxwzjrsymvm`
3. Check if the database is **Active** (not Stopped)
4. If it's stopped, click **Start** to activate it

### Step 2: Verify Database Connection String

The correct connection string format is:
```
postgresql://postgres:2411@db.cqrdffcvmoxwzjrsymvm.supabase.co:5432/postgres
```

Make sure:
- Username is `postgres`
- Password is `2411`
- Host is `db.cqrdffcvmoxwzjrsymvm.supabase.co`
- Port is `5432`
- Database name is `postgres`

### Step 3: Check Network Settings

1. Go to **Settings > Database > Connection Pooling**
2. Ensure connection pooling is enabled
3. Check firewall rules if you have any custom rules

### Step 4: Test Connection Locally

1. Update `.env` file with correct credentials
2. Run the app locally: `pnpm dev`
3. Check browser console and server logs for any errors

### Step 5: Re-deploy to Vercel

1. After fixing `.env`, commit and push changes to GitHub
2. Redeploy to Vercel
3. Update environment variables in Vercel dashboard if needed

## What Was Fixed in This Update

1. **Updated DATABASE_URL** with correct password (2411 instead of [2411])
2. **Increased connection timeout** from 2 seconds to 10 seconds
3. **Added detailed logging** to help diagnose connection issues
4. **Improved error handling** with better error messages

## How to Check if It's Working

1. Visit the website: https://youssef.ymoo.site
2. Open browser console (F12)
3. Check if there are any database connection errors
4. Try to sign in with Google
5. Check if the admin panel shows "DB Connected" status

## Additional Troubleshooting

If the problem persists:

1. **Check Vercel Environment Variables**
   - Go to Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Verify `DATABASE_URL` is set correctly

2. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - Select your project
   - Go to Logs section
   - Check for any connection errors

3. **Test Database Connection Manually**
   - Use a PostgreSQL client like pgAdmin or DBeaver
   - Try to connect using the same credentials
   - If it fails, the issue is with Supabase configuration

## Contact Support

If you need further assistance:
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support
