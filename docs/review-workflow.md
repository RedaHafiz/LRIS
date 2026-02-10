# Review Workflow System

## Overview
The threat assessment platform includes a complete review workflow that allows assessors to create assessments, submit them for review, receive feedback from reviewers, and make revisions based on that feedback.

## Workflow Stages

### 1. Assessment Creation (Draft)
- Assessor creates a new threat assessment using the wizard
- At Step 6 (Submit), the assessor can choose:
  - **Save as Draft**: Status = `draft` (not sent to reviewer)
  - **Submit for Review**: Status = `pending_review` (sent to reviewer)
- When saved, the assessment is assigned to:
  - Assessor (current user)
  - Optional Co-assessor
  - Required Reviewer

### 2. Review Process
- Reviewer sees assessments with status `pending_review` in their dashboard
- Reviewer can click the **Review** button (purple) to open the review page
- Review page displays:
  - Full assessment details (read-only)
  - All existing comments in chronological order
  - Comment input field for adding new feedback
  - Two action buttons:
    - **Approve Assessment**: Marks assessment as `approved`, sets `reviewed_at` timestamp, notifies assessor/co-assessor
    - **Return for Revisions**: Changes status to `returned`, notifies assessor/co-assessor

### 3. Revisions (Returned)
- When assessment is returned, assessor/co-assessor receives notification
- They can click **Edit** button to re-open the assessment in the wizard
- At Step 6, they will see:
  - Yellow box with all reviewer comments
  - Option to "Submit for Review" checkbox
- When they resubmit with "Submit for Review" checked:
  - Status changes back to `pending_review`
  - Reviewer receives notification to review again
  - Previous comments remain visible

### 4. Approval (Final)
- Once reviewer approves:
  - Status = `approved`
  - `reviewed_at` timestamp is set
  - `reviewed_by` is set to reviewer's user ID
  - Assessor/co-assessor receive approval notification
  - Assessment is locked (no further edits in normal workflow)

## Status Values
- `draft`: Assessment created but not submitted for review
- `pending_review`: Assessment submitted and waiting for reviewer action
- `returned`: Assessment returned to assessor for revisions
- `approved`: Assessment approved by reviewer (final state)

## User Roles
Each assessment has three types of assignments:

### Assessor
- Creates the assessment
- Automatically assigned to current user
- Can edit and delete their assessments
- Receives notifications when assessment is returned or approved

### Co-assessor (Optional)
- Can edit the assessment alongside the assessor
- Receives same notifications as assessor
- Must be different from the assessor

### Reviewer (Required)
- Reviews assessments in `pending_review` status
- Can add comments
- Can approve or return assessments
- Cannot edit the assessment content directly

## Notifications
The system sends notifications for:
- Assignment as reviewer → "You have been assigned as a reviewer..."
- Assignment as co-assessor → "You have been assigned as a co-assessor..."
- Assessment returned → "Your threat assessment has been returned for revisions..."
- Assessment approved → "Your threat assessment has been approved!"

Notifications are:
- Stored in the `notifications` table
- Displayed in the user's dashboard (if notification UI is implemented)
- Optionally sent via email (if email notification API is functional)

## Comments
- Stored in `assessment_comments` table
- Fields: `id`, `assessment_id`, `user_id`, `comment`, `created_at`
- Comments are displayed:
  - In the review page for reviewers
  - In Step 6 of the wizard for assessors (when status = `returned`)
- Comments persist across multiple review cycles

## Database Schema

### Threat Assessments Table
- `status` column: VARCHAR enum ('draft', 'pending_review', 'returned', 'approved')
- `reviewed_at`: TIMESTAMP (when approved)
- `reviewed_by`: UUID (reviewer user ID)

### assessment_assignments Table
- `id`: UUID
- `assessment_id`: VARCHAR (FK to Threat Assessments)
- `user_id`: UUID (FK to profiles)
- `role`: VARCHAR ('assessor', 'co-assessor', 'reviewer')
- `assigned_at`: TIMESTAMP

### assessment_comments Table
- `id`: UUID
- `assessment_id`: VARCHAR (FK to Threat Assessments)
- `user_id`: UUID (FK to profiles)
- `comment`: TEXT
- `created_at`: TIMESTAMP

## UI Components

### AssessmentReviewView Component
Location: `components/assessments/AssessmentReviewView.tsx`

Features:
- Displays assessment details in a read-only grid
- Shows all comments with author and timestamp
- Comment input with "Add Comment" button
- "Approve Assessment" button (green) - requires no comments
- "Return for Revisions" button (yellow) - requires at least one comment
- Error handling for all actions
- Real-time updates using router.refresh()

### ThreatAssessmentWizard Component
Location: `components/assessments/ThreatAssessmentWizard.tsx`

Review-related features:
- `existingComments` prop to pass comments
- `submitForReview` state to control submission status
- Step 6 displays:
  - Comments box (yellow) when status = 'returned'
  - "Submit for Review" checkbox
  - Dynamic button text: "Save as Draft" or "Submit for Review"

### LandraceAssessmentsView Component
Location: `components/assessments/LandraceAssessmentsView.tsx`

Features:
- Status column with color-coded badges
- Comments count column
- Role-based action buttons:
  - Reviewers: "Review" (purple)
  - Assessors/Co-assessors: "Edit" and "Delete"

## Pages

### Review Page
Path: `/dashboard/assessments/review/[id]`
- Server-side authentication check
- Verifies user is assigned as reviewer
- Fetches assessment, comments, and assignments
- Renders AssessmentReviewView component

### Edit Page
Path: `/dashboard/assessments/edit/[id]`
- Server-side authentication check
- Fetches assessment, comments, assignments, and taxa
- Passes data to ThreatAssessmentWizard in edit mode

### Assessments List Page
Path: `/dashboard/assessments`
- Fetches all assessments
- Enriches with user role and comment counts
- Renders LandraceAssessmentsView with role-based UI

## Testing Checklist
- [ ] Create new assessment and save as draft (status = draft)
- [ ] Create new assessment and submit for review (status = pending_review)
- [ ] Reviewer can see pending assessments
- [ ] Reviewer can add comments
- [ ] Reviewer can return assessment (status = returned, assessor notified)
- [ ] Assessor sees comments when editing returned assessment
- [ ] Assessor can resubmit after making changes
- [ ] Reviewer can approve assessment (status = approved, assessor notified)
- [ ] Approved assessments are marked correctly
- [ ] Comment count displays correctly in table
- [ ] Status badges display with correct colors
- [ ] Role-based buttons show correctly (Review vs Edit/Delete)
