# Assignment Type Flows - Complete Guide

## Overview
When creating an assignment, teachers must select an assignment type. Each type has specific requirements, validation rules, and workflows.

---

## Assignment Types

### 1. HOMEWORK 📝
**Purpose**: Regular assignments with file/text submissions

**Flow**:
1. Teacher fills basic info (title, description, instructions, class, due date, max score)
2. System validates required fields
3. Assignment is **published immediately**
4. Students can submit files and/or text
5. Teacher manually grades submissions

**Required Fields**:
- ✅ Title
- ✅ Instructions
- ✅ Class selection
- ✅ Due date
- ✅ Max score

**Optional Fields**:
- Description (recommended but not required)
- Max attempts (default: 1, can be increased)
- Allow file submission (default: true)
- Allow text submission (default: true)

**Validation Rules**:
- Instructions cannot be empty
- Class must be selected
- Due date must be in the future (recommended)

**Backend Behavior**:
```python
# In create_draft endpoint
if assignment_type == 'HOMEWORK':
    # Create draft
    assignment = Assignment.objects.create(...)
    # Immediately publish
    await publish_assignment(assignment.id)
    # Auto-assign to all students in class
```

---

### 2. QUIZ ⏱️
**Purpose**: Timed assessment with auto-graded questions

**Flow**:
1. Teacher fills basic info + **time limit** (REQUIRED)
2. System creates DRAFT assignment
3. Teacher adds questions (MCQ or short answer)
4. Teacher clicks "Publish" when questions are complete
5. System validates questions and publishes
6. Students take quiz within time limit
7. System auto-grades MCQ questions

**Required Fields**:
- ✅ Title
- ✅ Description
- ✅ Instructions
- ✅ Class selection
- ✅ Due date
- ✅ Max score
- ✅ **Time limit (minutes)** - MANDATORY
- ✅ At least 1 question before publishing

**Auto-Set Fields**:
- `is_timed`: true
- `auto_grade`: true
- `max_attempts`: 3 (recommended, can be changed)

**Validation Rules**:
- Time limit must be provided (typical: 15-45 minutes)
- Must have at least 1 question before publishing
- Total question points should equal max_score
- MCQ questions must have at least 2 options
- MCQ questions must have exactly 1 correct answer

**Backend Behavior**:
```python
# Step 1: Create draft
if assignment_type == 'QUIZ':
    assignment = Assignment.objects.create(
        ...,
        time_limit=data['time_limit'],  # REQUIRED
        is_timed=True,
        auto_grade=True,
        status='DRAFT'
    )
    return {'next_step': 'add_questions'}

# Step 2: Add questions
# Teacher adds questions via add-question endpoint

# Step 3: Publish
# Validates questions exist and points match
if assignment.questions.count() == 0:
    return error('Must have questions')
```

---

### 3. EXAM 📋
**Purpose**: Formal timed assessment (single attempt only)

**Flow**:
1. Teacher fills basic info + **time limit** (REQUIRED)
2. System creates DRAFT assignment
3. Teacher adds questions
4. Teacher clicks "Publish"
5. System validates and publishes
6. Students take exam (ONE ATTEMPT ONLY)
7. System auto-grades

**Required Fields**:
- ✅ Title
- ✅ Description
- ✅ Instructions
- ✅ Class selection
- ✅ Due date
- ✅ Max score
- ✅ **Time limit (minutes)** - MANDATORY
- ✅ At least 1 question before publishing

**Auto-Set Fields**:
- `is_timed`: true
- `auto_grade`: true
- `max_attempts`: 1 (LOCKED - cannot be changed)

**Validation Rules**:
- Time limit must be provided (typical: 60-120 minutes)
- Must have at least 1 question before publishing
- Total question points must equal max_score
- Max attempts is ALWAYS 1 (enforced by frontend and backend)

**Backend Behavior**:
```python
if assignment_type == 'EXAM':
    assignment = Assignment.objects.create(
        ...,
        time_limit=data['time_limit'],  # REQUIRED
        is_timed=True,
        auto_grade=True,
        max_attempts=1,  # LOCKED
        status='DRAFT'
    )
```

---

### 4. PROJECT 🎯
**Purpose**: Long-term work with detailed requirements

**Flow**:
1. Teacher fills basic info
2. System creates DRAFT assignment (NOT published)
3. Teacher can add more detailed instructions, rubrics, milestones
4. Teacher manually publishes when ready
5. Students submit project files/documentation
6. Teacher manually grades

