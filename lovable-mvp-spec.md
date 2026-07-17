# School Report SaaS - Frontend MVP Specification for Lovable.dev

## Project Overview
A comprehensive school management system with role-based access for Super Admins, School Admins, Teachers, and Students. The backend is a Django REST API with JWT authentication.

## Backend API Base URL
- Development: `http://localhost:8000/api`
- Production: `https://school-report-saas.onrender.com/api`

## Core Features & User Roles

### 1. Authentication System
**Endpoints:**
- `POST /auth/login/` - Regular login (teachers, admins)
- `POST /auth/student-login/` - Student login
- `POST /auth/token/refresh/` - Token refresh
- `POST /auth/logout/` - Logout
- `GET /auth/profile/` - User profile

**User Roles:**
- `SUPER_ADMIN` - Platform administrator
- `SCHOOL_ADMIN` - School administrator  
- `PRINCIPAL` - School principal/headmaster
- `TEACHER` - Subject/class teacher
- `STUDENT` - Student with limited access

### 2. Dashboard Views by Role

#### Super Admin Dashboard
- School management (create, view, manage schools)
- User management across all schools
- System analytics and reports
- Subscription management

#### School Admin/Principal Dashboard  
- School settings and configuration
- Teacher and student management
- Class and subject setup
- Academic year/term management
- Report generation and analytics

#### Teacher Dashboard
- Assignment creation and management
- Student submissions and grading
- Class attendance tracking
- Score entry (CA and Exam scores)
- Student behavior records

#### Student Dashboard
- View assignments and submit work
- Check grades and report cards
- View class announcements
- Track attendance records

### 3. Core Models & Data Structure

#### Schools
```json
{
  "id": 1,
  "name": "Elite Academy",
  "address": "123 Education St",
  "email": "admin@eliteacademy.edu",
  "logo": "school_logos/logo.jpg",
  "current_academic_year": "2024/2025",
  "score_entry_mode": "CLASS_TEACHER",
  "report_template": "STANDARD"
}
```

#### Students
```json
{
  "id": 1,
  "student_id": "STD001",
  "first_name": "John",
  "last_name": "Doe",
  "current_class": {
    "id": 1,
    "level": "BASIC_7",
    "section": "A"
  },
  "username": "std_STD001",
  "password": "abc123"
}
```

#### Assignments
```json
{
  "id": 1,
  "title": "Mathematics Quiz",
  "description": "Basic algebra quiz",
  "assignment_type": "QUIZ",
  "due_date": "2024-12-31T23:59:59Z",
  "max_score": 10,
  "status": "PUBLISHED",
  "is_timed": true,
  "time_limit": 30,
  "questions": [
    {
      "id": 1,
      "question_text": "What is 2 + 2?",
      "question_type": "mcq",
      "options": [
        {"option_text": "3", "is_correct": false},
        {"option_text": "4", "is_correct": true}
      ]
    }
  ]
}
```

### 4. Key API Endpoints

#### Authentication
- `POST /auth/login/` - Login with email/password
- `POST /auth/student-login/` - Student login with username/password
- `GET /auth/profile/` - Get user profile

#### Schools Management
- `GET /schools/` - List schools (admin only)
- `POST /schools/` - Create school
- `GET /schools/{id}/` - School details
- `PUT /schools/{id}/` - Update school

#### Students Management  
- `GET /students/` - List students
- `POST /students/` - Create student
- `GET /students/{id}/` - Student details
- `GET /students/dashboard/` - Student dashboard data

#### Assignments System
- `GET /assignments/teacher/` - Teacher's assignments
- `POST /assignments/teacher/` - Create assignment
- `GET /assignments/student/my-assignments/` - Student assignments
- `POST /assignments/student/{id}/submit/` - Submit assignment

#### Scores & Reports
- `GET /scores/` - Student scores
- `POST /scores/` - Enter scores
- `GET /reports/` - Generate reports
- `POST /reports/generate/` - Generate PDF report

### 5. Frontend Requirements

#### Technology Stack
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React Hook Form for forms
- React Query for data fetching
- Zustand for state management

#### Key Components Needed

