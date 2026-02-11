# Threat Assessment Workflow Algorithms

## 1. CREATE ASSESSMENT ALGORITHM

**Purpose**: Create a new threat assessment draft

```
ALGORITHM: CreateAssessment
INPUT: userId, assessmentData, reviewerId, coAssessorId (optional), taxaId (optional), submitForReview (boolean)
OUTPUT: draftId or error

BEGIN
  1. Generate next draft ID:
     - Query "Threat Assessments_duplicate" table
     - Find maximum number N in all "DRAFT-N" IDs
     - SET draftId = "DRAFT-(N+1)"
  
  2. Calculate threat scores:
     - CALL CalculateThreatScores(assessmentData)
     - SET threatScores, maxScore, riskPercentage, category
  
  3. Prepare assessment data:
     - SET status = submitForReview ? "pending_review" : "draft"
     - MERGE assessmentData WITH calculated scores
     - SET LR_Threat_Asses_ID = draftId
  
  4. Insert into "Threat Assessments_duplicate" table:
     - INSERT assessment data
     - IF error THEN RETURN error
  
  5. Create assignment for assessor:
     - INSERT INTO assessment_assignments:
       - assessment_id = draftId
       - user_id = userId
       - role = "assessor"
  
  6. IF coAssessorId is provided THEN:
     - INSERT INTO assessment_assignments:
       - assessment_id = draftId
       - user_id = coAssessorId
       - role = "co-assessor"
  
  7. IF reviewerId is provided THEN:
     - INSERT INTO assessment_assignments:
       - assessment_id = draftId
       - user_id = reviewerId
       - role = "reviewer"
     - IF submitForReview THEN:
       - CREATE notification for reviewer
       - SEND email to reviewer
  
  8. IF taxaId is provided THEN:
     - INSERT INTO assessment_taxa:
       - assessment_id = draftId
       - taxa_id = taxaId
  
  9. RETURN success WITH draftId
END
```

## 2. CALCULATE THREAT SCORES ALGORITHM

**Purpose**: Calculate threat score, max score, risk percentage, and category

```
ALGORITHM: CalculateThreatScores
INPUT: formData (contains all 24 subcriteria scores)
OUTPUT: threatScores, maxScore, riskPercentage, category

BEGIN
  1. SET BASE_MAX_SCORE = 120
  2. SET POINTS_PER_CRITERIA = 5
  3. SET totalScore = 0
  4. SET naCount = 0
  
  5. GET all criteria keys that start with "Subcriteria_Scores_"
  
  6. FOR EACH criteriaKey IN criteriaKeys DO:
     - GET value = formData[criteriaKey]
     - IF value == "NA" OR value == "N/A" OR value == "" THEN:
       - INCREMENT naCount
     - ELSE:
       - SET numericValue = parseFloat(value)
       - IF numericValue is valid number THEN:
         - ADD numericValue TO totalScore
  
  7. Calculate adjusted max score:
     - SET maxScore = BASE_MAX_SCORE - (naCount × POINTS_PER_CRITERIA)
  
  8. Calculate risk percentage:
     - IF maxScore > 0 THEN:
       - SET riskPercentage = (totalScore / maxScore) × 100
       - ROUND riskPercentage to 2 decimal places
     - ELSE:
       - SET riskPercentage = 0
  
  9. Determine threat category:
     - CALL GetThreatCategory(riskPercentage)
  
  10. RETURN {
      threat_scores: totalScore,
      threat_max_score: maxScore,
      threat_risk: riskPercentage + "%",
      threat_category: category
    }
END
```

## 3. GET THREAT CATEGORY ALGORITHM

**Purpose**: Determine threat category based on risk percentage

```
ALGORITHM: GetThreatCategory
INPUT: riskPercentage (number)
OUTPUT: category (string)

BEGIN
  IF riskPercentage >= 80 THEN
    RETURN "Very High (VH)"
  ELSE IF riskPercentage >= 70 THEN
    RETURN "High (HI)"
  ELSE IF riskPercentage >= 60 THEN
    RETURN "Moderate (MO)"
  ELSE IF riskPercentage >= 50 THEN
    RETURN "Low (LO)"
  ELSE IF riskPercentage >= 40 THEN
    RETURN "Very Low (VL)"
  ELSE IF riskPercentage >= 30 THEN
    RETURN "Near Threatened (NT)"
  ELSE
    RETURN "Least Concern (LC)"
END
```

## 4. UPDATE ASSESSMENT ALGORITHM

**Purpose**: Update an existing draft assessment

