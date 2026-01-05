# Threat Assessment Platform

A comprehensive full-stack platform for managing threat assessments with collaborative workflows, user management, and real-time updates. Built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

- 🔐 **Secure Authentication**: Email/password authentication with Supabase Auth
- 👥 **User Management**: Create projects (working sets) and assign users with role-based permissions
- 📋 **Assessment Workflow**: Track assessments through 8 status stages from "Not Started" to "Published"
- 🔍 **Advanced Filtering**: Search and filter assessments by status, assignee, type, and more
- 🎯 **User Assignment**: Assign team members to specific assessments with notifications
- 📊 **Progress Tracking**: Visual progress indicators for assessment completion
- 🔔 **Notifications**: Real-time notifications for assignments and project updates
- 🏗️ **Project Organization**: Organize assessments into projects with team collaboration
- 🔒 **Row Level Security**: Database-level security policies for data protection

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Git

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run both migration files:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`
3. Go to **Settings** → **API** and copy your credentials

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup

### Running Migrations

1. Go to Supabase Dashboard → **SQL Editor**
2. Create new query
3. Paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Repeat for `002_row_level_security.sql`

### Authentication Configuration

1. In Supabase: **Authentication** → **Settings**
2. Enable **Email** provider
3. Set **Site URL**: `http://localhost:3000`
4. Add **Redirect URLs**:
   - `http://localhost:3000/dashboard`
   - `https://your-domain.com/dashboard` (for production)

## Project Structure

```
threat-assessment-platform/
├── app/
│   ├── dashboard/           # Protected routes
│   │   ├── assessments/    # Assessment workflow
│   │   └── projects/       # Project management
│   ├── login/              # Auth pages
│   └── signup/
├── components/
│   ├── assessments/        # Assessment components
│   ├── dashboard/          # Layout components
│   └── projects/           # Project components
├── lib/
│   ├── supabase/          # Supabase clients
│   └── types/             # TypeScript types
└── supabase/
    └── migrations/        # SQL migrations
```

## Key Features

### Creating Projects

1. Click "Create Project"
2. Fill in project details
3. Add team members with roles:
   - **Working set admin**: Full permissions
   - **Edit assessments**: Create/edit assessments
   - **Comment only**: Read-only access

### Managing Assessments

- Filter by status, assignee, or type
- Assign users with dropdown
- Track progress with visual indicators
- Move through workflow stages

### Assessment Workflow

1. Not Started → 2. In Progress → 3. To Review → 4. To Submit → 5. Returned with Comments → 6. Submitted → 7. To Publish → 8. Published

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Update Supabase redirect URLs
5. Deploy!

### Other Platforms

Works on: AWS Amplify, Netlify, Railway, Digital Ocean

**Build command**: `npm run build`

**Start command**: `npm start`

## Troubleshooting

### Auth Issues
- Verify `.env.local` credentials
- Check Supabase redirect URLs
- Clear browser cookies

### Database Errors
- Run all migrations
- Check RLS policies are enabled
- Verify user has project access

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Row Level Security

## License

MIT License

---

Built with ❤️ using Next.js and Supabase
