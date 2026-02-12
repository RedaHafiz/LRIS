# Query System Algorithms

## 1. SEARCH ASSESSMENTS ALGORITHM

**Purpose**: Search approved threat assessments with filters and text query

```
ALGORITHM: SearchAssessments
INPUT: searchQuery (text), filters (crop, country, threatLevel), sortBy, sortOrder
OUTPUT: list of matching assessments

BEGIN
  1. Initialize base query:
     - SELECT * FROM "Threat Assessments"
     - SET conditions = []
  
  2. Apply text search filter:
     - IF searchQuery is not empty THEN:
       - SET searchPattern = "%" + searchQuery + "%"
       - ADD condition: (
           LR_Name ILIKE searchPattern OR
           Crop ILIKE searchPattern OR
           LR_Threat_Assessor ILIKE searchPattern OR
           Country ILIKE searchPattern
         )
  
  3. Apply crop filter:
     - IF filters.crop is not empty THEN:
       - ADD condition: Crop = filters.crop
  
  4. Apply country filter:
     - IF filters.country is not empty THEN:
       - ADD condition: Country = filters.country
  
  5. Apply threat level filter:
     - IF filters.threatLevel is not empty THEN:
       - ADD condition: Threat_Category = filters.threatLevel
  
  6. Build WHERE clause:
     - COMBINE all conditions WITH AND operator
  
  7. Apply sorting:
     - IF sortBy == "name" THEN:
       - ORDER BY LR_Name {sortOrder}
     - ELSE IF sortBy == "crop" THEN:
       - ORDER BY Crop {sortOrder}
     - ELSE IF sortBy == "date" THEN:
       - ORDER BY Assess_Date {sortOrder}
     - ELSE IF sortBy == "threat" THEN:
       - ORDER BY Threat_Risk_% {sortOrder}
     - ELSE:
       - ORDER BY created_at DESC (default)
  
  8. Execute query and RETURN results
END
```

## 2. GET FILTER OPTIONS ALGORITHM

**Purpose**: Retrieve unique values for filter dropdowns

```
ALGORITHM: GetFilterOptions
INPUT: none
OUTPUT: {crops, countries, threatLevels}

BEGIN
  1. Get unique crops:
     - SELECT DISTINCT Crop FROM "Threat Assessments"
     - WHERE Crop IS NOT NULL AND Crop != ""
     - ORDER BY Crop ASC
     - STORE as crops
  
  2. Get unique countries:
     - SELECT DISTINCT Country FROM "Threat Assessments"
     - WHERE Country IS NOT NULL AND Country != ""
     - ORDER BY Country ASC
     - STORE as rawCountries
  
  3. Normalize countries (remove duplicates with different casing):
     - SET countriesMap = new Map()
     - FOR EACH country IN rawCountries DO:
       - SET lowerKey = country.toLowerCase()
       - IF lowerKey NOT IN countriesMap THEN:
         - ADD countriesMap[lowerKey] = country
     - SET countries = values from countriesMap
  
  4. Get threat levels dynamically:
     - SELECT DISTINCT Threat_Category FROM "Threat Assessments"
     - WHERE Threat_Category IS NOT NULL
     - ORDER BY custom order:
       - "Very High (VH)" first
       - "High (HI)" second
       - "Moderate (MO)" third
       - etc.
     - STORE as threatLevels
  
  5. RETURN {
      crops: crops,
      countries: countries,
      threatLevels: threatLevels
    }
END
```

## 3. DETAILED ASSESSMENT VIEW ALGORITHM

**Purpose**: Fetch complete details for a single assessment

```
ALGORITHM: GetAssessmentDetails
INPUT: assessmentId
OUTPUT: assessment object with all related data

BEGIN
  1. Fetch main assessment data:
     - SELECT * FROM "Threat Assessments"
     - WHERE LR_Threat_Asses_ID = assessmentId
     - IF not found THEN RETURN error "Assessment not found"
  
  2. Fetch linked taxa data (if exists):
     - SELECT taxa_id FROM assessment_taxa
     - WHERE assessment_id = assessmentId
     - IF taxa_id exists THEN:
       - SELECT * FROM Taxa WHERE id = taxa_id
       - ADD taxa data to assessment
  
  3. Fetch assessor profile:
     - IF LR_Threat_Assessor field contains email/ID THEN:
       - SELECT profile FROM profiles
       - ADD assessor details to assessment
  
  4. Fetch reviewer profile:
     - IF LR_Threat_Reviewer field exists THEN:
       - SELECT profile FROM profiles
       - ADD reviewer details to assessment
  
  5. Parse all subcriteria scores:
     - FOR EACH of 24 subcriteria fields DO:
       - ADD to structured scores object by criterion (A, B, C, D)
  
  6. RETURN complete assessment object
END
```

