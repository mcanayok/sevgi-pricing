# Sevgi Pricing - Price Tracker

A price tracking dashboard for monitoring product prices across Trendyol and official brand websites.

## Tech Stack

- **Database & Auth**: Supabase (PostgreSQL)
- **Frontend**: Next.js 14 + shadcn/ui + Tailwind CSS
- **Scraping**: GitHub Actions (scheduled + on-demand)
- **Hosting**: Vercel

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Create your admin user in Authentication → Users
4. Update the user's role to 'admin' (see schema.sql comments)

### 2. Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Add GitHub secrets for the scraper action

## User Roles

| Role | Permissions |
|------|------------|
| Admin | Full access, manage users, trigger scrapes |
| Editor | CRUD products, websites, view everything |
| Viewer | View only, filter and browse |

## Project Structure

```
sevgi-pricing/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities, Supabase client
│   └── types/            # TypeScript types
├── supabase/
│   └── schema.sql        # Database schema
├── .github/
│   └── workflows/        # GitHub Actions for scraping
└── scraper/              # Price scraper scripts
```

