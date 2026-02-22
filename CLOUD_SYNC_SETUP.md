# CyberSched Cloud Sync Setup Guide

Cloud Sync is now integrated into CyberSched! Follow these steps to enable it:

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/
2. Click "Sign Up" or "Log In"
3. Click "New Project"
4. Fill in the form:
   - **Project Name**: `cybersched`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is perfect for personal use
5. Click "Create new project" and wait (2-3 minutes)

## Step 2: Create the Database Table

Once your project is created:

1. Go to **SQL Editor** in the left menu
2. Click **"New Query"**
3. Paste this SQL:

```sql
-- Create backups table
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tasks JSONB NOT NULL,
  habits JSONB NOT NULL,
  settings JSONB NOT NULL,
  quit_date TEXT NOT NULL DEFAULT '',
  device_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_backups_user_id ON backups(user_id);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own backups
CREATE POLICY "Users can see their own backups"
ON backups
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy: Users can insert their own backups
CREATE POLICY "Users can insert their own backups"
ON backups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own backups
CREATE POLICY "Users can delete their own backups"
ON backups
FOR DELETE
USING (auth.uid() = user_id);
```

4. Click **"RUN"** and check for "Success" message

## Step 3: Get Your API Keys

1. Go to **Settings** → **API** in the left menu
2. Look for **Project URL** and **Anon Key** under "Project API keys"
3. Copy both values

## Step 4: Update Environment Variables

Open your `.env.local` file and replace:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

With your actual values from Step 3.

### Example:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Restart Your App

1. Stop your dev server (Ctrl+C)
2. Run again:
   ```bash
   npm run dev
   ```

## Step 6: Enable Cloud Sync in the App

1. Go to **Settings** (⚙️ icon in sidebar)
2. Scroll down to **☁️ Cloud Sync** section
3. Click **"CREATE ACCOUNT"**
4. Enter your email and password (create a Supabase account)
5. Click **"CREATE ACCOUNT"**
6. You should see:
   - ✓ Authentication badge with your email
   - **☁️ SYNC NOW** button
   - **✓ AUTO-SYNC ON** toggle
   - **📋 BACKUPS** history button
   - **SIGN OUT** button

## Features You Now Have

### Manual Sync

Click **"☁️ SYNC NOW"** anytime to backup all your data to the cloud.

### Auto-Sync

Toggle **"✓ AUTO-SYNC ON"** to automatically backup your data 5 seconds after any change.

### Backup History

Click **"📋 BACKUPS"** to see all previous backups:

- **RESTORE** — Load data from an old backup
- **DELETE** — Remove a backup

## Multi-Device Sync

To use the same account on another device:

1. Install CyberSched on the other device
2. Add the same Supabase credentials to `.env.local`
3. Go to Settings → Cloud Sync
4. **Sign In** with the same email/password
5. Click **"☁️ SYNC NOW"** to pull latest backup
6. Enable **✓ AUTO-SYNC ON** to keep both devices in sync

## Troubleshooting

### "No API key found"

→ Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is in `.env.local`

### "Authentication failed"

→ Make sure you created a Supabase account with that email/password

### "Sync failed: Connection error"

→ Check internet connection and verify API keys in `.env.local`

### "RLS policy violation"

→ Re-run the SQL from Step 2, ensuring all policies are created

## Data Privacy

- ✅ Only you can see your backups (RLS policies enforce this)
- ✅ Data is stored in Supabase's secure database
- ✅ You can delete backups anytime
- ✅ You control your API keys

---

**Questions?** Check your browser console (F12 → Console) for detailed error messages.