## 4. EXPORT SEARCH RESULTS ALGORITHM

**Purpose**: Export filtered search results to CSV or JSON format

```
ALGORITHM: ExportSearchResults
INPUT: assessments, format (CSV or JSON)
OUTPUT: downloadable file

BEGIN
  1. IF format == "CSV" THEN:
     - CALL ExportToCSV(assessments)
  
  2. ELSE IF format == "JSON" THEN:
     - CALL ExportToJSON(assessments)
  
  3. RETURN file
END
```

## 5. EXPORT TO CSV ALGORITHM

**Purpose**: Convert assessments to CSV format

```
ALGORITHM: ExportToCSV
INPUT: assessments
OUTPUT: CSV file content

BEGIN
  1. Define CSV headers:
     - SET headers = [
       "ID", "Landrace Name", "Crop", "Country",
       "Assessor", "Assessment Date", "Reviewer", "Review Date",
       "Threat Score", "Max Score", "Risk %", "Category",
       "A1.1", "A1.2", "A1.3", ... (all 24 subcriteria),
       "Status"
     ]
  
  2. Initialize CSV content:
     - SET csvContent = headers.join(",") + newline
  
  3. FOR EACH assessment IN assessments DO:
     - SET row = []
     - FOR EACH header IN headers DO:
       - GET value = assessment[corresponding_field]
       - IF value contains comma or quote THEN:
         - ESCAPE value with quotes
       - APPEND value to row
     - APPEND row.join(",") + newline to csvContent
  
  4. Create downloadable file:
     - SET filename = "threat-assessments-" + currentDate + ".csv"
     - SET mimeType = "text/csv"
  
  5. RETURN {content: csvContent, filename: filename, mimeType: mimeType}
END
```

## 6. EXPORT TO JSON ALGORITHM

**Purpose**: Convert assessments to JSON format

```
ALGORITHM: ExportToJSON
INPUT: assessments
OUTPUT: JSON file content

BEGIN
  1. Structure data:
     - SET exportData = {
       exportDate: current timestamp,
       totalRecords: assessments.length,
       assessments: []
     }
  
  2. FOR EACH assessment IN assessments DO:
     - CREATE structured object:
       - basic_info: {id, name, crop, country}
       - assessment_details: {assessor, date, reviewer, review_date}
       - threat_analysis: {score, max_score, risk_percentage, category}
       - criteria_scores: {
           criterion_a: [A1.1, A1.2, ...],
           criterion_b: [B1.1, B1.2, ...],
           criterion_c: [C1.1, C1.2, ...],
           criterion_d: [D1.1, D1.2, ...]
         }
       - status: status
     - APPEND to exportData.assessments
  
  3. Convert to JSON:
     - SET jsonContent = JSON.stringify(exportData, null, 2)
  
  4. Create downloadable file:
     - SET filename = "threat-assessments-" + currentDate + ".json"
     - SET mimeType = "application/json"
  
  5. RETURN {content: jsonContent, filename: filename, mimeType: mimeType}
END
```

## 7. ADVANCED SEARCH WITH CRITERIA SCORES ALGORITHM

**Purpose**: Search assessments by specific subcriteria score ranges

```
ALGORITHM: AdvancedSearchByCriteria
INPUT: criteriaFilters (array of {criterion, minScore, maxScore})
OUTPUT: matching assessments

BEGIN
  1. Initialize base query:
     - SELECT * FROM "Threat Assessments"
     - SET conditions = []
  
  2. FOR EACH filter IN criteriaFilters DO:
     - GET criterionField = "Subcriteria_Scores_" + filter.criterion
     - ADD condition:
       - CAST(criterionField AS FLOAT) >= filter.minScore
       - AND CAST(criterionField AS FLOAT) <= filter.maxScore
       - AND criterionField NOT IN ("NA", "N/A", "")
  
  3. Combine conditions:
     - JOIN all conditions WITH AND operator
  
  4. Execute query and RETURN results
END
```

