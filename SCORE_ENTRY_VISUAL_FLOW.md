# Score Entry Logic - Visual Flow Diagram

## Universal Rule (Applies to BOTH Modes)

```
┌─────────────────────────────────────────────────────────────┐
│  🔑 GOLDEN RULE: CLASS TEACHER ALWAYS HAS FULL ACCESS       │
│                                                              │
│  If Teacher is CLASS TEACHER for a class:                   │
│  ✅ Class ALWAYS appears in dropdown                        │
│  ✅ Can enter scores for ALL subjects                       │
│  ✅ Works regardless of subject assignments                 │
│  ✅ Works in BOTH "Class Teacher" and "Subject Teacher" modes│
└─────────────────────────────────────────────────────────────┘
```

## Mode 1: CLASS_TEACHER Mode

```
Teacher Opens Score Entry
         │
         ▼
┌────────────────────────────────────┐
│ Check: Is teacher a CLASS TEACHER  │
│        for any class?               │
└────────────────────────────────────┘
         │
         ▼
    ┌────┴────┐
    │   YES   │
    └────┬────┘
         │
         ▼
┌────────────────────────────────────┐
│ Show ONLY classes where teacher    │
│ is CLASS TEACHER                   │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ For each class:                    │
│ Show ALL subjects                  │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Teacher can enter scores for       │
│ ALL subjects in those classes      │
└────────────────────────────────────┘
```

### Example Scenario:

```
Teacher: John Smith
Role: Class Teacher for Form 1A

Assignments:
✅ Class Teacher: Form 1A
❌ Subject Assignments: None

Result in CLASS_TEACHER Mode:
┌─────────────────────────────────┐
│ Classes Available:              │
│                                 │
│ 📚 Form 1A (Class Teacher)     │
│    ├─ Mathematics              │
│    ├─ English                  │
│    ├─ Science                  │
│    ├─ History                  │
│    └─ Geography                │
└─────────────────────────────────┘

✅ Can enter scores for ALL subjects
```

## Mode 2: SUBJECT_TEACHER Mode

```
Teacher Opens Score Entry
         │
         ▼
┌────────────────────────────────────┐
│ Step 1: Get classes where teacher  │
│         is CLASS TEACHER           │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ For each class teacher assignment: │
│ Add class with ALL subjects        │
│ Mark as is_class_teacher: true     │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Step 2: Get subject assignments    │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ For each subject assignment:       │
│ - If class already added (as class │
│   teacher), SKIP                   │
│ - Otherwise, add class with ONLY   │
│   assigned subjects                │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Teacher sees combined list:        │
│ - Class teacher classes (all subj) │
│ - Subject teaching classes (limited)│
└────────────────────────────────────┘
```

### Example Scenario:

```
Teacher: Mary Johnson
Assignments:
✅ Class Teacher: Form 2B
✅ Subject Teacher: Mathematics in Form 3A
✅ Subject Teacher: English in Form 3B

Result in SUBJECT_TEACHER Mode:
┌─────────────────────────────────────┐
│ Classes Available:                  │
│                                     │
│ 📚 Form 2B (Class Teacher) ⭐      │
│    ├─ Mathematics                  │
│    ├─ English                      │
│    ├─ Science                      │
│    ├─ History                      │
│    └─ Geography                    │
│                                     │
│ 📚 Form 3A (Subject Teacher)       │
│    └─ Mathematics ONLY             │
│                                     │
│ 📚 Form 3B (Subject Teacher)       │
│    └─ English ONLY                 │
└─────────────────────────────────────┘

✅ Form 2B: Can enter scores for ALL subjects
✅ Form 3A: Can enter scores for Mathematics ONLY
✅ Form 3B: Can enter scores for English ONLY
```

## Priority Logic in SUBJECT_TEACHER Mode

```
┌─────────────────────────────────────────────────────────┐
│                    PRIORITY ORDER                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1️⃣ CLASS TEACHER ASSIGNMENTS (Highest Priority)       │
│     - Full access to ALL subjects                       │
│     - Always included first                             │
│     - Cannot be overridden                              │
│                                                          │
│  2️⃣ SUBJECT TEACHER ASSIGNMENTS (Lower Priority)       │
│     - Limited to assigned subjects only                 │
│     - Only added if NOT already a class teacher         │
│     - Filtered by specific subject assignments          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Edge Cases Handled

### Case 1: Class Teacher with No Subject Assignments
```
Teacher: Alice Brown
✅ Class Teacher: Form 1C
❌ No subject assignments in Form 1C

Result: ✅ Can still see Form 1C and enter scores for ALL subjects
Reason: Class teacher status grants full access
```

### Case 2: Class Teacher + Subject Teacher in Same Class
```
Teacher: Bob Wilson
✅ Class Teacher: Form 2A
✅ Subject Teacher: Mathematics in Form 2A

Result: ✅ Sees Form 2A with ALL subjects (not just Mathematics)
Reason: Class teacher status takes priority
```

### Case 3: Subject Teacher Only
```
Teacher: Carol Davis
❌ Not a class teacher anywhere
✅ Subject Teacher: Science in Form 1A, Form 1B, Form 1C

Result: ✅ Sees Form 1A, 1B, 1C but ONLY Science subject
Reason: No class teacher status, limited to subject assignments
```

### Case 4: Multiple Class Teacher Assignments
```
Teacher: David Lee
✅ Class Teacher: Form 1A
✅ Class Teacher: Form 2A
✅ Subject Teacher: Math in Form 3A

In CLASS_TEACHER Mode:
  ✅ Sees Form 1A (all subjects)
  ✅ Sees Form 2A (all subjects)
  ❌ Does NOT see Form 3A

In SUBJECT_TEACHER Mode:
  ✅ Sees Form 1A (all subjects)
  ✅ Sees Form 2A (all subjects)
  ✅ Sees Form 3A (Math only)
```

## API Response Structure

### For Class Teacher Assignment:
```json
{
  "id": 1,
  "name": "Form 1A",
  "level": "FORM_1",
  "section": "A",
  "is_class_teacher": true,  // ⭐ Important flag
  "subjects": [
    {"id": 1, "name": "Mathematics", "class_subject_id": 10},
    {"id": 2, "name": "English", "class_subject_id": 11},
    {"id": 3, "name": "Science", "class_subject_id": 12}
    // ALL subjects included
  ]
}
```

### For Subject Teacher Assignment:
```json
{
  "id": 2,
  "name": "Form 2A",
  "level": "FORM_2",
  "section": "A",
  "is_class_teacher": false,  // Not a class teacher
  "subjects": [
    {"id": 1, "name": "Mathematics", "class_subject_id": 15}
    // ONLY assigned subject included
  ]
}
```

## Summary

```
╔═══════════════════════════════════════════════════════════╗
║                    KEY TAKEAWAYS                          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  1. Class teachers ALWAYS see their classes              ║
║  2. Class teachers ALWAYS have access to ALL subjects    ║
║  3. Subject assignments don't matter for class teachers  ║
║  4. In SUBJECT_TEACHER mode, both roles coexist          ║
║  5. Class teacher status takes priority over subject     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```