```
ALGORITHM: UpdateAssessment
INPUT: draftId, userId, assessmentData, reviewerId, coAssessorId, taxaId, submitForReview
OUTPUT: success or error

BEGIN
  1. Calculate threat scores:
     - CALL CalculateThreatScores(assessmentData)
  
  2. Prepare update data:
     - SET status = submitForReview ? "pending_review" : current status
     - MERGE assessmentData WITH calculated scores
  
  3. Update "Threat Assessments_duplicate" table:
     - UPDATE WHERE LR_Threat_Asses_ID = draftId
     - IF error THEN RETURN error
  
  4. Delete existing assignments:
     - DELETE FROM assessment_assignments WHERE assessment_id = draftId
  
  5. Recreate assignments:
     - INSERT assessor assignment (userId, role="assessor")
     - IF coAssessorId THEN INSERT co-assessor assignment
     - IF reviewerId THEN INSERT reviewer assignment
  
  6. Update taxa link:
     - DELETE FROM assessment_taxa WHERE assessment_id = draftId
     - IF taxaId THEN INSERT new taxa link
  
  7. IF submitForReview AND reviewerId THEN:
     - CREATE notification for reviewer
     - SEND email to reviewer
  
  8. RETURN success
END
```

## 5. SUBMIT FOR REVIEW ALGORITHM

**Purpose**: Submit a draft assessment for reviewer approval

```
ALGORITHM: SubmitForReview
INPUT: draftId, userId
OUTPUT: success or error

BEGIN
  1. Update draft status:
     - UPDATE "Threat Assessments_duplicate"
     - SET status = "pending_review"
     - WHERE LR_Threat_Asses_ID = draftId
  
  2. Get reviewer assignment:
     - SELECT user_id FROM assessment_assignments
     - WHERE assessment_id = draftId AND role = "reviewer"
  
  3. IF reviewer exists THEN:
     - CREATE notification for reviewer
     - SEND email notification
  
  4. RETURN success
END
```

## 6. REVIEWER APPROVAL ALGORITHM

**Purpose**: Approve a draft and move it to main database

```
ALGORITHM: ApproveAssessment
INPUT: draftId, reviewerId
OUTPUT: finalId or error

BEGIN
  1. Get draft data:
     - SELECT * FROM "Threat Assessments_duplicate"
     - WHERE LR_Threat_Asses_ID = draftId
  
  2. Generate final assessment ID:
     - Query "Threat Assessments" table
     - COUNT total records = N
     - SET finalId = "LR-(N+1)"
  
  3. Prepare approved data:
     - COPY all fields from draft
     - SET LR_Threat_Asses_ID = finalId
     - SET status = "approved"
     - SET reviewed_at = current timestamp
     - SET reviewed_by = reviewerId
     - REMOVE id field (UUID from draft table)
  
  4. Insert into main "Threat Assessments" table:
     - INSERT approvedData
     - IF error THEN RETURN error
  
  5. Clean up draft data:
     - DELETE FROM "Threat Assessments_duplicate" WHERE LR_Threat_Asses_ID = draftId
     - DELETE FROM assessment_assignments WHERE assessment_id = draftId
     - DELETE FROM assessment_taxa WHERE assessment_id = draftId
     - DELETE FROM assessment_comments WHERE assessment_id = draftId
  
  6. Get assessor and co-assessor IDs:
     - SELECT user_id FROM assignments WHERE role IN ("assessor", "co-assessor")
  
  7. FOR EACH assessorId IN assessorIds DO:
     - CREATE notification: "Your assessment has been approved!"
     - SEND email notification
  
  8. RETURN success WITH finalId
END
```

## 7. REVIEWER RETURN ALGORITHM

**Purpose**: Return a draft to assessor for revisions

```
ALGORITHM: ReturnAssessment
INPUT: draftId, reviewerId, comments
OUTPUT: success or error

BEGIN
  1. Validate comments exist:
     - IF comments.length == 0 THEN
       - RETURN error "At least one comment required"
  
  2. Update draft status:
     - UPDATE "Threat Assessments_duplicate"
     - SET status = "returned"
     - WHERE LR_Threat_Asses_ID = draftId
  
  3. Get assessor and co-assessor IDs:
     - SELECT user_id FROM assessment_assignments
     - WHERE assessment_id = draftId AND role IN ("assessor", "co-assessor")
  
  4. FOR EACH assessorId IN assessorIds DO:
     - CREATE notification: "Your assessment has been returned for revisions"
     - SEND email notification
  
  5. RETURN success
END
```