## 8. AGGREGATE STATISTICS ALGORITHM

**Purpose**: Calculate statistics across all assessments or filtered set

```
ALGORITHM: CalculateStatistics
INPUT: assessments (optional - all if not provided)
OUTPUT: statistics object

BEGIN
  1. IF assessments not provided THEN:
     - SELECT * FROM "Threat Assessments"
  
  2. Initialize counters:
     - SET totalCount = 0
     - SET categoryCount = {
       "Very High (VH)": 0,
       "High (HI)": 0,
       "Moderate (MO)": 0,
       "Low (LO)": 0,
       "Very Low (VL)": 0,
       "Near Threatened (NT)": 0,
       "Least Concern (LC)": 0
     }
     - SET cropCount = {}
     - SET countryCount = {}
     - SET avgThreatScore = 0
     - SET scoreSum = 0
  
  3. FOR EACH assessment IN assessments DO:
     - INCREMENT totalCount
     - INCREMENT categoryCount[assessment.Threat_Category]
     - INCREMENT cropCount[assessment.Crop]
     - INCREMENT countryCount[assessment.Country]
     - ADD assessment.Threat_Risk_% to scoreSum
  
  4. Calculate averages:
     - SET avgThreatScore = scoreSum / totalCount
  
  5. Find top crops and countries:
     - SORT cropCount by value DESC
     - GET top 10 crops
     - SORT countryCount by value DESC
     - GET top 10 countries
  
  6. RETURN {
      total: totalCount,
      byCategory: categoryCount,
      topCrops: top crops with counts,
      topCountries: top countries with counts,
      averageThreatScore: avgThreatScore
    }
END
```

## 9. COMPARISON VIEW ALGORITHM

**Purpose**: Compare multiple assessments side by side

```
ALGORITHM: CompareAssessments
INPUT: assessmentIds (array)
OUTPUT: comparison data structure

BEGIN
  1. Validate input:
     - IF assessmentIds.length < 2 OR > 5 THEN:
       - RETURN error "Can compare 2-5 assessments only"
  
  2. Fetch assessments:
     - SET assessments = []
     - FOR EACH id IN assessmentIds DO:
       - SELECT * FROM "Threat Assessments"
       - WHERE LR_Threat_Asses_ID = id
       - APPEND to assessments
  
  3. Structure comparison data:
     - SET comparison = {
       basic: [],
       threat_analysis: [],
       criterion_a: [],
       criterion_b: [],
       criterion_c: [],
       criterion_d: []
     }
  
  4. FOR EACH assessment IN assessments DO:
     - ADD basic info to comparison.basic
     - ADD threat scores to comparison.threat_analysis
     - ADD all A criteria scores to comparison.criterion_a
     - ADD all B criteria scores to comparison.criterion_b
     - ADD all C criteria scores to comparison.criterion_c
     - ADD all D criteria scores to comparison.criterion_d
  
  5. Calculate differences:
     - FOR EACH criterion group DO:
       - FIND min and max values for each subcriteria
       - CALCULATE variance across assessments
       - HIGHLIGHT significant differences (> 2 points)
  
  6. RETURN comparison with highlighted differences
END
```

## 10. SEARCH RESULT PAGINATION ALGORITHM

**Purpose**: Paginate large search result sets

```
ALGORITHM: PaginateResults
INPUT: results, pageNumber, pageSize
OUTPUT: paginated results with metadata

BEGIN
  1. Calculate pagination metadata:
     - SET totalResults = results.length
     - SET totalPages = CEIL(totalResults / pageSize)
     - SET startIndex = (pageNumber - 1) * pageSize
     - SET endIndex = MIN(startIndex + pageSize, totalResults)
  
  2. Validate page number:
     - IF pageNumber < 1 OR pageNumber > totalPages THEN:
       - SET pageNumber = 1
  
  3. Extract page data:
     - SET pageResults = results.slice(startIndex, endIndex)
  
  4. RETURN {
      data: pageResults,
      pagination: {
        currentPage: pageNumber,
        pageSize: pageSize,
        totalResults: totalResults,
        totalPages: totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    }
END
```

