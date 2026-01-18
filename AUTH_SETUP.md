# JobAZ Authentication & Routing Setup Guide

This document describes the authentication and routing implementation for JobAZ using Next.js App Router and Supabase.

## Overview

The authentication system uses:
- **Next.js Middleware** for route protection
- **Supabase Auth** for user authentication
- **@supabase/ssr** for server-side rendering support

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL (for email redirects)
# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production (update with your production URL)
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Required for Account Deletion: Service Role Key (for admin operations only)
# This is required for the "Delete Account" feature to work.
# NEVER expose this key to the client - it should only be used in API routes.
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (for account deletion feature)

⚠️ **Important:** The service role key has admin privileges and should NEVER be exposed to client-side code. Only use it in API routes (`app/api/**`).

## Supabase Dashboard Configuration

### 1. URL Configuration

Go to **Authentication** → **URL Configuration** in your Supabase Dashboard:

**Site URL:**
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

**Redirect URLs** (add all of these):
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 2. Email Templates

Go to **Authentication** → **Email Templates** in your Supabase Dashboard:

#### Confirm signup
- **Subject:** `Confirm your JobAZ account`
- **Body:** Update the template to mention JobAZ:
  ```
  Welcome to JobAZ!
  
  Click the link below to confirm your account:
  {{ .ConfirmationURL }}
  
  If you didn't create an account, you can safely ignore this email.
  
  - The JobAZ Team
  ```

#### Reset password
- **Subject:** `Reset your JobAZ password`
- **Body:** Update the template to mention JobAZ:
  ```
  You requested a password reset for your JobAZ account.
  
  Click the link below to reset your password:
  {{ .ConfirmationURL }}
  
  If you didn't request this, you can safely ignore this email.
  
  - The JobAZ Team
  ```

#### Magic Link (if using)
- **Subject:** `Sign in to JobAZ`
- **Body:** Update to mention JobAZ

### 3. Email Confirmation Settings

Go to **Authentication** → **Providers** → **Email**:

- **Enable email confirmations:** Toggle based on your preference
  - If **enabled**: Users must confirm email before logging in
  - If **disabled**: Users are logged in immediately after signup

## Route Protection

### Public Routes (No Authentication Required)
- `/` - Landing page
- `/auth` - Authentication page
- `/auth/callback` - Email confirmation and password reset handler
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### Protected Routes (Authentication Required)
All other routes require authentication. If a user is not logged in, they are redirected to `/` (landing page).

### Special Redirects
- If user is logged in and tries to access `/auth`, they are redirected to `/dashboard`
- If user is not logged in and tries to access a protected route, they are redirected to `/`

## Authentication Features

### Sign Up
- Creates user with email + password
- Stores `full_name` in user metadata
- Uses `/auth/callback` as redirect URL
- Handles email confirmation:
  - If confirmation required → Shows "Check your email" message with "Resend" button, doesn't log in
  - If confirmation not required → Auto redirects to dashboard

### Email Confirmation (`/auth/callback`)
- Handles email confirmation tokens from signup
- Exchanges code for session using `exchangeCodeForSession`
- Redirects to dashboard on success
- Shows friendly error messages with "Resend confirmation" button on failure

### Log In
- Validates credentials
- Shows friendly error messages ("Invalid email or password")
- Handles unconfirmed emails with "Resend confirmation" button
- Clears stale sessions on page load

### Forgot Password
- Accessible from login form ("Forgot password?" link)
- Sends password reset email with redirect to `/auth/callback`
- Uses secure reset flow with token validation

### Password Reset (`/auth/callback`)
- Handles password reset tokens from email
- Validates reset token
- Allows user to set new password with confirmation
- Redirects to dashboard after successful reset

## User Display

The dashboard header displays:
- **Name**: `full_name` from user metadata, or email prefix if not available
- **Email**: User's email address

This information is fetched from `supabase.auth.getUser()` and updates automatically on login/logout.

## Implementation Details

### Middleware (`middleware.ts`)
- Runs on every request
- Checks Supabase session from cookies
- Redirects based on authentication status
- Uses `@supabase/ssr` for cookie handling

### Supabase Clients
- **`lib/supabase.ts`**: Client-side client for browser components (use in 'use client' components)
- **`lib/supabase-server.ts`**: Server component client for SSR (use in Server Components only)
- **`createServerSupabaseClient()`**: Service role client for admin operations (API routes only)

### Auth Page (`app/auth/page.tsx`)
- Handles signup, login, and forgot password flows
- Clears stale sessions on mount
- Clears stale state when switching tabs
- Shows appropriate messages for each state
- Uses `/auth/callback` for email confirmation redirects

### Auth Callback Page (`app/auth/callback/page.tsx`)
- Handles email confirmation tokens from signup
- Handles password reset tokens from forgot password
- Exchanges code for session using `exchangeCodeForSession`
- Shows password reset form when recovery token is detected
- Redirects to dashboard on success
- Shows friendly error messages with "Resend confirmation" button on failure

### Dashboard (`app/dashboard/page.tsx`)
- Fetches user info from Supabase auth
- Displays user name and email in header
- Updates automatically on auth state changes

## Troubleshooting

### Users not being redirected
- Check that middleware is running (check server logs)
- Verify Supabase environment variables are set
- Ensure cookies are being set correctly

### Email confirmation not working
- Verify redirect URLs in Supabase Dashboard
- Check `NEXT_PUBLIC_SITE_URL` is set correctly
- Ensure email templates are configured

### Session not persisting
- Verify `@supabase/ssr` is installed
- Check that middleware is properly handling cookies
- Ensure no mixed client/server Supabase client usage

### "New email signup logs in as old user"
- Ensure `supabase.auth.signOut()` is called on logout
- Clear browser cookies if testing
- Check that session cookies are being properly cleared

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Always use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client components
- Use middleware for route protection, not just client-side checks
- Validate all user inputs on the server side

