# Testing the Enhanced GradeBook

## Current Test Data

We have a quiz ready for testing:

**Assignment Details:**
- Name: "test 1"
- Type: QUIZ (HYBRID - has MCQ + Short Answer)
- Assignment ID: 26
- Max Score: 1 point

**Pending Submission:**
- Student: Bonsu Charity (ID: 19)
- Quiz Attempt ID: 4
- Submission ID: quiz_4
- Status: SUBMITTED (waiting for teacher grading)
- Submitted: March 31, 2026 at 07:25

**Question to Grade:**
- Question 1: "what is your name"
- Type: Short Answer
- Points: 1
- Student's Answer: "yaw"
- Current Status: Not graded (needs manual grading)

## How to Test

### Step 1: Start the Servers

**Backend:**
```bash
cd "c:\Users\ADMIN\Desktop\school sasa report\backend"
python manage.py runserver
```

**Frontend:**
```bash
cd "c:\Users\ADMIN\Desktop\school sasa report\frontend"
npm run dev
```

### Step 2: Login as Teacher

1. Open browser to: http://localhost:5173
2. Login with teacher credentials
3. Navigate to: **Teacher Dashboard → GradeBook**

### Step 3: Test the Grading Interface

**Expected Flow:**

1. **Assignment Selection**
   - You should see "test 1" in the dropdown
   - It should show "(1 pending)" or similar

2. **Select Assignment**
   - Click on "test 1"
   - You should see 1 submission listed

3. **View Submission**
   - Student: Bonsu Charity
   - Status: SUBMITTED
   - Should have "Inspect & Grade" button

4. **Click "Inspect & Grade"**
   - Dialog should open with quiz details
   - Should show student info at top
   - Should have 2 tabs: "Questions" and "Summary"

5. **Questions Tab**
   - Should show Question 1
   - Type: Short Answer
   - Points: 1
   - Student's answer: "yaw"
   - Should have input fields for:
     - Points (0 to 1)
     - Teacher comment

6. **Grade the Question**
   - Enter points: 1 (if correct) or 0.5 (partial credit) or 0 (incorrect)
   - Add comment: "Good answer!" or "Needs more detail"

7. **Summary Tab**
   - Should show calculated score based on your grading
   - Should have field for overall feedback
   - Should show max score: 1

8. **Save Grade**
   - Click "Save Grade" button
   - Should show success message
   - Dialog should close
   - Submission status should change to "GRADED"
   - Score should be displayed

### Step 4: Verify Student Can See Results

1. Logout from teacher account
2. Login as student (Bonsu Charity)
3. Go to Student Dashboard → Assignments
4. Check "test 1" assignment
5. Should now show:
   - Status: GRADED
   - Score: (whatever you assigned)
   - Can view feedback

## API Endpoints Being Tested

### 1. Get Pending Assignments
```
GET /assignments/grading/pending-grading/
```
Should return:
```json
{
  "results": [
    {
      "id": 26,
      "title": "test 1",
      "assignment_type": "QUIZ",
      "pending_submissions": 1,
      ...
    }
  ]
}
```

### 2. Get Submissions
```
GET /assignments/grading/26/submissions/
```
Should return:
```json
{
  "results": [
    {
      "id": "quiz_4",
      "student": {
        "id": 19,
        "name": "Bonsu Charity",
        "student_id": "..."
      },
      "status": "submitted",
      ...
    }
  ]
}
```

### 3. Get Quiz Details
```
GET /assignments/grading/quiz_4/quiz-details/
```
Should return:
```json
{
  "attempt": {
    "id": 4,
    "student": {...},
    "assignment": {...}
  },
  "answers": [
    {
      "id": ...,
      "question": {
        "id": ...,
        "text": "what is your name",
        "type": "short_answer",
        "points": 1
      },
      "answer_text": "yaw",
      "is_correct": null,
      "points_earned": 0
    }
  ]
}
```

### 4. Grade Quiz Answer
```
PATCH /assignments/grading/grade-quiz-answer/
Body: {
  "answer_id": ...,
  "points_earned": 1,
  "teacher_comment": "Good answer!"
}
```

### 5. Grade Submission
```
PATCH /assignments/grading/grade-submission/
Body: {
  "submission_id": "quiz_4",
  "score": 1,
  "feedback": "Well done!"
}
```

## Troubleshooting

### Issue: Assignment doesn't appear in dropdown
**Check:**
- Is the backend server running?
- Are you logged in as a teacher?
- Does the teacher have access to this class?

**Debug:**
```bash
cd backend
python test_grading_api.py
```

### Issue: Can't see quiz details
**Check:**
- Browser console for errors (F12)
- Network tab to see API calls
- Backend terminal for errors

### Issue: Save button doesn't work
**Check:**
- Did you enter points for the short answer question?
- Check browser console for errors
- Check backend terminal for errors

## Success Criteria

✅ Teacher can see pending assignments
✅ Teacher can select assignment and see submissions
✅ Teacher can click "Inspect & Grade"
✅ Teacher can see student's short answer
✅ Teacher can enter points and comments
✅ Teacher can see calculated score
✅ Teacher can save grade
✅ Submission status changes to GRADED
✅ Student can see their grade and feedback

## Next Steps After Testing

If everything works:
1. Test with multiple students
2. Test with multiple questions
3. Test with different question types (MCQ + Short Answer)
4. Test editing an existing grade
5. Test with different score values (partial credit)

If something doesn't work:
1. Check browser console for errors
2. Check backend terminal for errors
3. Verify API endpoints are responding
4. Check database for correct data
