# Score Entry Logic Fix

## Problem Identified

The score entry system had a logical error where teachers could see all classes regardless of the admin's score entry mode setting.

## The Issue

When a teacher selected "Entry Mode" on the score entry page:
- The system showed ALL classes without checking the admin's score entry mode setting
- Teachers could potentially enter scores for subjects they don't teach
- The system didn't respect the school's score entry configuration

## The Solution

### Key Rule: Class Teachers Always Have Full Access

**IMPORTANT:** If a teacher is assigned as a class teacher for any class, they ALWAYS see that class in the dropdown and can enter scores for ALL subjects in that class, regardless of the score entry mode setting.

### Backend Changes (`backend/teachers/views.py`)

Added a new API endpoint: `score_entry_config`

```python
@action(detail=False, methods=['get'])
def score_entry_config(self, request):
    """Get score entry configuration and available classes/subjects based on school settings"""
```

This endpoint:
1. Checks the school's `score_entry_mode` setting
2. Returns different data based on the mode:

#### Mode 1: CLASS_TEACHER
- Shows ONLY classes where teacher is assigned as class teacher
- For each class, they can enter scores for ALL subjects
- Use case: Only class teachers can enter scores

#### Mode 2: SUBJECT_TEACHER  
- **First Priority:** Shows ALL classes where teacher is class teacher (with ALL subjects)
- **Second Priority:** Shows classes where teacher teaches specific subjects (with ONLY those subjects)
- Use case: Both class teachers and subject teachers can enter scores

### Frontend Changes (`frontend/src/pages/teacher/ScoreEntry.tsx`)

Updated the component to:
1. Fetch score entry configuration from the new API endpoint
2. Display classes based on the school's score entry mode
3. Filter available subjects based on teacher's permissions
4. Show appropriate UI messages based on the mode

## How It Works Now

### Universal Rule
**If a teacher is assigned as CLASS TEACHER for a class:**
- That class ALWAYS appears in the dropdown
- They can ALWAYS enter scores for ALL subjects in that class
- This works in BOTH "Class Teacher" and "Subject Teacher" modes

### Scenario 1: Admin Sets "Class Teacher" Mode

1. Teacher logs in and goes to Score Entry
2. System shows ONLY classes where teacher is class teacher
3. Teacher selects a class
4. System shows ALL subjects for that class
5. Teacher can enter scores for any subject

**Example:**
- Teacher John is class teacher for Form 1A
- Teacher John is NOT assigned to teach any subject in Form 1A
- Teacher John can still see Form 1A and enter scores for all subjects

### Scenario 2: Admin Sets "Subject Teacher" Mode

1. Teacher logs in and goes to Score Entry
2. System shows:
   - **First:** ALL classes where teacher is class teacher (with ALL subjects)
   - **Then:** Classes where teacher teaches specific subjects (with ONLY those subjects)
3. Teacher selects a class
4. System shows appropriate subjects based on their role
5. Teacher can enter scores accordingly

**Example:**
- Teacher Mary is class teacher for Form 2B (sees ALL subjects for Form 2B)
- Teacher Mary also teaches Math in Form 3A (sees ONLY Math for Form 3A)
- Teacher Mary teaches English in Form 3B (sees ONLY English for Form 3B)

## API Endpoint Details

### GET `/api/teachers/score_entry_config/`

**Response Structure:**

```json
{
  "score_entry_mode": "CLASS_TEACHER" | "SUBJECT_TEACHER",
  "classes": [
    {
      "id": 1,
      "name": "Form 1A",
      "level": "FORM_1",
      "section": "A",
      "is_class_teacher": true,
      "subjects": [
        {
          "id": 1,
          "name": "Mathematics",
          "class_subject_id": 10
        },
        {
          "id": 2,
          "name": "English",
          "class_subject_id": 11
        }
      ]
    }
  ]
}
```

## Benefits

1. **Class Teacher Priority**: Class teachers always have full access to their classes, even without subject assignments
2. **Proper Access Control**: Teachers can only enter scores for classes/subjects they're authorized for
3. **Flexible Configuration**: Schools can choose their preferred score entry workflow
4. **Clear Permissions**: Teachers see exactly what they can manage
5. **Audit Trail**: System knows who entered which scores based on their assignments
6. **No Gaps**: Class teachers don't need individual subject assignments to manage their class

## Testing

To test the fix:

### Test Case 1: Class Teacher Without Subject Assignment

1. **As Admin:**
   - Assign Teacher A as class teacher for Form 1A
   - Do NOT assign Teacher A to teach any subject in Form 1A
   - Set score entry mode to either "Class Teacher" or "Subject Teacher"

2. **As Teacher A:**
   - Log in and go to Score Entry
   - ✅ Verify Form 1A appears in the class dropdown
   - ✅ Verify ALL subjects for Form 1A are available
   - ✅ Verify you can enter scores for any subject

### Test Case 2: Class Teacher Mode

1. **As Admin:**
   - Set "Score Entry Mode" to "Class Teacher"
   - Assign Teacher B as class teacher for Form 2A
   - Assign Teacher B to teach Math in Form 3A

2. **As Teacher B:**
   - Log in and go to Score Entry
   - ✅ Verify you see ONLY Form 2A (your class teacher assignment)
   - ✅ Verify you do NOT see Form 3A (subject assignment ignored in this mode)
   - ✅ Verify you can enter scores for all subjects in Form 2A

### Test Case 3: Subject Teacher Mode

1. **As Admin:**
   - Set "Score Entry Mode" to "Subject Teacher"
   - Assign Teacher C as class teacher for Form 1B
   - Assign Teacher C to teach English in Form 2B
   - Assign Teacher C to teach Science in Form 3B

2. **As Teacher C:**
   - Log in and go to Score Entry
   - ✅ Verify you see Form 1B with ALL subjects (class teacher)
   - ✅ Verify you see Form 2B with ONLY English (subject assignment)
   - ✅ Verify you see Form 3B with ONLY Science (subject assignment)
   - ✅ Verify you can enter scores appropriately for each class

## Database Schema Reference

### School Model
```python
score_entry_mode = models.CharField(
    max_length=20,
    choices=[
        ('CLASS_TEACHER', 'Class Teacher'),
        ('SUBJECT_TEACHER', 'Subject Teacher')
    ],
    default='SUBJECT_TEACHER'
)
```

### Class Model
```python
class_teacher = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='classes_as_teacher'
)
```

### ClassSubject Model
```python
teacher = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='teaching_subjects'
)
```

## Summary

The fix ensures that the score entry system properly respects the school's configuration and teacher assignments, providing appropriate access control and a clear user experience based on the admin's chosen workflow.
