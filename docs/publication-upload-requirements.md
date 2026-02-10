# Publication Upload Requirements

## Overview
The publication upload form has been simplified to focus on device uploads with mandatory DOI validation to prevent duplicate entries.

## Changes Made

### 1. Mandatory File Upload
- File upload is now **required** (marked with asterisk *)
- Previously optional, now users must upload a file from their device
- Accepted formats: PDF, DOC, DOCX (Max 10MB)
- Form validation prevents submission without a file

### 2. Mandatory DOI Field
- DOI field is now **required** (marked with asterisk *)
- Previously optional, now must be provided for all publications
- Format: Standard DOI format (e.g., `10.1234/example`)

### 3. DOI Duplicate Check
- **Automatic validation**: When submitting, the system checks if the DOI already exists
- **Modal popup**: If duplicate found, displays:
  - Red warning header: "Duplicate DOI Found"
  - DOI number
  - Existing publication details (title, authors, year)
  - Informative message about avoiding duplicates
  - OK button to dismiss and return to form
- **Prevents submission**: Form won't submit if duplicate DOI detected
- **Loading indicator**: Shows spinner while checking DOI

### 4. Removed External URL Field
- External URL field has been removed
- Focus is now on device uploads only
- The `url` field in the database is set to `null` for new entries

## Form Fields

### Required Fields
1. **Upload Publication File** *
   - Device upload only
   - PDF, DOC, or DOCX format
   - Maximum 10MB file size

2. **Title** *
   - Publication title

3. **Authors** *
   - Author names (comma-separated)

4. **DOI** *
   - Digital Object Identifier
   - Checked for duplicates before submission

### Optional Fields
1. **Journal / Conference**
   - Publication venue name

2. **Year**
   - Publication year (1900-2100)

3. **Abstract**
   - Publication abstract or summary (multiline text)

4. **Link to Profile**
   - Checkbox to associate publication with user profile
   - Default: checked

## Validation Flow

```
1. User fills form and uploads file
2. User enters DOI (required)
3. User clicks "Add Publication"
4. System validates:
   ├─ Title present? ─→ No ─→ Show error
   ├─ Authors present? ─→ No ─→ Show error
   ├─ DOI present? ─→ No ─→ Show error
   └─ File uploaded? ─→ No ─→ Show error
5. System checks DOI in database
   ├─ Duplicate found? ─→ Yes ─→ Show modal popup ─→ Stop submission
   └─ No duplicate? ─→ Proceed to upload
6. Upload file to storage
7. Insert record to database
8. Redirect to publications list
```

## User Experience

### Normal Flow
1. User navigates to "Add Publication"
2. Uploads file from device (required)
3. Fills in metadata fields including DOI
4. Clicks "Add Publication"
5. System validates and checks for duplicates
6. If no duplicates: Publication added successfully
7. Redirected to publications list

### Duplicate DOI Flow
1. User enters existing DOI
2. Clicks "Add Publication"
3. System detects duplicate
4. Modal appears showing:
   - Warning message
   - Existing publication details
5. User clicks "OK" to dismiss
6. User can:
   - Verify their DOI is correct
   - Check if publication already exists in system
   - Correct the DOI if it was a mistake

## Technical Implementation

### Component: `AddPublicationForm.tsx`
Location: `components/publications/AddPublicationForm.tsx`

**New State Variables:**
- `doiCheckLoading`: Boolean for loading state during DOI check
- `showDuplicateModal`: Boolean to control modal visibility
- `existingPublication`: Object storing duplicate publication data

**New Function:**
```typescript
checkDOI(doi: string): Promise<boolean>
```
- Queries publications table for matching DOI
- Returns true if duplicate exists
- Shows modal with existing publication details
- Prevents form submission if duplicate found

**Modified Validation:**
- Added DOI and file to required field checks
- Calls `checkDOI()` before proceeding with upload
- Returns early if duplicate detected

**UI Changes:**
- File input: Added `required` attribute and asterisk
- DOI input: Added `required` attribute, asterisk, and spinner during check
- Removed URL input field entirely
- Added duplicate modal overlay component

### Database Changes
- No schema changes required
- `url` field set to `null` for new publications
- `doi` field must be unique per requirement

## Error Handling

### File Upload Errors
- File type validation: Only PDF, DOC, DOCX allowed
- File size validation: Max 10MB
- Storage bucket error: Helpful message if bucket not configured

### DOI Validation Errors
- Empty DOI: Form validation prevents submission
- Duplicate DOI: Modal popup with existing publication info
- Database errors: Logged to console, form continues

### Form Validation Errors
- Missing required fields: Error message displayed above form
- Lists all missing requirements

## Testing Checklist
- [ ] Cannot submit without file upload
- [ ] Cannot submit without DOI
- [ ] File type validation works (only PDF, DOC, DOCX)
- [ ] File size validation works (max 10MB)
- [ ] DOI duplicate check triggers on submit
- [ ] Modal appears when duplicate DOI found
- [ ] Modal shows correct publication details
- [ ] Can dismiss modal and edit DOI
- [ ] Loading spinner shows during DOI check
- [ ] Publication uploads successfully with unique DOI
- [ ] URL field is not present in form
- [ ] External URL stored as null in database