1. **Authentication Components**
   - LoginForm (role-based login)
   - StudentLoginForm
   - ProtectedRoute wrapper

2. **Dashboard Components**
   - SuperAdminDashboard
   - SchoolAdminDashboard  
   - TeacherDashboard
   - StudentDashboard

3. **Assignment Components**
   - AssignmentList
   - CreateAssignmentForm
   - AssignmentSubmission
   - QuizInterface (timed)

4. **Student Management**
   - StudentList
   - AddStudentForm
   - StudentProfile

5. **Reports & Analytics**
   - ReportGenerator
   - ScoreEntry
   - AttendanceTracker

#### UI/UX Requirements
- Clean, modern design with school-appropriate colors
- Mobile-responsive layout
- Role-based navigation menus
- Real-time notifications
- Loading states and error handling
- Accessibility compliance (WCAG 2.1)

### 6. Authentication Flow

1. **Login Process:**
   ```javascript
   // Regular users (teachers, admins)
   POST /auth/login/
   {
     "email": "teacher@school.edu",
     "password": "password123"
   }
   
   // Students  
   POST /auth/student-login/
   {
     "username": "std_STD001", 
     "password": "abc123"
   }
   ```

2. **Token Management:**
   - Store JWT tokens in localStorage/sessionStorage
   - Auto-refresh tokens before expiry
   - Redirect to login on token expiry

3. **Role-based Routing:**
   ```javascript
   const routes = {
     SUPER_ADMIN: '/admin/dashboard',
     SCHOOL_ADMIN: '/school/dashboard', 
     TEACHER: '/teacher/dashboard',
     STUDENT: '/student/dashboard'
   }
   ```

### 7. Key Features to Implement

#### Assignment System
- Create assignments with multiple question types
- Timed quizzes with auto-submit
- File upload for project submissions
- Real-time submission tracking
- Automatic grading for MCQ questions

#### Student Portal
- Simple login with username/password
- View available assignments
- Submit assignments with file uploads
- Check grades and feedback
- View class announcements

#### Teacher Tools
- Assignment creation wizard
- Submission management
- Grade entry forms
- Student progress tracking
- Report generation

#### Admin Features
- School setup and configuration
- User management (teachers, students)
- Academic year/term management
- System analytics dashboard

### 8. Data Flow Examples

#### Student Assignment Submission
```javascript
// 1. Get student assignments
GET /assignments/student/my-assignments/

// 2. Start assignment attempt  
POST /assignments/student/{id}/start-attempt/

// 3. Submit answers
POST /assignments/student/{id}/submit/
{
  "answers": [
    {
      "question_id": 1,
      "selected_option_id": 2
    }
  ],
  "submission_files": ["file1.pdf"]
}
```

#### Teacher Grade Entry
```javascript
// 1. Get class students
GET /students/?class_id=1

// 2. Enter CA scores
POST /scores/continuous-assessment/
{
  "student_id": 1,
  "class_subject_id": 1, 
  "term_id": 1,
  "task": 8.5,
  "homework": 9.0,
  "class_test": 7.5
}

// 3. Enter exam scores
POST /scores/exam/
{
  "student_id": 1,
  "class_subject_id": 1,
  "term_id": 1, 
  "score": 42.0
}
```

### 9. Error Handling & Validation

#### API Error Responses
```javascript
{
  "error": "Validation failed",
  "details": {
    "email": ["This field is required"],
    "password": ["Password too short"]
  }
}
```

#### Frontend Error Handling
- Display user-friendly error messages
- Handle network errors gracefully
- Validate forms before submission
- Show loading states during API calls

### 10. Security Considerations

- JWT token-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration for API calls
- Secure file upload handling
- Password strength requirements

### 11. Performance Optimization

- Lazy loading for large lists
- Pagination for student/assignment lists
- Image optimization for school logos
- Caching for frequently accessed data
- Debounced search inputs

### 12. Mobile Responsiveness

- Touch-friendly interface for tablets
- Responsive navigation menu
- Mobile-optimized forms
- Swipe gestures for lists
- Offline capability for basic features

This MVP specification provides a comprehensive foundation for building a modern, scalable school management system frontend that perfectly matches the Django backend architecture.