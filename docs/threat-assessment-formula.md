# Threat Assessment - Algorithm & Formula

## Calculation Formula

### Variables
- **n** = Total number of criteria (24)
- **S<sub>i</sub>** = Score for criterion i (where i = 1 to 24)
- **NA** = Number of criteria marked as "Not Applicable"
- **BASE_MAX** = 120 (24 × 5)

### Core Formulas

**1. Total Score**
```
Total_Score = Σ S(i)  where S(i) ∈ {1, 2, 3, 4, 5}
              i=1 to 24
```

**2. Adjusted Max Score**
```
Adjusted_Max_Score = 120 - (NA × 5)
```

**3. Risk Percentage**
```
Risk_% = (Total_Score / Adjusted_Max_Score) × 100
```

**4. Threat Category**
```
Category = {
  "Very High (VH)"         if Risk_% ≥ 80
  "High (HI)"              if 70 ≤ Risk_% < 80
  "Moderate (MO)"          if 60 ≤ Risk_% < 70
  "Low (LO)"               if 50 ≤ Risk_% < 60
  "Very Low (VL)"          if 40 ≤ Risk_% < 50
  "Near Threatened (NT)"   if 30 ≤ Risk_% < 40
  "Least Concern (LC)"     if Risk_% < 30
}
```

---

## Simple Logic Algorithm (for Flowchart)

```
START

1. Initialize:
   - Total_Score = 0
   - NA_Count = 0
   - BASE_MAX = 120

2. For each of 24 criteria:
   ├─ Read criterion value
   ├─ Is value = "NA"?
   │  ├─ YES: NA_Count = NA_Count + 1
   │  └─ NO: Is value between 1-5?
   │     ├─ YES: Total_Score = Total_Score + value
   │     └─ NO: Skip (invalid/empty)

3. Calculate Adjusted Max Score:
   Adjusted_Max = 120 - (NA_Count × 5)

4. Calculate Risk Percentage:
   Risk_% = (Total_Score ÷ Adjusted_Max) × 100

5. Determine Threat Category:
   ├─ Risk_% ≥ 80? → Category = "Very High (VH)"
   ├─ Risk_% ≥ 70? → Category = "High (HI)"
   ├─ Risk_% ≥ 60? → Category = "Moderate (MO)"
   ├─ Risk_% ≥ 50? → Category = "Low (LO)"
   ├─ Risk_% ≥ 40? → Category = "Very Low (VL)"
   ├─ Risk_% ≥ 30? → Category = "Near Threatened (NT)"
   └─ Else → Category = "Least Concern (LC)"

6. Output Results:
   - Total_Score
   - Adjusted_Max
   - Risk_%
   - Category

END
```

---

## Flowchart Structure

### Main Flow
```
[START]
   ↓
[Initialize Variables]
Total_Score = 0
NA_Count = 0
   ↓
[Loop: i = 1 to 24]
   ↓
[Read Criterion_i]
   ↓
[Is value = "NA"?] ──YES→ [NA_Count++] ──┐
   ↓ NO                                   │
[Is value 1-5?] ──NO→ [Skip] ────────────┤
   ↓ YES                                  │
[Total_Score += value]                    │
   ↓                                      │
[More criteria?] ──YES→ [Loop back] ←─────┘
   ↓ NO
[Calculate Adjusted_Max]
Adjusted_Max = 120 - (NA_Count × 5)
   ↓
[Calculate Risk_%]
Risk_% = (Total_Score ÷ Adjusted_Max) × 100
   ↓
[Determine Category]
   ↓
┌──[Risk_% ≥ 80?] ──YES→ [Category = "Very High (VH)"]──┐
│     ↓ NO                                                │
│  [Risk_% ≥ 70?] ──YES→ [Category = "High (HI)"]────────┤
│     ↓ NO                                                │
│  [Risk_% ≥ 60?] ──YES→ [Category = "Moderate (MO)"]────┤
│     ↓ NO                                                │
│  [Risk_% ≥ 50?] ──YES→ [Category = "Low (LO)"]─────────┤
│     ↓ NO                                                │
│  [Risk_% ≥ 40?] ──YES→ [Category = "Very Low (VL)"]────┤
│     ↓ NO                                                │
│  [Risk_% ≥ 30?] ──YES→ [Category = "Near Threatened"]──┤
│     ↓ NO                                                │
│  [Category = "Least Concern (LC)"]                      │
└─────────────────────────────────────────────────────────┘
   ↓
[Save Results]
- Total_Score
- Adjusted_Max
- Risk_%
- Category
   ↓
[END]
```

---

## Calculation Examples

### Example 1
**Input:**
- 24 criteria scored
- Scores: 21 criteria range from 1-5, total = 84
- NA = 0

**Calculation:**
```
Total_Score = 84
Adjusted_Max = 120 - (0 × 5) = 120
Risk_% = (84 ÷ 120) × 100 = 70.0%
Category = "High (HI)"
```

### Example 2
**Input:**
- 21 criteria scored
- Total = 63
- NA = 3

**Calculation:**
```
Total_Score = 63
Adjusted_Max = 120 - (3 × 5) = 105
Risk_% = (63 ÷ 105) × 100 = 60.0%
Category = "Moderate (MO)"
```

### Example 3
**Input:**
- 19 criteria scored
- Total = 76
- NA = 5

**Calculation:**
```
Total_Score = 76
Adjusted_Max = 120 - (5 × 5) = 95
Risk_% = (76 ÷ 95) × 100 = 80.0%
Category = "Very High (VH)"
```
