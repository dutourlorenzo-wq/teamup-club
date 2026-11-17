# TEAMUP Club

A secure-ready starter for a club management app.

## What is included

- Clean club dashboard
- Login / registration flow
- Club management pages
- Calendar and team management
- Password reset workflow UI
- Frontend ready for deployment to Vercel / Netlify

## Important security note

This starter removes the hardcoded admin credentials and local-only demo patterns from the original app. It is still a frontend demo until you connect it to a real backend such as Supabase.

For production deployment, connect:
- Supabase Auth for login / register / password reset
- Supabase Postgres for club data
- Supabase Storage for documents
- Vercel for hosting

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy

Recommended:
- Vercel
- or Netlify

Set the build command to:
- `npm run build`

And the publish directory to:
- `dist`

## Environment variables

Copy `.env.example` to `.env.local` and fill in your values once you connect Supabase.

## Not for production yet

This project is a secure-ready starter, not a fully hardened production backend. The database, auth, and file storage must be connected to a real service before public use.
