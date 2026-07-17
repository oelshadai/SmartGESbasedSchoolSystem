# 🔷 VClass System API Contracts

## Teacher Dashboard API

### GET /api/vclass/dashboard/
**Purpose**: Get complete teacher dashboard data
```json
{
  "class": {
    "id": 1,
    "name": "Class 11A",
    "student_count": 25
  },
  "assignments": [
    {
      "id": 1,
      "title": "Math Quiz",
      "type": "QUIZ",
      "status": "PUBLISHED",
      "due_date": "2024-01-15T10:00:00Z",
      "submissions": {
        "total": 25,
        "submitted": 18,
        "graded": 12
      }
    }
  ],
  "recent_posts": [...],
  "live_sessions": [...]
}
```

### POST /api/assignments/create/
**Purpose**: Create new assignment with questions
```json
{
  "title": "Science Quiz",
  "description": "Chapter 5 test",
  "assignment_type": "QUIZ",
  "class_instance": 1,
  "due_date": "2024-01-20T10:00:00Z",
  "time_limit": 30,
  "questions": [
    {
      "question_text": "What is photosynthesis?",
      "question_type": "mcq",
      "points": 2,
      "options": [
        {"option_text": "Process A", "is_correct": false},
        {"option_text": "Process B", "is_correct": true}
      ]
    }
  ]
}
```

### GET /api/assignments/submissions/
**Purpose**: View student submissions for grading
```json
{
  "assignment_id": 1,
  "submissions": [
    {
      "student": {
        "id": 1,
        "name": "John Doe"
      },
      "status": "SUBMITTED",
      "submitted_at": "2024-01-15T09:30:00Z",
      "answers": [
        {
          "question_id": 1,
          "answer_text": "Student response",
          "is_correct": null
        }
      ]
    }
  ]
}
```

## Student Portal API

### GET /api/students/dashboard/
**Purpose**: Get student dashboard data
```json
{
  "student": {
    "id": 1,
    "name": "John Doe",
    "class": "Class 11A"
  },
  "assignments": [
    {
      "id": 1,
      "title": "Math Quiz",
      "subject": "Mathematics",
      "due_date": "2024-01-15T10:00:00Z",
      "status": "NOT_STARTED",
      "time_limit": 30
    }
  ],
  "grades": [...],
  "announcements": [...]
}
```

### GET /api/assignments/{id}/take/
**Purpose**: Get assignment for student to take
```json
{
  "assignment": {
    "id": 1,
    "title": "Math Quiz",
    "description": "Complete all questions",
    "time_limit": 30,
    "questions": [
      {
        "id": 1,
        "question_text": "What is 2+2?",
        "question_type": "mcq",
        "points": 1,
        "options": [
          {"id": 1, "option_text": "3", "order": 0},
          {"id": 2, "option_text": "4", "order": 1}
        ]
      }
    ]
  },
  "attempt": {
    "id": 1,
    "started_at": "2024-01-15T09:00:00Z",
    "time_remaining": 1800
  }
}
```

### POST /api/assignments/{id}/submit/
**Purpose**: Submit assignment answers
```json
{
  "answers": [
    {
      "question_id": 1,
      "selected_option_id": 2
    },
    {
      "question_id": 2,
      "answer_text": "Student written response"
    }
  ]
}
```

## Class Stream API

### GET /api/vclass/stream/
**Purpose**: Get class posts and announcements
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Important Notice",
      "content": "Class will start at 9 AM",
      "post_type": "ANNOUNCEMENT",
      "is_pinned": true,
      "created_at": "2024-01-15T08:00:00Z",
      "attachment": null
    }
  ]
}
```

### POST /api/vclass/post/
**Purpose**: Create class post
```json
{
  "title": "New Material",
  "content": "Please download the attached file",
  "post_type": "MATERIAL",
  "attachment": "file_upload"
}
```