**Required Fields**:
- ✅ Title
- ✅ Description
- ✅ Instructions
- ✅ Class selection
- ✅ Due date
- ✅ Max score

**Optional Fields**:
- Max attempts (default: 1)
- Detailed rubric
- Milestone dates
- Required file types

**Validation Rules**:
- Instructions should be detailed (recommended)
- Due date typically weeks in the future

**Backend Behavior**:
```python
if assignment_type == 'PROJECT':
    # Create as DRAFT for teacher to add details
    assignment = Assignment.objects.create(
        ...,
        status='DRAFT'
    )
    # Teacher must manually publish from list
```

---

### 5. EXERCISE ✏️
**Purpose**: Practice work for skill building

**Flow**:
1. Teacher fills basic info
2. System validates and **publishes immediately**
3. Students can submit multiple times
4. Teacher grades or provides feedback

**Required Fields**:
- ✅ Title
- ✅ Description
- ✅ Instructions
- ✅ Class selection
- ✅ Due date
- ✅ Max score

**Optional Fields**:
- Max attempts (default: unlimited or high number)

**Validation Rules**:
- Similar to HOMEWORK
- Typically allows multiple submissions for practice

**Backend Behavior**:
```python
if assignment_type == 'EXERCISE':
    # Create and publish immediately
    assignment = Assignment.objects.create(...)
    await publish_assignment(assignment.id)
```

---

## Frontend Validation Summary

### On Form Submit (Step 1)

```typescript
// Common validation for ALL types
if (!formData.title) return error('Title required')
if (!formData.description) return error('Description required')
if (!formData.instructions) return error('Instructions required')
if (!formData.class_instance) return error('Class required')
if (!formData.due_date) return error('Due date required')
if (!formData.max_score) return error('Max score required')

// Type-specific validation
if (formData.assignment_type === 'QUIZ' || formData.assignment_type === 'EXAM') {
  if (!formData.time_limit) {
    return error(`${formData.assignment_type} requires a time limit`)
  }
}
```

### After Creation

```typescript
// HOMEWORK, EXERCISE → Publish immediately
if (type === 'HOMEWORK' || type === 'EXERCISE') {
  await publishAssignment(assignmentId)
  showSuccess('Published successfully')
  closeDialog()
}

// QUIZ, EXAM → Go to questions step
if (type === 'QUIZ' || type === 'EXAM') {
  setCurrentStep(2) // Show question creator
  showSuccess('Draft created - Add questions to continue')
}

// PROJECT → Save as draft
if (type === 'PROJECT') {
  showSuccess('Project created as draft. Add details and publish from list.')
  closeDialog()
}
```

---

## Backend Validation Summary

### create_draft Endpoint

```python
@action(detail=False, methods=['post'])
def create_draft(self, request):
    data = request.data
    
    # Validate required fields
    required = ['title', 'description', 'instructions', 
                'assignment_type', 'class_instance', 'due_date', 'max_score']
    for field in required:
        if not data.get(field):
            return Response({'error': f'{field} is required'}, status=400)
    
    # Type-specific validation
    if data['assignment_type'] in ['QUIZ', 'EXAM']:
        if not data.get('time_limit'):
            return Response({
                'error': f"{data['assignment_type']} requires time_limit"
            }, status=400)
    
    # Get current term
    current_term = Term.objects.filter(is_current=True).first()
    if not current_term:
        return Response({
            'error': 'No active term. Contact admin.'
        }, status=400)
    
    # Create assignment
    assignment = Assignment.objects.create(
        title=data['title'],
        description=data['description'],
        instructions=data['instructions'],
        assignment_type=data['assignment_type'],
        class_instance_id=data['class_instance'],
        term=current_term,
        created_by=request.user,
        due_date=data['due_date'],
        max_score=data['max_score'],
        max_attempts=data.get('max_attempts', 1),
        time_limit=data.get('time_limit'),
        is_timed=data['assignment_type'] in ['QUIZ', 'EXAM'],
        auto_grade=data['assignment_type'] in ['QUIZ', 'EXAM'],
        status='DRAFT'
    )
    
    return Response({'id': assignment.id})
```

### publish_assignment Endpoint