## 8. ADD COMMENT ALGORITHM

**Purpose**: Add a reviewer comment to an assessment

```
ALGORITHM: AddComment
INPUT: draftId, userId, commentText
OUTPUT: comment object or error

BEGIN
  1. Validate input:
     - IF commentText is empty THEN RETURN error
  
  2. Insert comment:
     - INSERT INTO assessment_comments:
       - assessment_id = draftId
       - user_id = userId
       - comment = commentText
       - created_at = current timestamp
     - SELECT inserted comment WITH user profile data
  
  3. RETURN comment object
END
```

## 9. FETCH USER ASSESSMENTS ALGORITHM

**Purpose**: Get all assessments for current user with their role

```
ALGORITHM: FetchUserAssessments
INPUT: userId
OUTPUT: list of assessments with user roles

BEGIN
  1. Get user's assignment IDs:
     - SELECT assessment_id, role FROM assessment_assignments
     - WHERE user_id = userId
     - STORE as assignedAssessments
  
  2. Extract assessment IDs:
     - SET assessmentIds = array of assessment_id from assignedAssessments
  
  3. Fetch all drafts:
     - SELECT * FROM "Threat Assessments_duplicate"
     - ORDER BY LR_Threat_Asses_ID
  
  4. Filter assessments:
     - SET userAssessments = []
     - FOR EACH draft IN allDrafts DO:
       - IF draft.LR_Threat_Asses_ID IN assessmentIds THEN:
         - FIND role = assignedAssessments[draft.LR_Threat_Asses_ID].role
         - ADD role to draft as userRole
         - APPEND draft to userAssessments
  
  5. Enrich with comment counts:
     - FOR EACH assessment IN userAssessments DO:
       - COUNT comments FROM assessment_comments WHERE assessment_id = assessment.id
       - ADD commentCount to assessment
  
  6. RETURN userAssessments
END
```

## 10. DELETE DRAFT ALGORITHM

**Purpose**: Delete a draft assessment

```
ALGORITHM: DeleteDraft
INPUT: draftId, userId
OUTPUT: success or error

BEGIN
  1. Verify ownership:
     - SELECT role FROM assessment_assignments
     - WHERE assessment_id = draftId AND user_id = userId
     - IF role NOT IN ("assessor", "co-assessor") THEN
       - RETURN error "Not authorized"
  
  2. Delete cascading records:
     - DELETE FROM assessment_comments WHERE assessment_id = draftId
     - DELETE FROM assessment_taxa WHERE assessment_id = draftId
     - DELETE FROM assessment_assignments WHERE assessment_id = draftId
  
  3. Delete draft:
     - DELETE FROM "Threat Assessments_duplicate"
     - WHERE LR_Threat_Asses_ID = draftId
  
  4. RETURN success
END
```

## 11. ROLE-BASED ACCESS CONTROL ALGORITHM

**Purpose**: Determine what actions a user can perform on an assessment

```
ALGORITHM: GetUserPermissions
INPUT: userId, assessmentId, assessmentStatus
OUTPUT: permissions object

BEGIN
  1. Get user's role:
     - SELECT role FROM assessment_assignments
     - WHERE assessment_id = assessmentId AND user_id = userId
  
  2. Initialize permissions:
     - SET permissions = {
       canView: false,
       canEdit: false,
       canDelete: false,
       canReview: false,
       canComment: false
     }
  
  3. IF role == "assessor" OR role == "co-assessor" THEN:
     - SET canView = true
     - SET canComment = true
     - IF status IN ("draft", "returned") THEN:
       - SET canEdit = true
       - SET canDelete = true (assessor only)
  
  4. IF role == "reviewer" THEN:
     - SET canView = true
     - SET canComment = true
     - IF status == "pending_review" THEN:
       - SET canReview = true
  
  5. RETURN permissions
END
```

## 12. NOTIFICATION ALGORITHM

**Purpose**: Create and send notifications to users

```
ALGORITHM: SendNotification
INPUT: userId, message, type, emailSubject
OUTPUT: success or error

BEGIN
  1. Create in-app notification:
     - INSERT INTO notifications:
       - user_id = userId
       - message = message
       - type = type (assignment, approval, returned)
       - read = false
       - created_at = current timestamp
  
  2. Get user email:
     - SELECT email FROM profiles WHERE id = userId
  
  3. IF email exists THEN:
     - TRY:
       - CALL email API with:
         - to = email
         - subject = emailSubject
         - body = message
     - CATCH error:
       - LOG error (don't fail if email fails)
  
  4. RETURN success
END
```