## 11. SAVE QUERY PRESET ALGORITHM

**Purpose**: Save frequently used search filters as preset

```
ALGORITHM: SaveQueryPreset
INPUT: userId, presetName, filters, sortOptions
OUTPUT: presetId or error

BEGIN
  1. Validate preset name:
     - IF presetName is empty THEN RETURN error
  
  2. Check for duplicate:
     - SELECT * FROM query_presets
     - WHERE user_id = userId AND name = presetName
     - IF exists THEN RETURN error "Preset name already exists"
  
  3. Serialize filters:
     - SET filterJSON = JSON.stringify({
       filters: filters,
       sort: sortOptions
     })
  
  4. Insert preset:
     - INSERT INTO query_presets:
       - user_id = userId
       - name = presetName
       - filters = filterJSON
       - created_at = current timestamp
     - GET inserted preset id
  
  5. RETURN presetId
END
```

## 12. LOAD QUERY PRESET ALGORITHM

**Purpose**: Load and apply a saved query preset

```
ALGORITHM: LoadQueryPreset
INPUT: userId, presetId
OUTPUT: filters and sort options

BEGIN
  1. Fetch preset:
     - SELECT * FROM query_presets
     - WHERE id = presetId AND user_id = userId
     - IF not found THEN RETURN error "Preset not found"
  
  2. Deserialize filters:
     - SET presetData = JSON.parse(preset.filters)
  
  3. Apply filters to search:
     - CALL SearchAssessments with presetData.filters and presetData.sort
  
  4. RETURN search results
END
```

## 13. AUTOCOMPLETE SEARCH ALGORITHM

**Purpose**: Provide search suggestions as user types

```
ALGORITHM: AutocompleteSearch
INPUT: partialQuery, field (landrace_name, crop, country, assessor)
OUTPUT: list of suggestions

BEGIN
  1. Validate input:
     - IF partialQuery.length < 2 THEN RETURN empty array
  
  2. Set search pattern:
     - SET pattern = partialQuery + "%"
  
  3. Query based on field:
     - IF field == "landrace_name" THEN:
       - SELECT DISTINCT LR_Name FROM "Threat Assessments"
       - WHERE LR_Name ILIKE pattern
       - LIMIT 10
     
     - ELSE IF field == "crop" THEN:
       - SELECT DISTINCT Crop FROM "Threat Assessments"
       - WHERE Crop ILIKE pattern
       - LIMIT 10
     
     - ELSE IF field == "country" THEN:
       - SELECT DISTINCT Country FROM "Threat Assessments"
       - WHERE Country ILIKE pattern
       - LIMIT 10
     
     - ELSE IF field == "assessor" THEN:
       - SELECT DISTINCT LR_Threat_Assessor FROM "Threat Assessments"
       - WHERE LR_Threat_Assessor ILIKE pattern
       - LIMIT 10
  
  4. RETURN suggestions ordered by relevance
END
```

## 14. THREAT LEVEL DISTRIBUTION ALGORITHM

**Purpose**: Calculate distribution of threat levels for visualization

```
ALGORITHM: GetThreatLevelDistribution
INPUT: filters (optional)
OUTPUT: distribution data for charts

BEGIN
  1. Initialize counters:
     - SET distribution = {
       "Very High (VH)": {count: 0, percentage: 0},
       "High (HI)": {count: 0, percentage: 0},
       "Moderate (MO)": {count: 0, percentage: 0},
       "Low (LO)": {count: 0, percentage: 0},
       "Very Low (VL)": {count: 0, percentage: 0},
       "Near Threatened (NT)": {count: 0, percentage: 0},
       "Least Concern (LC)": {count: 0, percentage: 0}
     }
  
  2. Get assessments:
     - IF filters provided THEN:
       - CALL SearchAssessments(filters)
     - ELSE:
       - SELECT * FROM "Threat Assessments"
  
  3. Count by category:
     - SET total = 0
     - FOR EACH assessment IN assessments DO:
       - INCREMENT distribution[assessment.Threat_Category].count
       - INCREMENT total
  
  4. Calculate percentages:
     - FOR EACH category IN distribution DO:
       - SET percentage = (category.count / total) * 100
       - ROUND percentage to 1 decimal place
       - SET distribution[category].percentage = percentage
  
  5. RETURN distribution
END
```
