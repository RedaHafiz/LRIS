# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables (create .env.local)
# Required variables:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Application
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database Setup
Database migrations must be run manually in Supabase SQL Editor:
1. Navigate to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_row_level_security.sql`

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Security**: Row Level Security (RLS) policies enforce data access

### Core Architecture Patterns

#### Supabase Client Instantiation
The application uses three different Supabase client patterns depending on context:
- **Client Components**: Use `@/lib/supabase/client.ts` (`createBrowserClient`)
- **Server Components**: Use `@/lib/supabase/server.ts` (`createServerClient` with cookies)
- **Middleware**: Use `@/lib/supabase/middleware.ts` for session management and auth protection

#### Authentication Flow
- Middleware (`middleware.ts`) handles automatic redirects:
  - Unauthenticated users accessing protected routes → `/login`
  - Authenticated users accessing auth pages → `/dashboard`
- Protected routes are under `/dashboard/*`
- Auth routes: `/login`, `/signup`, `/reset-password`

#### Database Schema & Domain Model
The platform revolves around **Projects** (working sets) containing **Assessments**:

**Core Tables**:
- `profiles`: Extended user profiles (synced with auth.users via trigger)
- `projects`: Top-level organizational units
- `project_users`: Project membership with roles (working_set_admin, edit_assessments, comment_only)
- `assessments`: Threat assessments with 8-stage workflow
- `assessment_assignments`: Multiple user assignments per assessment
- `taxa`: Taxonomic classification data (kingdom, phylum, class)
- `assessment_taxa`: Many-to-many relationship between assessments and taxa
- `notifications`: User notifications for assignments and updates

**Assessment Status Workflow** (8 stages):
1. `not_started` → 2. `in_progress` → 3. `to_review` → 4. `to_submit` → 5. `returned_with_comments` → 6. `submitted` → 7. `to_publish` → 8. `published`

**Permission Model**:
- RLS policies enforce data access at the database level
- Project roles control assessment CRUD operations:
  - `working_set_admin`: Full project and assessment permissions
  - `edit_assessments`: Can create/edit assessments
  - `comment_only`: Read-only access
- Users can only access projects they're members of (enforced by RLS)

### File Structure
```
app/
├── dashboard/              # Protected routes (requires auth)
│   ├── assessments/        # Assessment workflow page
│   ├── projects/[id]/      # Dynamic project detail pages
│   ├── layout.tsx          # Dashboard layout with nav + header
│   └── page.tsx            # Projects list (dashboard home)
├── login/                  # Authentication pages
├── signup/
└── layout.tsx              # Root layout

components/
├── assessments/            # Assessment UI components
│   ├── AssessmentRow.tsx   # Individual assessment row
│   ├── AssessmentStatusSection.tsx  # Collapsible status group
│   └── AssessmentsView.tsx # Main view with filtering/grouping
├── dashboard/              # Dashboard shell components
│   ├── DashboardHeader.tsx # Top header with user info
│   └── DashboardNav.tsx    # Sidebar navigation
└── projects/               # Project management components
    ├── CreateProjectButton.tsx
    └── CreateProjectModal.tsx

lib/
├── supabase/               # Supabase client utilities
│   ├── client.ts           # Browser client (client components)
│   ├── server.ts           # Server client (server components)
│   └── middleware.ts       # Middleware client + auth logic
└── types/
    └── database.types.ts   # TypeScript types for database schema

supabase/
└── migrations/             # SQL migrations (run manually in Supabase)
    ├── 001_initial_schema.sql
    └── 002_row_level_security.sql
```

### Key Implementation Details

#### Type Safety
- TypeScript database types in `lib/types/database.types.ts` provide full type safety for Supabase queries
- Use the `Database` interface for typed Supabase client operations
- `AssessmentStatus` and `UserRole` are exported as type unions

#### Path Aliases
- `@/*` resolves to project root (configured in `tsconfig.json`)
- Always use path aliases for imports: `@/lib/supabase/client` not `../../lib/supabase/client`

#### Data Fetching Patterns
- Server Components fetch data directly using `await createClient()` from `@/lib/supabase/server`
- Use `.select()` with joins to fetch related data (e.g., `project_users!inner(role)`)
- Client Components use `createClient()` from `@/lib/supabase/client` for mutations and real-time updates

#### Component Patterns
- Server Components for data fetching (pages, layouts)
- Client Components (use `'use client'`) for:
  - Interactive UI (forms, dropdowns, modals)
  - State management (useState, useMemo)
  - Real-time updates
- Pass fetched data from Server Components to Client Components as props

## Development Guidelines

### Adding New Features

#### Creating New Database Tables
1. Add SQL migration to `supabase/migrations/` with incremental naming
2. Add RLS policies in the same or separate migration
3. Update `lib/types/database.types.ts` with TypeScript types
4. Run migration manually in Supabase SQL Editor

#### Adding New Routes
- Protected routes go under `app/dashboard/`
- Auth is automatically enforced by middleware
- Create `layout.tsx` for shared layouts, `page.tsx` for pages
- Use dynamic routes with `[param]` folders (e.g., `projects/[id]/page.tsx`)

#### Working with Assessments
- Assessment filtering/grouping logic is in `AssessmentsView.tsx` (client component)
- Status configuration and colors are defined in `statusConfig` object
- Always include related profile data when fetching assessments with assignees

### Common Patterns

#### Querying with Joins
```typescript
const { data } = await supabase
  .from('assessments')
  .select(`
    *,
    profiles:assignee_id (first_name, last_name),
    projects!inner (name)
  `)
  .eq('project_id', projectId)
```

#### Checking User Permissions
Always rely on RLS policies. The database will enforce permissions automatically. No need to check roles in application code for data access - attempt the operation and handle errors.

#### Creating New Assessments
Must include `project_id` and `created_by`. User must have `edit_assessments` or `working_set_admin` role in the project (enforced by RLS).

### Supabase Configuration Notes
- **Authentication**: Email/password provider must be enabled in Supabase Auth settings
- **Site URL**: Set to `http://localhost:3000` for development
- **Redirect URLs**: Must include dashboard URLs (e.g., `http://localhost:3000/dashboard`)
- **RLS**: All tables have RLS enabled - do not disable

### Deployment
- Build command: `npm run build`
- Environment variables must be set in deployment platform
- Update Supabase redirect URLs to include production domain
- Compatible with: Vercel, AWS Amplify, Netlify, Railway, Digital Ocean