```python
@action(detail=True, methods=['post'])
def publish_assignment(self, request, pk=None):
    assignment = get_object_or_404(
        Assignment, 
        id=pk, 
        created_by=request.user
    )
    
    # Validate class exists
    if not assignment.class_instance:
        return Response({
            'error': 'Assignment must be assigned to a class'
        }, status=400)
    
    # Type-specific validation
    if assignment.assignment_type in ['QUIZ', 'EXAM']:
        # Must have questions
        if not assignment.questions.exists():
            return Response({
                'error': 'Quiz/Exam must have questions'
            }, status=400)
        
        # Validate points
        total_points = sum(q.points for q in assignment.questions.all())
        if total_points != assignment.max_score:
            return Response({
                'error': f'Question points ({total_points}) must equal max score ({assignment.max_score})'
            }, status=400)
    
    # Publish
    assignment.status = 'PUBLISHED'
    assignment.published_at = timezone.now()
    assignment.save()
    
    # Auto-assign to students
    students = assignment.class_instance.students.all()
    for student in students:
        StudentAssignment.objects.get_or_create(
            assignment=assignment,
            student=student,
            defaults={'status': 'NOT_STARTED'}
        )
    
    return Response({'message': 'Published successfully'})
```

---

## Common Issues & Solutions

### Issue 1: "Time limit required" error
**Cause**: Creating QUIZ/EXAM without time_limit
**Solution**: Frontend must validate and require time_limit field for QUIZ/EXAM types

### Issue 2: "Must have questions" error
**Cause**: Trying to publish QUIZ/EXAM without adding questions
**Solution**: Frontend should disable publish button until questions are added

### Issue 3: "No active term" error
**Cause**: School doesn't have current term set
**Solution**: Admin must set a term as current in admin panel

### Issue 4: Assignment not visible to students
**Cause**: Assignment status is DRAFT
**Solution**: Teacher must publish the assignment

### Issue 5: Points mismatch error
**Cause**: Total question points ≠ max_score
**Solution**: Either adjust question points or max_score to match

---

## Testing Checklist

### HOMEWORK
- [ ] Can create with all required fields
- [ ] Publishes immediately after creation
- [ ] Students can see it in their assignments list
- [ ] Students can submit files
- [ ] Students can submit text
- [ ] Teacher can grade submissions

### QUIZ
- [ ] Cannot create without time_limit
- [ ] Creates as DRAFT initially
- [ ] Can add MCQ questions
- [ ] Can add short answer questions
- [ ] Cannot publish without questions
- [ ] Publishes successfully with valid questions
- [ ] Students see timer during quiz
- [ ] Auto-grades MCQ questions

### EXAM
- [ ] Cannot create without time_limit
- [ ] Max attempts locked to 1
- [ ] Creates as DRAFT
- [ ] Requires questions before publishing
- [ ] Students can only attempt once
- [ ] Timer enforced strictly

### PROJECT
- [ ] Creates as DRAFT
- [ ] Does NOT auto-publish
- [ ] Teacher can add detailed instructions
- [ ] Teacher manually publishes from list
- [ ] Students can submit project files

### EXERCISE
- [ ] Creates and publishes immediately
- [ ] Allows multiple submissions
- [ ] Similar to HOMEWORK workflow

---

## API Endpoints Reference

```
POST /assignments/teacher/create_draft/
  - Creates draft assignment
  - Returns: {id, assignment_type, next_step}

POST /assignments/teacher/{id}/add-question/
  - Adds question to QUIZ/EXAM
  - Returns: {question_id, total_questions, total_points}

POST /assignments/teacher/{id}/publish_assignment/
  - Publishes assignment
  - Validates based on type
  - Auto-assigns to students
  - Returns: {message, status, students_assigned}

GET /assignments/teacher/{id}/questions/
  - Gets questions for assignment
  - Returns: [{id, question_text, question_type, points, options}]
```

---

## Summary Table

| Type | Time Limit | Questions | Auto-Publish | Max Attempts | Auto-Grade |
|------|-----------|-----------|--------------|--------------|------------|
| HOMEWORK | No | No | ✅ Yes | Configurable | No |
| QUIZ | ✅ Required | ✅ Required | No (Draft) | 3 (default) | ✅ Yes |
| EXAM | ✅ Required | ✅ Required | No (Draft) | 1 (locked) | ✅ Yes |
| PROJECT | No | No | No (Draft) | Configurable | No |
| EXERCISE | No | No | ✅ Yes | Unlimited | No |

---

**Last Updated**: 2024
**Version**: 1.0
