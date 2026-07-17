# School Management System - Complete Documentation

**Version:** 2.0  
**Last Updated:** June 6, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Installation & Setup](#installation--setup)
10. [Configuration Guide](#configuration-guide)
11. [Admin Guide](#admin-guide)
12. [User Guides](#user-guides)
13. [SMS Integration](#sms-integration)
14. [Financial Management](#financial-management)
15. [Staff Management](#staff-management)
16. [Messages & Notifications](#messages--notifications)
17. [Reports & Analytics](#reports--analytics)
18. [Troubleshooting](#troubleshooting)
19. [API Integration Examples](#api-integration-examples)
20. [Security Best Practices](#security-best-practices)

---

## System Overview

### Purpose
Comprehensive school management system for handling:
- Student enrollment and records
- Staff and teacher management
- Financial operations (fees, billing, arrears)
- Class and academic year management
- Attendance tracking
- SMS notifications and messaging
- Behavioral records
- Multi-tenant support (multiple schools)

### Key Highlights
- **Multi-Tenant Architecture:** Complete data isolation per school
- **SMS Integration:** Arkesel SMS API for parent communications
- **Real-time Notifications:** Toast-based UI feedback
- **Role-Based Access Control:** Admin, School Admin, Teacher, Student, Parent roles
- **Dark Mode Support:** Complete dark theme with text visibility optimization
- **Responsive Design:** Mobile, tablet, and desktop support
- **Audit Logging:** Signal-based tracking of all data changes

### Target Users
- **School Administrators:** Dashboard, financial management, staff management
- **Teachers:** Student records, attendance, behavior tracking
- **Students:** Dashboard, reports, assignment tracking
- **Parents/Guardians:** Messaging, fee notifications
- **Platform Admins:** Multi-school management, system configuration

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌─────────────────────────────────────────────────────────┐
│  │  Components Layer (shadcn/ui + Tailwind CSS)            │
│  │  - Pages (Dashboard, Management, Reports)               │
│  │  - UI Components (Cards, Forms, Tables, Modals)         │
│  │  - Hooks (useToast, useAuth, useApi)                    │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                              ↕ (HTTP/HTTPS)
┌─────────────────────────────────────────────────────────────┐
│              Backend (Django REST Framework)                 │
│  ┌─────────────────────────────────────────────────────────┐
│  │  API Views Layer (ViewSets, Custom Actions)             │
│  │  - Authentication & Authorization                       │
│  │  - CORS Handling                                        │
│  │  - Request Validation                                   │
│  └─────────────────────────────────────────────────────────┘
│  ┌─────────────────────────────────────────────────────────┐
│  │  Business Logic Layer                                   │
│  │  - Service Classes (SmsService, FinancialService)       │
│  │  - Validation & Sanitization                            │
│  │  - Fee Calculations                                     │
│  └─────────────────────────────────────────────────────────┘
│  ┌─────────────────────────────────────────────────────────┐
│  │  Data Access Layer (Django ORM)                         │
│  │  - Models (Student, Staff, Teacher, etc.)               │
│  │  - Serializers (Data transformation)                    │
│  │  - Signals (Audit logging)                              │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL/SQLite)                    │
│  ┌─────────────────────────────────────────────────────────┐
│  │  Relational Data Storage                                │
│  │  - Schools (Multi-tenancy root)                         │
│  │  - Academic Records                                     │
│  │  - Financial Records                                    │
│  │  - Audit Logs                                           │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│            External Services                                │
│  - Arkesel SMS API (SMS sending)                           │
│  - Email Service (optional)                                │
│  - Cloud Storage (optional)                                │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
projectbackup/
├── frontend/                          # React TypeScript frontend
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── auth/                # Login, registration
│   │   │   ├── dashboards/          # Admin, Teacher, Student dashboards
│   │   │   ├── school/              # School-specific pages
│   │   │   │   ├── FeeManagement.tsx
│   │   │   │   ├── StaffManagement.tsx
│   │   │   │   ├── StudentsManagement.tsx
│   │   │   │   ├── SchoolAdminMessages.tsx
│   │   │   │   ├── ClassesManagement.tsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── api.ts               # API client
│   │   │   ├── secureApiClient.ts   # Secure API with auth
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── use-toast.ts         # Toast notifications
│   │   │   └── ...
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── bold-black-theme.css # Dark mode theme
│   │   │   └── text-visibility-fixes.css
│   │   └── App.tsx
│   ├── package.json
│   └── ...
│
├── backend/                          # Django REST Framework backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/                       # Django settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── schools/                      # School module
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── ...
│   ├── students/                     # Students module
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── validation.py
│   │   └── ...
│   ├── fees/                         # Financial module
│   │   ├── models.py
│   │   ├── views.py                 # Fee calculations, SMS reminders
│   │   └── ...
│   ├── teachers/                     # Teachers module
│   │   ├── models.py
│   │   ├── views.py
│   │   └── ...
│   ├── financial/                    # Staff & financial operations
│   │   ├── models.py
│   │   ├── views.py
│   │   └── ...
│   ├── notifications/                # SMS & messaging
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── services.py              # SmsService
│   │   └── ...
│   ├── auth/                        # Authentication
│   │   ├── models.py
│   │   ├── views.py
│   │   └── ...
│   └── ...
│
├── SYSTEM_DOCUMENTATION.md           # This file
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Core Features

### 1. **Student Management**
- ✅ Student enrollment and registration
- ✅ Class assignment and promotion
- ✅ Student records and profiles
- ✅ Bulk student import from Excel
- ✅ Student credentials management
- ✅ Class-based filtering
- ✅ Active/inactive status tracking

### 2. **Financial Management**
- ✅ Fee structure creation (by fee type)
- ✅ Term bills generation
- ✅ Arrears tracking and reporting
- ✅ Payment recording and reconciliation
- ✅ SMS reminders for unpaid fees
- ✅ **Consolidated arrears messaging** (one SMS per parent with all fee types)
- ✅ Skip already-messaged feature (7-day window)
- ✅ Dry-run/preview mode for SMS

### 3. **Staff Management**
- ✅ Staff member profiles
- ✅ Teacher records
- ✅ **Unified staff view** (Staff + Teachers together)
- ✅ Staff search and filtering
- ✅ Staff status tracking (Active, Inactive, On Leave, Terminated)
- ✅ Permissions management
- ✅ Payroll tracking

### 4. **Attendance & Behavior**
- ✅ Daily attendance tracking
- ✅ Behavioral records
- ✅ Attendance reports
- ✅ Behavior incident logging

### 5. **Academic Management**
- ✅ Academic year configuration
- ✅ Class management
- ✅ Subject assignment
- ✅ Teacher-to-class mapping
- ✅ Student promotion workflow

### 6. **Messaging & Notifications**
- ✅ **SMS sending capability** (admin to parents)
- ✅ **Direct SMS composition** from Messages page
- ✅ **Parent quick-select directory** (searchable, filterable)
- ✅ SMS history with status tracking
- ✅ Inbox for platform announcements
- ✅ SMS log with recipient details
- ✅ Dry-run preview before sending

### 7. **Reporting & Analytics**
- ✅ Financial dashboards
- ✅ Student enrollment reports
- ✅ Arrears summaries
- ✅ Staff count tracking
- ✅ Attendance analytics
- ✅ Custom date range filtering

### 8. **Security & Access Control**
- ✅ Role-based access (Admin, School Admin, Teacher, Student)
- ✅ School-scoped data isolation
- ✅ JWT authentication
- ✅ Audit logging for data changes
- ✅ Permission decorators on API endpoints

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Styling |
| shadcn/ui | Latest | Component library |
| Lucide React | Latest | Icons |
| Sonner | Latest | Toast notifications |
| Axios | Latest | HTTP client |
| Vite | Latest | Build tool |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Django | 4+ | Web framework |
| Django REST Framework | 3.14+ | API framework |
| Django CORS | Latest | CORS handling |
| PostgreSQL/SQLite | Latest | Database |
| Celery | 5+ | Async tasks (optional) |
| Python | 3.9+ | Language |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy |
| Gunicorn | WSGI server |

---

## Database Models

### Core Models

#### School
```python
class School(Model):
    name: str
    code: str (unique)
    email: str
    phone: str
    address: str
    city: str
    country: str
    website: str (optional)
    logo: ImageField (optional)
    is_active: bool
    created_at: DateTime
    updated_at: DateTime
```

#### User (Django Auth Extension)
```python
class User(AbstractUser):
    school: ForeignKey(School)
    role: str (choices: ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
    phone: str
    is_verified: bool
    created_at: DateTime
    updated_at: DateTime
```

#### Student
```python
class Student(Model):
    school: ForeignKey(School)
    student_id: str (unique per school)
    first_name: str
    last_name: str
    other_names: str (optional)
    gender: str (choices: M, F, OTHER)
    date_of_birth: Date
    current_class: ForeignKey(Class)
    guardian_name: str
    guardian_phone: str
    guardian_email: str
    guardian_address: str
    admission_date: Date
    is_active: bool
    user: ForeignKey(User, optional)
    created_at: DateTime
    updated_at: DateTime
```

#### Staff
```python
class Staff(Model):
    school: ForeignKey(School)
    staff_id: str (unique per school)
    first_name: str
    last_name: str
    email: str
    phone: str
    position: str
    department: str
    hire_date: Date
    status: str (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)
    user: ForeignKey(User, optional)
    created_at: DateTime
    updated_at: DateTime
```

#### Teacher
```python
class Teacher(Model):
    school: ForeignKey(School)
    employee_id: str (unique per school)
    first_name: str
    last_name: str
    email: str
    phone_number: str
    qualification: str
    hire_date: Date
    is_active: bool
    assigned_classes: ManyToMany(Class)
    user: ForeignKey(User, optional)
    created_at: DateTime
    updated_at: DateTime
```

#### Class
```python
class Class(Model):
    school: ForeignKey(School)
    name: str (e.g., "BASIC_1", "JSS_2")
    full_name: str (e.g., "Basic 1", "JSS 2")
    class_teacher: ForeignKey(Teacher)
    academic_year: ForeignKey(AcademicYear)
    capacity: int
    is_active: bool
    created_at: DateTime
    updated_at: DateTime
```

#### AcademicYear
```python
class AcademicYear(Model):
    school: ForeignKey(School)
    year: int (e.g., 2024)
    start_date: Date
    end_date: Date
    is_current: bool
    is_active: bool
    created_at: DateTime
    updated_at: DateTime
```

#### TermBill (Fees)
```python
class TermBill(Model):
    school: ForeignKey(School)
    student: ForeignKey(Student)
    fee_type: ForeignKey(FeeType)
    amount: Decimal
    term: str (TERM_1, TERM_2, TERM_3)
    academic_year: ForeignKey(AcademicYear)
    is_paid: bool
    paid_amount: Decimal
    payment_date: Date (optional)
    due_date: Date
    created_at: DateTime
    updated_at: DateTime
```

#### FeeType
```python
class FeeType(Model):
    school: ForeignKey(School)
    name: str (e.g., "Tuition", "Sports", "Computing")
    description: str (optional)
    amount: Decimal
    is_active: bool
    created_at: DateTime
    updated_at: DateTime
```

#### SmsLog
```python
class SmsLog(Model):
    school: ForeignKey(School)
    sms_type: str (fee_reminder, general, announcement)
    status: str (success, partial, failed, pending)
    total_recipients: int
    sent_count: int
    failed_count: int
    no_phone_count: int
    message_preview: str
    details: JSONField (recipient-level status)
    created_at: DateTime
    updated_at: DateTime
```

#### Notification (Platform Messages)
```python
class Notification(Model):
    recipient_user: ForeignKey(User)
    sender: ForeignKey(User)
    subject: str
    body: str
    is_read: bool
    created_at: DateTime
    updated_at: DateTime
```

#### Attendance
```python
class Attendance(Model):
    school: ForeignKey(School)
    student: ForeignKey(Student)
    date: Date
    status: str (PRESENT, ABSENT, LATE, EXCUSED)
    remarks: str (optional)
    recorded_by: ForeignKey(Teacher)
    created_at: DateTime
    updated_at: DateTime
```

#### Behaviour
```python
class Behaviour(Model):
    school: ForeignKey(School)
    student: ForeignKey(Student)
    date: Date
    incident_type: str (e.g., "Positive", "Negative")
    description: str
    severity: str (LOW, MEDIUM, HIGH)
    recorded_by: ForeignKey(Teacher)
    created_at: DateTime
    updated_at: DateTime
```

---

## API Endpoints

### Authentication
```
POST   /auth/register/              - User registration
POST   /auth/login/                 - User login (returns JWT token)
POST   /auth/refresh/               - Refresh JWT token
POST   /auth/logout/                - User logout
GET    /auth/me/                    - Get current user
```

### Students
```
GET    /students/                   - List students (paginated, school-scoped)
POST   /students/                   - Create new student
GET    /students/{id}/              - Get student details
PUT    /students/{id}/              - Update student
DELETE /students/{id}/              - Delete/deactivate student
POST   /students/bulk_upload/       - Bulk upload from Excel
POST   /students/promote_students/  - Promote multiple students
GET    /students/{id}/credentials/  - Get student login credentials
GET    /students/guardians/         - Get unique guardians (for SMS)
```

### Schools
```
GET    /schools/                    - List schools (admin only)
POST   /schools/                    - Create school (admin only)
GET    /schools/{id}/               - Get school details
PUT    /schools/{id}/               - Update school
GET    /schools/financial/staff/    - List staff members
POST   /schools/financial/staff/    - Create staff member
PUT    /schools/financial/staff/{id}/ - Update staff
DELETE /schools/financial/staff/{id}/ - Delete staff
```

### Teachers
```
GET    /schools/teachers/           - List teachers (school-scoped)
POST   /schools/teachers/           - Create teacher
GET    /schools/teachers/{id}/      - Get teacher details
PUT    /schools/teachers/{id}/      - Update teacher
DELETE /schools/teachers/{id}/      - Delete teacher
```

### Classes
```
GET    /schools/classes/            - List classes
POST   /schools/classes/            - Create class
GET    /schools/classes/{id}/       - Get class details
PUT    /schools/classes/{id}/       - Update class
DELETE /schools/classes/{id}/       - Delete class
GET    /schools/classes/{id}/students/ - Get students in class
```

### Academic Year
```
GET    /schools/academic-years/     - List academic years
POST   /schools/academic-years/     - Create academic year
GET    /schools/academic-years/{id}/ - Get details
PUT    /schools/academic-years/{id}/ - Update
DELETE /schools/academic-years/{id}/ - Delete
```

### Fees & Billing
```
GET    /fees/fee-types/             - List fee types
POST   /fees/fee-types/             - Create fee type
GET    /fees/fee-types/{id}/        - Get fee type
PUT    /fees/fee-types/{id}/        - Update fee type
DELETE /fees/fee-types/{id}/        - Delete fee type

GET    /fees/term-bills/            - List bills (filters: status, class, term)
POST   /fees/term-bills/            - Create bill
GET    /fees/term-bills/{id}/       - Get bill details
PUT    /fees/term-bills/{id}/       - Update bill
DELETE /fees/term-bills/{id}/       - Delete bill
POST   /fees/term-bills/bulk_create/ - Bulk create bills

POST   /fees/term-bills/send_fee_reminders/ - Send SMS reminders
  Payload: {
    statuses: ['PENDING', 'PARTIALLY_PAID'],
    term: 'TERM_1',
    class_id: 1 (optional),
    skip_already_messaged: true (optional),
    custom_message: 'text' (optional),
    dry_run: false
  }
```

### SMS & Messaging
```
GET    /notifications/sms-logs/     - List SMS logs
POST   /notifications/sms-logs/send_direct_sms/ - Send direct SMS
  Payload: {
    recipients: [{phone: '0551234567', name: 'Parent Name'}],
    message: 'SMS text',
    dry_run: false
  }

GET    /auth/superadmin/messages/   - List inbox messages
GET    /auth/superadmin/messages/{id}/ - Get message
PATCH  /auth/superadmin/messages/{id}/read/ - Mark as read
```

### Attendance
```
GET    /students/attendance/        - List attendance records
POST   /students/attendance/        - Record attendance
GET    /students/daily-attendance/  - List daily attendance
POST   /students/daily-attendance/  - Bulk create attendance
```

### Behavior
```
GET    /students/behaviour/         - List behavior records
POST   /students/behaviour/         - Create behavior record
```

### Financial Dashboard
```
GET    /schools/financial/dashboard/ - Dashboard metrics
  Returns: {
    total_bills, paid_bills, arrears_bills,
    total_collected, total_arrears,
    total_staff, total_teachers,
    active_students, payment_trend
  }
```

---

## Frontend Components

### Key Pages

#### Dashboard Pages
- **AdminDashboard.tsx** - System-wide admin overview
- **SchoolAdminDashboard.tsx** - School-specific metrics
- **TeacherDashboard.tsx** - Teacher workload overview
- **StudentDashboard.tsx** - Student performance view
- **ParentDashboard.tsx** - Parent fee notifications

#### Management Pages
- **FeeManagement.tsx** - Fee types, bills, SMS reminders
- **StaffManagement.tsx** - Unified staff + teacher management
- **StudentsManagement.tsx** - Student enrollment with class filtering
- **ClassesManagement.tsx** - Class configuration
- **TeachersManagement.tsx** - Teacher profiles and assignments
- **SchoolAdminMessages.tsx** - Inbox, SMS sending, SMS history
- **AcademicYearManagement.tsx** - Academic year configuration

#### Financial Pages
- **FinancialDashboard.tsx** - Revenue analytics, staff count
- **PayrollManagement.tsx** - Staff salary tracking

#### Reporting Pages
- **AttendanceReports.tsx** - Student attendance analytics
- **FeesReport.tsx** - Collections and arrears
- **StudentReports.tsx** - Enrollment and promotion

### Component Architecture

```
App.tsx
├── Layout/
│   ├── Header (navbar, user menu)
│   ├── Sidebar (navigation)
│   └── Footer
├── Pages/
│   ├── Auth/
│   │   ├── Login
│   │   └── Register
│   ├── Dashboards/
│   │   ├── AdminDashboard
│   │   ├── SchoolAdminDashboard
│   │   ├── TeacherDashboard
│   │   └── StudentDashboard
│   └── School/
│       ├── FeeManagement
│       ├── StaffManagement
│       ├── StudentsManagement
│       ├── SchoolAdminMessages
│       └── ...
└── Components/
    ├── Forms/
    │   ├── StudentForm
    │   ├── FeeTypeForm
    │   └── ...
    ├── Tables/
    │   ├── StudentTable
    │   ├── StaffTable
    │   └── ...
    └── Common/
        ├── SearchBar
        ├── Filters
        └── ...
```

### UI Component Library (shadcn/ui)
- Button
- Card (CardContent, CardHeader, CardTitle)
- Dialog (Modal)
- Input, Textarea
- Badge
- Tabs (TabsContent, TabsList, TabsTrigger)
- Table
- Select
- Checkbox
- RadioGroup
- Popover
- Toast (via Sonner)

---

## User Roles & Permissions

### Role Hierarchy

#### 1. Platform Admin
```
Permissions:
- View all schools
- Create/edit/delete schools
- View all users across schools
- System configuration
- Platform-wide reports
- Emergency access to any school

API Access: Full access with admin decorators
Endpoints: /schools/, /auth/admin/*, etc.
```

#### 2. School Admin
```
Permissions:
- Full control within their school
- Student enrollment and management
- Staff and teacher management
- Fee configuration and billing
- SMS sending to parents
- Message inbox management
- Reports and analytics
- Staff salary management
- Class and academic year management

API Access: School-scoped endpoints
Endpoints: /students/, /fees/, /schools/financial/*, /notifications/*
Restriction: Cannot access other schools' data
```

#### 3. Teacher
```
Permissions:
- View students in their classes
- Record attendance
- Record behavior
- View own profile
- Access student dashboards
- View class-level reports

API Access: Limited to own school and assigned classes
Endpoints: /students/ (filtered), /students/attendance/, /students/behaviour/
Restrictions:
- Cannot modify fees
- Cannot access other teachers' data
- Cannot manage staff
```

#### 4. Student
```
Permissions:
- View own profile
- View own academic records
- View own attendance
- View own behavior records
- Access own dashboard
- View assigned classes

API Access: Limited to own records
Endpoints: /auth/me/, /students/{own_id}/, etc.
Restrictions:
- Cannot access other students' data
- Cannot modify any records
- Read-only access
```

#### 5. Parent
```
Permissions:
- View child's records
- Receive SMS notifications
- View fees and payments
- Receive fee reminders

API Access: Limited via parent-to-student relationship
Restrictions:
- Cannot manage records
- Cannot access system portal (SMS only)
```

### Permission Decorators (Backend)

```python
@permission_classes([IsAuthenticated])
def view_func(request):
    # Requires authenticated user
    pass

@permission_classes([IsAuthenticated, IsSchoolAdmin])
def admin_view(request):
    # Requires school admin role
    pass

# Automatic school scoping
queryset = Student.objects.filter(school=user.school)
```

---

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+ or SQLite (development)
- Git
- Docker (optional, for containerization)

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 6. Run migrations
python manage.py makemigrations
python manage.py migrate

# 7. Create superuser
python manage.py createsuperuser

# 8. Load initial data (optional)
python manage.py loaddata initial_data.json

# 9. Run development server
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with backend API URL:
# VITE_API_URL=http://localhost:8000/api

# 4. Run development server
npm run dev

# Frontend will be available at http://localhost:5173
```

### Docker Setup (Optional)

```bash
# Build and run with Docker Compose
cd projectbackup

# Build images
docker-compose build

# Run containers
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Access frontend: http://localhost:3000
# Access backend: http://localhost:8000
```

---

## Configuration Guide

### Environment Variables (Backend)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/school_db
# or for SQLite:
DATABASE_URL=sqlite:///db.sqlite3

# Security
SECRET_KEY=your-secret-key-here
DEBUG=False (set to True for development)
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# SMS Integration (Arkesel)
SMS_API_KEY=your-arkesel-api-key
SMS_SENDER_ID=YourSchoolName
SMS_BALANCE_THRESHOLD=100  # Alert when balance below

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### Environment Variables (Frontend)

```bash
# API Configuration
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_SMS=true
VITE_ENABLE_BULK_UPLOAD=true
VITE_MAX_FILE_SIZE=5242880  # 5MB

# UI Configuration
VITE_ITEMS_PER_PAGE=20
VITE_THEME=dark  # or light
```

### Django Settings Key Configurations

```python
# settings.py

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'school_db',
        'USER': 'user',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# SMS Configuration
SMS_API_KEY = os.getenv('SMS_API_KEY')
SMS_SENDER_ID = os.getenv('SMS_SENDER_ID', 'School')
```

---

## Admin Guide

### Initial System Setup

#### Step 1: Create School Profile
1. Login as Platform Admin
2. Navigate to **Admin > Schools**
3. Click **"New School"**
4. Fill details:
   - School name
   - School code
   - Contact information
   - Address
5. Click **Save**

#### Step 2: Create Academic Year
1. Navigate to **Academic Years** (School Admin view)
2. Click **"New Academic Year"**
3. Enter:
   - Year (e.g., 2024)
   - Start date (e.g., Sept 1, 2024)
   - End date (e.g., June 30, 2025)
   - Mark as "Current"
4. Click **Save**

#### Step 3: Create Classes
1. Navigate to **Classes Management**
2. Click **"New Class"**
3. Enter:
   - Class name (e.g., "BASIC_1")
   - Select class teacher
   - Set capacity
   - Select academic year
4. Click **Save**

#### Step 4: Configure Fee Types
1. Navigate to **Fee Management > Fee Types**
2. Click **"New Fee Type"**
3. Enter:
   - Fee name (e.g., "Tuition", "Sports", "Computing")
   - Amount
   - Description (optional)
4. Click **Save**

#### Step 5: Enroll Students
**Option A: Individual Enrollment**
1. Navigate to **Students Management**
2. Click **"Add Student"**
3. Fill student details:
   - Student ID
   - Name
   - Date of birth
   - Gender
   - Guardian information
   - Class assignment
4. Click **Save**

**Option B: Bulk Upload**
1. Navigate to **Students Management**
2. Click **"Bulk Upload"**
3. Select Excel file with columns:
   - student_id, first_name, last_name, other_names, gender, date_of_birth, current_class_id, guardian_name, guardian_phone, guardian_email, guardian_address, admission_date
4. Click **Upload**

#### Step 6: Configure SMS Integration
1. Navigate to **SMS Settings**
2. Enter Arkesel API Key
3. Set SMS Sender ID
4. Configure balance threshold for alerts
5. Click **Save**

### Daily Operations

#### Sending Fee Reminders
1. Navigate to **Fee Management**
2. Click **"Send Fee Reminders"**
3. Configure filters:
   - Arrears status: "Pending" or "Partially Paid"
   - Term: Select term
   - Class: (optional, leave blank for all)
   - Skip already-messaged: Toggle ON to exclude parents messaged in last 7 days
4. Click **"Preview"** (dry-run) to see SMS before sending
5. Review message format:
   ```
   "John Doe (Computing: GH₵500, Sports: GH₵300) | Jane Doe (Tuition: GH₵1000)"
   ```
6. Click **"Send SMS"** to send actual messages

#### Sending Direct SMS
1. Navigate to **Messages > Send SMS**
2. Click **"Show Parent Directory"** to search existing parents
3. Enter search term (name or phone)
4. Click **"+ Add"** to add parent to recipients
5. OR manually enter phone numbers and names
6. Type message (max 160 chars per SMS)
7. Click **"Preview"** to see formatted message
8. Click **"Send SMS"**
9. View status in **"SMS History"** tab

#### Recording Attendance
1. Navigate to **Attendance**
2. Select class and date
3. Check off present students
4. Mark absences and late arrivals
5. Click **Save**

#### Viewing Financial Reports
1. Navigate to **Financial Dashboard**
2. View metrics:
   - Total bills generated
   - Amount paid
   - Arrears amount
   - Payment trend chart
   - Staff count (Staff + Teachers)
3. Use date filters for custom ranges

### Troubleshooting Admin Issues

#### SMS Not Sending
**Symptom:** "Failed to send SMS" error
**Solutions:**
1. Verify Arkesel API key in SMS Settings
2. Check SMS balance (minimum 1 credit required)
3. Verify guardian phone numbers are valid (format: +233xxxxx)
4. Check network connectivity
5. Review SMS log for detailed error

#### Student Records Missing
**Symptom:** Student enrolled but not visible
**Solutions:**
1. Check if student is marked active (not deactivated)
2. Verify student is assigned to current academic year
3. Check school filter (ensure correct school selected)
4. Clear browser cache and refresh

#### Fee Bills Not Generating
**Symptom:** Bills status showing 0
**Solutions:**
1. Verify fee types are created and active
2. Ensure students are enrolled in classes
3. Check academic year is marked as current
4. Review term configuration
5. Run bulk bill generation from Fee Management

---

## User Guides

### For School Administrators

#### Creating Student Records
1. Go to **School > Students Management**
2. Click **"Add Student"**
3. Fill in all required fields (marked with *)
4. Select appropriate class and academic year
5. Enter complete guardian information
6. Click **"Save"**

#### Managing Staff
1. Go to **Staff Management**
2. **Add Staff:**
   - Click **"Add Staff"**
   - Enter staff details
   - Select position and department
   - Click **"Save"**
3. **Search/Filter Staff:**
   - Use search box for name, email, or ID
   - Use type buttons to filter Staff vs Teachers
   - Click to view individual records
4. **Edit Staff:**
   - Click **Edit** icon
   - Update information
   - Click **"Save"**
5. **Remove Staff:**
   - Click **Delete** icon
   - Confirm deletion

#### Sending Messages to Parents
1. Go to **Messages > Send SMS**
2. **Add Recipients:**
   - Option A: Click **"Show Parent Directory"** to search
   - Option B: Manually enter phone and name
3. Type message (see character count)
4. Click **"Preview"** to verify format
5. Click **"Send SMS"**
6. Check **"SMS History"** for delivery status

#### Recording Fees
1. Go to **Fee Management**
2. **Create Bills:**
   - Select term and class
   - Click **"Generate Bills"**
   - Review and confirm
3. **Mark as Paid:**
   - Locate bill in list
   - Click **"Mark Paid"**
   - Enter amount paid
   - Click **"Save"**
4. **View Arrears:**
   - Filter by status "Pending" or "Partially Paid"
   - See total arrears amount

#### Viewing Reports
1. Go to **Financial Dashboard**
2. View key metrics:
   - Total collected amount
   - Outstanding arrears
   - Payment trend
3. Use date range filter for custom periods
4. Export reports if needed

### For Teachers

#### Checking Student Records
1. Go to **Dashboard > My Classes**
2. Select a class
3. View student list with:
   - Names and IDs
   - Contact information
   - Current grades (if available)

#### Recording Attendance
1. Go to **Attendance**
2. Select class and date
3. Check boxes for present students
4. Mark absences/late arrivals
5. Click **"Save Attendance"**
6. View attendance history on dashboard

#### Logging Behavior Incidents
1. Go to **Behavior Records**
2. Click **"New Incident"**
3. Select student
4. Choose incident type (positive/negative)
5. Enter description and severity
6. Click **"Save"**

#### Viewing Performance Reports
1. Go to **Reports > Student Performance**
2. Select class and term
3. View:
   - Attendance summary
   - Behavior incidents
   - Assignment submissions (if enabled)

### For Students

#### Logging In
1. Go to student portal
2. Enter student ID
3. Enter password (provided by admin)
4. Click **"Login"**

#### Viewing Dashboard
On login, see:
- Current class
- Academic performance
- Attendance record
- Upcoming assignments
- School announcements

#### Viewing Records
1. Go to **My Records**
2. View:
   - Attendance history
   - Behavior log
   - Grades (if available)
   - Enrollment status

#### Contacting School
1. Go to **Messages**
2. View inbox for school announcements
3. Submit inquiries (if feature enabled)

### For Parents

#### Receiving SMS Notifications
You will receive SMS messages for:
- Fee due dates
- Fee payment reminders
- Attendance summaries
- General announcements

**Message Format:**
```
"School Name: Your child [Student Name] has 
unpaid fees for Computing (GH₵500.00), 
Sports (GH₵300.00). Please settle by [DATE]."
```

#### Viewing Fee Notifications
1. Check SMS inbox for fee notifications
2. Reply with questions to provided phone number
3. Contact school admin directly for payment options

#### Updating Contact Information
- Inform school of any phone number changes
- Provide alternate contact if primary not reachable

---

## SMS Integration

### Arkesel SMS Service Configuration

#### Prerequisites
1. Active Arkesel account (https://arkesel.com)
2. API key from dashboard
3. SMS credits available
4. Sender ID registered

#### Setup Steps

**Step 1: Get API Credentials**
1. Login to Arkesel dashboard
2. Go to Settings > API Keys
3. Copy your API Key
4. Go to Sender ID > Add New
5. Create sender ID (e.g., "SchoolName")

**Step 2: Configure in System**
1. Go to **School Admin > SMS Settings**
2. Paste API Key
3. Enter Sender ID
4. Set balance threshold (alerts when below)
5. Click **Save**

**Step 3: Verify Balance**
1. Go to **Dashboard**
2. Check SMS balance widget
3. Purchase credits if needed

#### SMS Features

**Dry-Run/Preview Mode**
```python
# Backend always validates before sending
POST /fees/term-bills/send_fee_reminders/
{
    "dry_run": true,  # Set to true for preview
    "statuses": ["PENDING"],
    "term": "TERM_1"
}
# Returns: Message preview without sending
```

**Message Consolidation**
- One SMS per parent (not per student/fee type)
- All children's fees in single message
- Format: "John Doe (Fee Type: Amount) | Jane Doe (Fee Type: Amount)"

**Skip Already-Messaged**
- Automatically excludes parents messaged in last 7 days
- Prevents duplicate reminders
- Toggle in UI: **"Skip already-messaged parents"**

**SMS Log Tracking**
- Each SMS recorded with:
  - Recipient list
  - Status (success/failed/partial)
  - Timestamp
  - Message content
- Accessible from **Messages > SMS History**

#### SMS Cost Calculation

```python
# Cost = Number of SMSs sent × Credits per SMS

# Example:
# - 50 messages sent
# - 0.1 credits per message
# = 5 credits used

# Check SMS log for actual costs
```

#### Troubleshooting SMS Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid API Key" | Wrong/expired key | Verify in Arkesel dashboard |
| "Insufficient balance" | Out of credits | Purchase more credits |
| "Invalid phone number" | Bad format | Ensure +233xxxxx format |
| "Throttled" | Too many requests | Wait before resending |
| "Message too long" | >160 chars (1 SMS) or >306 (2 SMS) | Shorten message |

---

## Financial Management

### Fee Structure Setup

#### Creating Fee Types

1. **Navigate to:** School Admin > Fee Management > Fee Types
2. **Click:** "New Fee Type"
3. **Enter:**
   - Name (e.g., "Tuition", "Sports", "Computing")
   - Amount (e.g., 500.00)
   - Description (optional)
   - Mark as active
4. **Save**

**Common Fee Types:**
- Tuition
- Sports
- Computing/Technology
- Science Lab
- Examination
- Uniform
- Transportation
- Lunch

#### Generating Bills

**Bulk Bill Generation:**
1. Go to **Fee Management > Generate Bills**
2. Select:
   - Academic year
   - Term (TERM_1, TERM_2, TERM_3)
   - Classes (select all or specific)
   - Fee types (select all or specific)
3. Click **"Preview"** to see bills before generating
4. Review count and amounts
5. Click **"Generate Bills"**

**System Actions:**
- Creates TermBill record for each student × fee type
- Marks as unpaid initially
- Sets default due date (e.g., 7 days from term start)

#### Recording Payments

**Individual Payment:**
1. Go to **Fee Management > All Bills**
2. Find student/fee record
3. Click **"Mark Paid"**
4. Enter:
   - Amount received
   - Payment date
   - Payment method (optional)
5. Click **"Save"**
- Remaining balance auto-calculated
- Status updates to "Paid" or "Partially Paid"

**Bulk Payment Import:**
1. Go to **Fee Management > Import Payments**
2. Upload CSV/Excel with columns:
   - student_id, amount, payment_date, reference
3. System processes and updates bills
4. View results and any errors

#### Arrears Tracking

**View Arrears:**
1. Go to **Fee Management**
2. Filter status: "Pending" or "Partially Paid"
3. View:
   - Student name and class
   - Fee type and amount
   - Days overdue
   - Total by student/class
4. Export for records

**Send Reminders:**
1. Select filters (class, term, status)
2. Toggle **"Skip already-messaged"** (optional)
3. Click **"Preview"** SMS
4. Review consolidated message format
5. Click **"Send Reminders"**
6. Check SMS History for confirmation

### Financial Reports

#### Dashboard Metrics
- **Total Bills:** Sum of all bills
- **Paid Amount:** Sum of paid_amount
- **Arrears Amount:** Sum of pending/partial amounts
- **Payment Trend:** Line chart of daily collections
- **Collection Rate:** Percentage of bills paid
- **Staff Count:** Total Staff + Teachers (for payroll estimation)

#### Generating Reports

**Arrears Report:**
```
Class | Student | Fee Type | Amount | Days Overdue | Status
BS_1  | John    | Tuition  | 500    | 25          | PENDING
BS_1  | Mary    | Sports   | 200    | 10          | PARTIALLY_PAID
```

**Collection Report:**
```
Date | Amount Collected | Number of Payments | Payment Method
2024-01-15 | GH₵5,200 | 15 | Cash, Bank Transfer
2024-01-16 | GH₵3,800 | 12 | Cash, Mobile Money
```

**Class Revenue Report:**
```
Class | Total Bills | Collected | Arrears | % Paid
BS_1  | 50,000      | 45,000    | 5,000   | 90%
BS_2  | 50,000      | 38,000    | 12,000  | 76%
```

---

## Staff Management

### Staff Types

#### 1. Regular Staff
- Support staff (non-teaching)
- Administrative positions
- Maintenance, security, etc.
- Managed in: **Staff Management**
- Editable from UI

#### 2. Teachers
- Instructional staff
- Class assignments
- Taught subjects
- Managed in: **Staff Management** (unified view) or **Teachers Management** (detailed)
- Editing: Limited from Staff Management (use Teachers Management for full edit)

### Staff Operations

#### Adding Staff Member

**From Staff Management Page:**
1. Click **"Add Staff"**
2. Fill form:
   - Staff ID (unique)
   - Name
   - Email
   - Phone
   - Position
   - Department
   - Hire Date
   - Status (Active/Inactive/On Leave/Terminated)
3. Click **"Save"**

#### Updating Staff

**Edit Existing:**
1. Click **Edit** icon (staff only, not teachers)
2. Modify fields
3. Click **"Save"**

**For Teachers:**
- Go to **Teachers Management** for detailed editing
- Or from Staff Management (shows but can't edit details)

#### Searching & Filtering

**Search By:**
- Full name
- Email address
- Staff/Employee ID

**Filter By:**
- Type (All, Staff, Teachers)
- Status (Active, Inactive, etc.)

**Example Searches:**
- Search: "John" → Shows all staff with "John" in name
- Filter: "Teachers" → Shows only teacher records
- Search: "0551234567" → Shows by phone number

#### Viewing Staff Count

**On Dashboard:**
- Staff count shows: Staff + Teachers (unified)
- Breakdown by type available on Staff Management page

#### Removing Staff

**Deactivate:**
1. Find staff record
2. Click **Delete** icon
3. Confirm action
4. Status updates to inactive (soft delete)

**Reactivate:**
1. Staff record remains in system
2. Admin can manually update status to Active

### Payroll Integration

**Accessing Payroll:**
1. Go to **Financial > Payroll Management**
2. Select academic period
3. View:
   - Staff list with salaries
   - Payment status
   - Deductions
4. Mark as paid when processed

**Salary Management:**
1. Configure salary per staff member
2. Set payment frequency (monthly, etc.)
3. Track payments in payroll record

---

## Messages & Notifications

### Messaging System

#### Components

**1. Inbox (Platform Messages)**
- Messages from platform/admin
- Announcement broadcasts
- System notifications
- Accessed by: School Admin, Students

**2. SMS Sending**
- Direct SMS to parents
- Bulk send capability
- Character counter
- Preview/dry-run mode
- Accessed by: School Admin only

**3. SMS History**
- Log of all sent SMSs
- Status tracking (success/failed/partial)
- Expandable recipient details
- Timestamps and message content

#### Sending SMS

**Workflow:**
1. Navigate to **Messages > Send SMS**
2. **Add Recipients:**
   - Click **"Show Parent Directory"**
   - Search parent by name or phone
   - Click **"+ Add"** to add to recipients
   - Or manually enter phone and name
3. **Compose Message:**
   - Type SMS text
   - See character count (160 per SMS segment)
4. **Preview:**
   - Click **"Preview"**
   - Verify recipients and message
   - Shows SMS count needed
5. **Send or Dry-Run:**
   - Click **"Send SMS"** to send
   - Or use dry-run to test without sending
6. **Check Status:**
   - Go to **SMS History**
   - Find your message
   - Expand to see per-recipient status

#### Parent Quick-Select Feature

**Benefits:**
- No manual phone number entry
- Auto-populated guardian names
- Search by name or phone
- Prevents duplicate recipients
- One-click add to message

**How It Works:**
1. System automatically creates guardian list from student registrations
2. Deduplicates parents (one parent = one entry even if multiple kids)
3. Sorted alphabetically by name
4. Search filters in real-time
5. Click to add to current recipient list

**Example:**
```
Search: "Mary"
Results:
- Mary Oduro (0551234567) [+ Add]
- Mary Antwi (0552345678) [+ Add]
- Mary Owusu (0553456789) [+ Add]

Click [+ Add] → Mary's info populates in recipients
```

#### SMS History

**Viewing History:**
1. Go to **Messages > SMS History**
2. View list of all sent SMSs with:
   - Date sent
   - Recipient count
   - Status (Success, Partial, Failed)
   - Message preview
3. Click to expand:
   - Full message content
   - Per-recipient status
   - Failed recipient reasons
   - Timestamps

**Status Meanings:**
- **Success:** All recipients received
- **Partial:** Some recipients failed
- **Failed:** No recipients received
- **Pending:** Being processed

---

## Reports & Analytics

### Available Reports

#### 1. Financial Reports
**Location:** Financial Dashboard / Reports

**Metrics:**
- Total bills generated
- Total amount collected
- Arrears summary
- Payment trend (line chart)
- Class-wise breakdown
- Monthly collections

**Filters:**
- Date range
- Academic year
- Term
- Class
- Fee type

#### 2. Student Reports
**Location:** Reports > Students

**Data:**
- Enrollment by class
- Enrollment by gender
- Active vs inactive
- Promotions and demotions
- Class-wise headcount

**Formats:**
- Table view
- Charts and graphs
- Export to PDF/Excel

#### 3. Attendance Reports
**Location:** Attendance > Analytics

**Metrics:**
- Attendance rate by class
- Attendance by student
- Absence patterns
- Late arrival trends
- Monthly trends

**Insights:**
- Students with low attendance
- Trend analysis
- Comparison across classes

#### 4. Staff Reports
**Location:** Financial Dashboard

**Data:**
- Total staff count (Staff + Teachers)
- Staff by department
- Staff status distribution
- New hires
- Departures

#### 5. Custom Reports
**Creating Custom Report:**
1. Go to **Reports > Custom**
2. Select:
   - Report type
   - Date range
   - Filters
   - Fields to include
3. Click **"Generate"**
4. Export if needed

### Exporting Reports

**Format Options:**
- PDF (for printing)
- Excel (for analysis)
- CSV (for import elsewhere)

**Export Steps:**
1. Generate report
2. Click **"Export"**
3. Choose format
4. Download file

---

## Troubleshooting

### Common Issues & Solutions

#### Authentication Issues

**Problem: "Invalid credentials" error**
```
Solution:
1. Verify email/username is correct
2. Reset password if forgotten
3. Check caps lock on password
4. Clear browser cookies
5. Try incognito/private browsing
6. Contact admin if persists
```

**Problem: "Session expired" error**
```
Solution:
1. Refresh page (F5)
2. Login again
3. Increase session timeout in settings
4. Check internet connection
```

#### Data Access Issues

**Problem: "You don't have permission" error**
```
Solution:
1. Verify your role (admin, teacher, student)
2. Check if assigned to correct school/class
3. Verify account is active (not deactivated)
4. Contact school admin for permission grant
```

**Problem: "Data not showing" in lists**
```
Solution:
1. Clear filters (reset to show all)
2. Check search query is empty
3. Verify school/class selection
4. Check date filters
5. Clear browser cache
6. Refresh page
7. Check if records are marked inactive
```

#### SMS Issues

**Problem: SMS not sending**
```
Solution:
1. Check SMS balance (Settings > SMS)
2. Verify API key is correct
3. Test with dry-run first
4. Verify phone numbers format (+233xxxxx)
5. Check network connectivity
6. Review SMS log for error details
7. Contact support if error persists
```

**Problem: SMS going to wrong people**
```
Solution:
1. Verify recipient list before sending
2. Use preview mode
3. Double-check phone numbers
4. Confirm not using wrong filter
5. Review parent directory search results
```

#### File Upload Issues

**Problem: "File too large" error**
```
Solution:
1. Check file size (max 5MB)
2. Compress if needed
3. Split large files
4. Verify format (Excel/CSV)
```

**Problem: "Invalid file format" error**
```
Solution:
1. Ensure file is correct type (.xlsx, .csv, etc.)
2. Check column headers match expected
3. Verify data types (dates, numbers, etc.)
4. Remove special characters if causing issue
5. Try downloading template and using it
```

#### Performance Issues

**Problem: Page loading slowly**
```
Solution:
1. Clear browser cache
2. Disable extensions
3. Check internet speed
4. Reduce filters/search scope
5. Try different browser
6. Check server status
7. Contact support if persistent
```

**Problem: Form not submitting**
```
Solution:
1. Check all required fields (marked with *)
2. Verify data format (emails, dates, numbers)
3. Check browser console for errors (F12)
4. Try refreshing page
5. Try different browser
6. Clear browser cache
```

### Database Issues

**Problem: "Database connection error"**
```
Solution:
1. Verify database is running
2. Check database credentials in .env
3. Verify network connection
4. Check database server status
5. Review backend logs
6. Restart database service
```

**Problem: "Migration failed"**
```
Solution:
1. Check migration files for syntax errors
2. Run: python manage.py showmigrations
3. Try rolling back: python manage.py migrate [app] 0001
4. Create new migration: python manage.py makemigrations
5. Apply: python manage.py migrate
6. Review Django docs for specific error
```

### API Issues

**Problem: "API endpoint not found" (404)**
```
Solution:
1. Verify endpoint URL is correct
2. Check API routes in urls.py
3. Verify app is included in INSTALLED_APPS
4. Ensure viewset is properly registered
5. Test with Postman/curl
```

**Problem: "Unexpected response format"**
```
Solution:
1. Check API documentation for expected format
2. Verify response code (200, 201, 400, 500)
3. Check JSON structure
4. Review frontend code using response
5. Use browser dev tools (F12) to inspect
```

### UI Issues

**Problem: Text not visible (too light)**
```
Solution:
1. Check dark mode is correctly applied
2. Verify CSS files loaded (check DevTools)
3. Clear browser cache
4. Verify bold-black-theme.css is imported
5. Check text-visibility-fixes.css applied
```

**Problem: Buttons not clickable**
```
Solution:
1. Check button is not disabled
2. Verify not covered by overlay
3. Check z-index in CSS
4. Try scrolling into view
5. Check browser console for JS errors
```

**Problem: Layout broken on mobile**
```
Solution:
1. Check responsive classes used (sm:, md:, lg:)
2. Verify Tailwind CSS not conflicting
3. Test on different screen sizes
4. Check for fixed widths preventing responsiveness
5. Review media queries
```

---

## API Integration Examples

### Authentication Flow

**Step 1: Register User**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe",
    "role": "SCHOOL_ADMIN",
    "school_id": 1
  }'

# Response:
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "SCHOOL_ADMIN",
  "school": 1
}
```

**Step 2: Login & Get Token**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Response:
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Step 3: Use Token in Requests**
```bash
curl -X GET http://localhost:8000/api/students/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response:
{
  "count": 150,
  "next": "http://localhost:8000/api/students/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "student_id": "STD001",
      "first_name": "Mary",
      "last_name": "Oduro",
      "current_class": 1,
      "guardian_phone": "0551234567"
    },
    ...
  ]
}
```

### Creating Students

```bash
curl -X POST http://localhost:8000/api/students/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "student_id": "STD150",
    "first_name": "Ama",
    "last_name": "Ayisi",
    "gender": "F",
    "date_of_birth": "2015-03-15",
    "current_class": 1,
    "guardian_name": "Mrs. Ayisi",
    "guardian_phone": "0552345678",
    "guardian_email": "ama.parent@email.com",
    "admission_date": "2024-09-01"
  }'

# Response:
{
  "id": 150,
  "student_id": "STD150",
  "first_name": "Ama",
  "last_name": "Ayisi",
  "current_class": 1,
  "guardian_name": "Mrs. Ayisi",
  "guardian_phone": "0552345678",
  "is_active": true,
  "created_at": "2024-06-06T10:30:00Z"
}
```

### Sending Fee Reminders (SMS)

```bash
curl -X POST http://localhost:8000/api/fees/term-bills/send_fee_reminders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "statuses": ["PENDING", "PARTIALLY_PAID"],
    "term": "TERM_1",
    "class_id": null,
    "skip_already_messaged": true,
    "dry_run": false
  }'

# Response (Dry-run = true):
{
  "dry_run": true,
  "total_parents": 45,
  "preview_messages": [
    {
      "phone": "0551234567",
      "name": "John Doe",
      "message": "Dear John Doe, Student: Mary Doe has the following arrears - Computing: GH₵500.00, Sports: GH₵300.00. Please settle to avoid penalties."
    },
    ...
  ]
}

# Response (Dry-run = false):
{
  "sent": 45,
  "failed": 0,
  "would_send": 0,
  "total_parents": 45,
  "sms_log_id": 12345
}
```

### Direct SMS Sending

```bash
curl -X POST http://localhost:8000/api/notifications/sms-logs/send_direct_sms/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "recipients": [
      {
        "phone": "0551234567",
        "name": "John Doe"
      },
      {
        "phone": "0552345678",
        "name": "Jane Ayisi"
      }
    ],
    "message": "Welcome to our school system. This is a test message.",
    "dry_run": false
  }'

# Response:
{
  "sent": 2,
  "failed": 0,
  "would_send": 0,
  "recipient_status": {
    "0551234567": {
      "status": "success",
      "name": "John Doe"
    },
    "0552345678": {
      "status": "success",
      "name": "Jane Ayisi"
    }
  }
}
```

### Getting Guardian List

```bash
curl -X GET http://localhost:8000/api/students/guardians/ \
  -H "Authorization: Bearer [token]"

# Response:
[
  {
    "phone": "0551234567",
    "name": "John Doe"
  },
  {
    "phone": "0552345678",
    "name": "Jane Ayisi"
  },
  {
    "phone": "0553456789",
    "name": "Mary Oduro"
  }
]
```

### Generating Fee Bills

```bash
curl -X POST http://localhost:8000/api/fees/term-bills/bulk_create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "academic_year": 1,
    "term": "TERM_1",
    "fee_types": [1, 2, 3],
    "class_ids": [1, 2, 3],
    "due_date": "2024-09-30"
  }'

# Response:
{
  "created": 150,
  "total_amount": 75000.00,
  "message": "Successfully created 150 bills totaling GH₵75,000.00"
}
```

---

## Security Best Practices

### Authentication

**1. Strong Passwords**
- Enforce minimum 8 characters
- Require mix of uppercase, lowercase, numbers, symbols
- Prevent reuse of previous passwords
- Force password reset every 90 days

**2. JWT Token Security**
- Use HS256 algorithm (symmetric) or RS256 (asymmetric)
- Set appropriate expiration (24 hours default)
- Refresh tokens should have longer expiration (7 days)
- Store tokens securely in httpOnly cookies (frontend)

**3. Account Lockout**
- Lock after 5 failed login attempts
- Lockout duration: 30 minutes
- Notify user of lockout attempt
- Require admin intervention if persistent

**4. Session Management**
- Invalidate session on logout
- Prevent session fixation attacks
- Use secure, httpOnly cookies
- Implement CSRF protection

### Data Protection

**1. Encryption**
- Encrypt sensitive data at rest:
  - Guardian phone numbers
  - Student email addresses
  - Financial information
  - Payment records
- Use field-level encryption (Django Cryptography)

**2. HTTPS/TLS**
- Force HTTPS on all endpoints
- Use TLS 1.2+
- Valid SSL certificate
- Redirect HTTP to HTTPS

**3. API Security**
- Use rate limiting:
  - 100 requests per minute per user
  - 10,000 per day per user
- Validate all inputs (SQL injection, XSS prevention)
- Sanitize output
- Use CORS with whitelist

### Access Control

**1. Role-Based Access Control (RBAC)**
- Define roles: Admin, School Admin, Teacher, Student
- Assign permissions to roles
- Verify permissions on every API call
- Log access attempts

**2. School Isolation**
- Filter all queries by user.school
- Prevent cross-school data access
- Verify school_id in request body
- Audit cross-school access attempts

**3. Field-Level Permissions**
- Teacher: Can only see own school/class data
- Student: Can only see own records
- Admin: Full access within permission scope

### Logging & Monitoring

**1. Audit Logging**
- Log all data modifications (create, update, delete)
- Include user, timestamp, before/after values
- Store in database for long-term retention
- Signal-based automatic logging

**2. Security Logging**
- Failed login attempts
- Permission denied errors
- API errors (500, 403, 404)
- Suspicious patterns (many failed attempts, etc.)

**3. Alerts**
- Alert on multiple failed logins
- Alert on data export/bulk actions
- Alert on permission changes
- Alert on schema changes (migrations)

### Incident Response

**1. Breach Detection**
- Monitor for unusual patterns:
  - Bulk data exports
  - Unusual API usage
  - Access from new locations
  - Time-of-day anomalies

**2. Incident Response Plan**
- Immediate: Disable compromised accounts
- Short-term: Audit affected data
- Medium-term: Notify affected users
- Long-term: Implement preventive measures

**3. Data Backup**
- Daily automated backups
- 30-day retention
- Test restore procedures
- Encrypt backup storage

### Compliance

**1. GDPR (if applicable)**
- Right to access personal data
- Right to be forgotten (data deletion)
- Data portability (export data)
- Consent tracking for processing

**2. Data Protection**
- Privacy policy
- Terms of service
- Data processing agreement
- User consent for data collection

**3. Regulatory Compliance**
- PCI DSS if handling card payments
- HIPAA if health data involved
- Education privacy laws (varies by region)
- Financial regulatory requirements

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor system performance
- Check error logs
- Verify SMS service connectivity
- Confirm database backups

**Weekly:**
- Review security logs
- Check user accounts (inactive users)
- Verify data integrity
- Test backup restoration

**Monthly:**
- Performance optimization
- Database maintenance (vacuum, analyze)
- Security patching
- Feature updates

**Quarterly:**
- Compliance audit
- Security audit
- Data retention review
- Disaster recovery drill

### Updating the System

**Application Updates:**
```bash
# Backend
cd backend
git pull
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic

# Frontend
cd frontend
git pull
npm install
npm run build
```

**Database Migrations:**
```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate

# Show status
python manage.py showmigrations
```

### Contact & Support

**For Technical Issues:**
- Check troubleshooting guide above
- Review system logs
- Contact development team
- Submit bug report with:
  - Description of issue
  - Steps to reproduce
  - Screenshots
  - Error messages
  - System info (browser, OS, version)

**For Feature Requests:**
- Submit through admin interface
- Include use case
- Describe expected behavior
- Suggest implementation if possible

---

**Document Version:** 2.0  
**Last Updated:** June 6, 2026  
**Next Review:** September 6, 2026

For the most current version and updates, refer to: `SYSTEM_DOCUMENTATION.md`
