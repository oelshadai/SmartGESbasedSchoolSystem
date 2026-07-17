# Assignment Creation and Student Portal Test

## Steps to Test Assignment Creation and Student Portal Integration

### 1. Login as Teacher
- Go to `/login`
- Login with teacher credentials
- Navigate to `/assignments`

### 2. Create a Test Assignment
- Click "Create Assignment" button
- Fill in the form:
  - Title: "Test Math Assignment"
  - Description: "Basic algebra problems"
  - Type: "HOMEWORK"
  - Class: Select your class
  - Due Date: Tomorrow's date
  - Due Time: 23:59

### 3. Verify Assignment Creation
- Check if assignment appears in the assignments list
- Verify assignment status is "PUBLISHED"

### 4. Test Student Portal
- Login as student (use student credentials)
- Go to `/student-portal` (main dashboard)
- Check if assignment appears in "Recent Assignments" section
- Navigate to `/student/assignments`
- Verify assignment appears in the assignments list

### 5. Test Assignment Interaction
- Click "View" or "Start Assignment" button
- Verify navigation to assignment page works

## API Endpoints Used

### Teacher Side:
- `GET /api/assignments/teacher/dashboard/?class_id={class_id}` - Fetch assignments
- `POST /api/assignments/teacher/create_assignment/` - Create assignment

### Student Side:
- `GET /api/assignments/student/dashboard/` - Fetch student assignments
- `GET /api/students/auth/dashboard/` - Student dashboard data

## Expected Behavior

1. **Assignment Creation**: Teacher can create assignments that are automatically published
2. **Auto-Assignment**: When an assignment is published, StudentAssignment records are automatically created for all students in the class
3. **Student Visibility**: Students can see assignments in both dashboard and assignments page
4. **Status Tracking**: Assignment status is properly tracked (NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED)

## Troubleshooting

If assignments don't appear in student portal:
1. Check if assignment status is "PUBLISHED"
2. Verify student is in the correct class
3. Check if StudentAssignment records were created
4. Verify API endpoints are working correctly