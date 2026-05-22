# Smart GES-based School Management System

A comprehensive school management system with features for student management, attendance tracking, financial management, assignments, and more.

## Features

- **Student Management**: Complete student records, enrollment, and profiles
- **Teacher Management**: Teacher profiles, assignments, and class management
- **Attendance Tracking**: Daily attendance with SMS notifications to parents
- **Financial Management**: Income, expenses, payroll, budgets, and fee collection
- **Assignments & Grading**: Create, submit, and grade assignments
- **Report Cards**: Generate and publish student report cards
- **Announcements**: School-wide announcements with SMS capability
- **SMS Integration**: Arkesel SMS service for parent notifications
- **Parent Portal**: Parents can view student progress and reports
- **Dashboard Analytics**: Comprehensive charts and metrics

## Tech Stack

### Backend
- Django 4.2+
- Django REST Framework
- SQLite (development) / PostgreSQL (production)
- Python 3.11+

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Recharts for data visualization
- Shadcn/ui components

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Docker Deployment

### Using Docker Compose (Local)

```bash
docker-compose up --build
```

### Backend: http://localhost:8000
### Frontend: http://localhost:5173

## Railway Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables:
   - `DEBUG=False`
   - `SECRET_KEY=your-secret-key`
   - `ALLOWED_HOSTS=your-domain.railway.app`
   - `DATABASE_URL=postgresql://...` (Railway provides this)
   - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`

### 3. Deploy Frontend

1. Create a new service in Railway
2. Select the same repository
3. Set root directory to `frontend`
4. Add environment variables:
   - `VITE_API_URL=https://your-backend.railway.app`

## Environment Variables

### Backend (.env)

```env
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@host:port/dbname
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.railway.app
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.com

# SMS Configuration (Arkesel)
ARKESEL_API_KEY=your-arkesel-api-key
ARKESEL_SMS_SENDER=YourSchool

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
.
├── backend/                 # Django backend
│   ├── accounts/           # User authentication
│   ├── students/           # Student management
│   ├── teachers/           # Teacher management
│   ├── schools/            # School settings
│   ├── financial/          # Financial management
│   ├── assignments/        # Assignment system
│   ├── reports/            # Report card generation
│   ├── notifications/      # Notifications & SMS
│   ├── announcements/      # Announcements
│   └── manage.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── stores/        # State management
│   └── package.json
├── Dockerfile             # Backend Docker config
├── docker-compose.yml     # Local development
└── README.md
```

## API Documentation

API endpoints are available at `/api/` when the server is running.

### Main Endpoints

- `/api/auth/` - Authentication
- `/api/students/` - Student management
- `/api/teachers/` - Teacher management
- `/api/schools/` - School settings
- `/api/schools/financial/` - Financial management
- `/api/assignments/` - Assignments
- `/api/reports/` - Report cards
- `/api/notifications/` - Notifications
- `/api/announcements/` - Announcements

## Default Credentials

After running migrations, create a superuser:

```bash
python manage.py createsuperuser
```

## Features in Detail

### Financial Management
- Income tracking by category
- Expense management with approval workflow
- Staff payroll management
- Budget planning and tracking
- Fee collection monitoring
- Comprehensive financial dashboard

### Attendance System
- Daily attendance tracking
- SMS notifications to parents
- Attendance reports and analytics
- Class-wise attendance rates

### Assignment System
- Create and assign homework
- Student submission portal
- Grading and feedback
- Deadline management

### Report Cards
- Automated report card generation
- Multiple template options
- PDF export
- Bulk publishing

### SMS Integration
- Fee reminders
- Attendance alerts
- General announcements
- SMS credit management

## Support

For issues and questions, please open an issue on GitHub.

## License

Proprietary - All rights reserved

## Contributors

- Development Team

---

**Version**: 1.0.0
**Last Updated**: 2024
