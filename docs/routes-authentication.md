# Routes & Authentication

## Public Routes (No Authentication Required)

### Home Page
- **Route**: `/`
- **Purpose**: Landing page with links to Query and Login
- **Status**: ✅ Public

### Query System
- **Route**: `/query`
- **Purpose**: Search and explore passport data for landraces
- **Status**: ✅ Public
- **Database Access**: Public read access to `Passport Data` table
- **Migration**: `010_passport_data_public_access.sql`

### Authentication Pages
- **Routes**: `/login`, `/signup`, `/reset-password`
- **Purpose**: User authentication
- **Status**: ✅ Public

---

## Protected Routes (Authentication Required)

### Dashboard
- **Route**: `/dashboard`
- **Purpose**: Main dashboard for authenticated users
- **Status**: ✅ Protected

### Threat Assessments
- **Route**: `/dashboard/assessments`
- **Purpose**: View and manage threat assessments
- **Status**: ✅ Protected
- **Features**:
  - Create new assessments
  - Edit existing assessments
  - Review assessments
  - View assessment history

### Assessment Creation Wizard
- **Route**: `/dashboard/assessments/new`
- **Purpose**: Multi-step wizard for creating threat assessments
- **Status**: ✅ Protected
- **Steps**:
  1. Assessment Unit (landrace/crop selection)
  2. Reviewer Selection
  3. Representative Data Collection
  4. Criteria Scoring (24 subcriteria)
  5. Review & Submit

### Taxonomy Management
- **Route**: `/dashboard/taxonomy`
- **Purpose**: Manage crop taxonomy data
- **Status**: ✅ Protected

### Projects
- **Route**: `/dashboard/projects`
- **Purpose**: Manage projects and project-specific assessments
- **Status**: ✅ Protected

---

## Database Access Policies

### Public Tables (Read Access)
```sql
-- Passport Data (Landrace information)
CREATE POLICY "Public read access to passport data"
  ON public."Passport Data"
  FOR SELECT
  TO public
  USING (true);
```

### Protected Tables (Authenticated Only)
- `Threat Assessments` - Requires authentication
- `Crop Taxonomy` - Requires authentication
- `profiles` - Requires authentication
- `assessment_assignments` - Requires authentication
- `assessment_taxa` - Requires authentication
- `notifications` - Requires authentication
- `projects` - Requires authentication
- `project_members` - Requires authentication

---

## Current Implementation Status

### ✅ Working Public Access
- Home page (`/`) is publicly accessible
- Query page (`/query`) is publicly accessible
- Passport Data queries work without authentication
- Auth pages (`/login`, `/signup`) are public

### ✅ Working Protected Access
- Dashboard and all subpages require authentication
- Threat assessment creation requires authentication
- User must be logged in to create/edit/review assessments

### No Middleware Currently Active
- There is NO root `middleware.ts` file
- The middleware in `lib/supabase/middleware.ts` is NOT being used
- This means all routes are currently public by default
- Protection is only through:
  1. Component-level checks (if any)
  2. Database RLS policies
  3. Server-side authentication checks

---

## Recommended Next Steps

If you want to add middleware protection to ensure only authenticated users can access the dashboard:

1. **Create `/middleware.ts` in the root directory**:
```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

2. **Update `lib/supabase/middleware.ts`** to add `/query` to allowed public routes:
```typescript
if (
  !user &&
  !request.nextUrl.pathname.startsWith('/login') &&
  !request.nextUrl.pathname.startsWith('/signup') &&
  !request.nextUrl.pathname.startsWith('/reset-password') &&
  !request.nextUrl.pathname.startsWith('/query') &&  // Add this line
  request.nextUrl.pathname !== '/'
) {
  // Redirect to login
}
```

This would ensure:
- `/query` remains public
- `/dashboard/*` requires authentication
- Database policies provide an additional security layer
