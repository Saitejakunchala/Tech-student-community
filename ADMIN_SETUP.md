# TECH — Admin Setup Guide

This guide explains how to create the first administrator account for TECH after deployment.

## Overview

TECH uses role-based authorization stored in the database `profiles` table. Public signup always creates `role = 'student'`. The admin role must be assigned manually through a secure database operation.

## Step 1: Create a Normal Account

1. Go to the deployed TECH website.
2. Click **Get Started** and sign up with your email, password, college, and branch.
3. Complete the onboarding flow to create your profile.
4. Verify you can log in and access the dashboard.

## Step 2: Assign the Admin Role

Use the Supabase dashboard SQL Editor (or any PostgreSQL client connected to your database) to run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with the email you used to sign up.

**Security note:** This operation requires direct database access (service-role key or Supabase dashboard). It cannot be performed from the frontend. The `profiles` table has RLS policies that prevent users from changing their own role.

## Step 3: Log Into the Admin Dashboard

1. Go to `/admin/login` (e.g., `https://your-domain.com/#/admin/login`).
2. Enter your email and password.
3. The system verifies your role from the database. If `role = 'admin'`, you'll be redirected to `/admin`.
4. If your role is not admin, access will be denied with an error message.

## Step 4: Reset Admin Password

If you forget your admin password:

1. Go to `/reset-password`.
2. Enter your email address.
3. Follow the link sent to your email to reset your password.
4. The admin role is preserved — you don't need to re-assign it.

## Step 5: Create Additional Administrators

To grant admin access to another user:

1. Have the person sign up normally (they'll get `role = 'student'`).
2. Run the SQL command from Step 2 with their email address.
3. They can now log in at `/admin/login`.

## Security Notes

- Admin role checks are enforced by database RLS policies, not just frontend code.
- The `is_admin()` database function checks the `profiles` table for `role = 'admin'` and `is_suspended = false`.
- Admin-only operations (creating/editing/deleting hackathons, verifying achievements, managing reports) are protected by RLS policies that call `is_admin()`.
- Service-role keys are never exposed in frontend code. Only the anon key is used in the browser.
- Passwords are managed by Supabase Auth and are never stored in plaintext.
