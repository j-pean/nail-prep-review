# Nail Prep Review — Setup Guide

Everything is built. Follow these steps in order and you'll be live in about 30 minutes.

---

## Step 1 — Supabase (database + video storage)

1. Go to **supabase.com** and create a free account
2. Click "New Project" — name it `nail-prep-review`
3. Go to **SQL Editor** and paste the contents of `supabase-schema.sql` → click Run
4. Go to **Storage** → click "New bucket" → name it `videos` → check "Public bucket" → Save
5. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Resend (email notifications)

1. Go to **resend.com** and create a free account
2. Go to **API Keys** → create a key → copy it → `RESEND_API_KEY`
3. In Resend, go to **Domains** → add your domain (or use their free onboarding.resend.dev for testing)
4. Update the `from:` address in `pages/api/notify.js` and `pages/api/feedback.js` to match your domain

---

## Step 3 — Twilio (SMS alerts)

1. Go to **twilio.com** → create a free account (they give you a free trial number)
2. From the Console dashboard copy:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
3. Go to **Phone Numbers → Manage → Active Numbers** → copy your Twilio number → `TWILIO_PHONE_NUMBER`

---

## Step 4 — Deploy to Vercel

1. Go to **vercel.com** → create a free account
2. Click "Add New Project" → "Import Git Repository"
3. Push this repo to GitHub (`git init` / `git add` / `git commit` / `git push` as needed).
4. Import the repo in Vercel. Leave **Root Directory** empty (the Next.js app is at the repository root).
5. In Vercel project settings → **Environment Variables** → add all of these:

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_SUPABASE_URL | from Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | from Supabase |
| SUPABASE_SERVICE_ROLE_KEY | from Supabase |
| RESEND_API_KEY | from Resend |
| TWILIO_ACCOUNT_SID | from Twilio |
| TWILIO_AUTH_TOKEN | from Twilio |
| TWILIO_PHONE_NUMBER | your Twilio number |
| YOUR_EMAIL | your email |
| YOUR_PHONE | your phone (+1xxxxxxxxxx) |
| NEXT_PUBLIC_REVIEW_PASSWORD | a password you choose |
| NEXT_PUBLIC_SITE_URL | your Vercel URL (e.g. https://nail-prep-review.vercel.app) |

6. Click **Deploy**

---

## Your URLs

| Page | URL |
|------|-----|
| Submission page (send this out) | `https://your-project.vercel.app` |
| Your private review dashboard | `https://your-project.vercel.app/review` |

---

## How it works

1. A nail tech fills out the form and uploads their video
2. Supabase stores the video and saves their info to the database
3. You get an email + text notification immediately
4. You go to `/review`, enter your password, and see all submissions
5. You watch the video, click "Add at 0:32" to drop timestamped notes, write overall feedback, set a score
6. Click "Send feedback" — the tech gets a beautiful email with all your notes

---

## Need help?

If you get stuck on any step, take a screenshot of the error and bring it back here.
