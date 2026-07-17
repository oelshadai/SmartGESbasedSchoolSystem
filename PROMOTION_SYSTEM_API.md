# Student Promotion System API Documentation

## Overview
The enhanced student promotion system provides comprehensive functionality for promoting students from one class to another, with built-in eligibility checking and support for both bulk class promotions and selective student promotions.

## API Endpoints

### 1. Bulk Class Promotion
**Endpoint:** `POST /api/students/promotions/bulk-class/`

Promotes an entire class to the next level after third term completion.

**Request Body:**
```json
{
  "from_class_id": 1,
  "to_class_id": 2,  // Optional - auto-determined if not provided
  "academic_year_id": 1,
  "force_promotion": false  // Optional - defaults to false
}
```

**Response:**
```json
{
  "message": "Promotion completed for 25 students",
  "promoted_students": [
    {
      "student_id": "STD001",
      "name": "John Doe",
      "from_class": "Basic 1 A",
      "to_class": "Basic 2 A",
      "promotion_id": 123
    }
  ],
  "failed_students": [
    {
      "student_id": "STD002",
      "name": "Jane Smith",
      "reason": "Poor attendance: 65.5% (minimum 75% required)"
    }
  ],
  "summary": {
    "total_students": 27,
    "promoted_count": 25,
    "failed_count": 2,
    "from_class": "Basic 1 A",
    "to_class": "Basic 2 A",
    "academic_year": "2024/2025"
  }
}
```

### 2. Selective Student Promotion
**Endpoint:** `POST /api/students/promotions/selective/`

Promotes selected students to a specific class.

**Request Body:**
```json
{
  "student_ids": [1, 2, 3],
  "to_class_id": 5,
  "academic_year_id": 1,
  "remarks": "Special promotion for exceptional performance",  // Optional
  "force_promotion": false  // Optional
}
```

**Response:**
```json
{
  "message": "Promotion completed for 3 students",
  "promoted_students": [
    {
      "student_id": "STD001",
      "name": "John Doe",
      "from_class": "Basic 1 A",
      "to_class": "Basic 3 A",
      "promotion_id": 124
    }
  ],
  "failed_students": [],
  "summary": {
    "promoted_count": 3,
    "failed_count": 0,
    "to_class": "Basic 3 A",
    "academic_year": "2024/2025"
  }
}
```

### 3. Promotion Preview
**Endpoint:** `GET /api/students/promotions/preview/`

Preview students eligible for promotion from a class.

**Query Parameters:**
- `class_id`: ID of the class to check
- `academic_year_id`: ID of the academic year

**Response:**
```json
{
  "class_info": {
    "id": 1,
    "name": "Basic 1 A",
    "next_class": "Basic 2 A",
    "is_graduation_class": false
  },
  "academic_year": "2024/2025",
  "eligible_students": [
    {
      "id": 1,
      "student_id": "STD001",
      "name": "John Doe",
      "current_class": "Basic 1 A",
      "next_class": "Basic 2 A"
    }
  ],
  "ineligible_students": [
    {
      "id": 2,
      "student_id": "STD002",
      "name": "Jane Smith",
      "current_class": "Basic 1 A",
      "next_class": "Basic 2 A",
      "reason": "Poor attendance: 65.5% (minimum 75% required)"
    }
  ],
  "summary": {
    "total_students": 27,
    "eligible_count": 25,
    "ineligible_count": 2
  }
}
```

## Eligibility Criteria

Students are considered eligible for promotion if they meet the following criteria:

1. **Attendance Requirement**: Minimum 75% attendance rate across all terms in the academic year
2. **Academic Performance**: Minimum 50% average score across all subjects
3. **Term Completion**: Third term must be completed (for bulk promotions)

## Class Progression Logic

The system automatically determines the next class based on the following progression:

- Basic 1 → Basic 2
- Basic 2 → Basic 3
- Basic 3 → Basic 4
- Basic 4 → Basic 5
- Basic 5 → Basic 6
- Basic 6 → Basic 7 (JHS 1)
- Basic 7 → Basic 8 (JHS 2)
- Basic 8 → Basic 9 (JHS 3)
- Basic 9 → Graduation

## Force Promotion

When `force_promotion` is set to `true`, the system will:
- Skip attendance and academic performance checks
- Allow promotion before third term completion
- Promote all students regardless of eligibility

## Management Command

For automated bulk promotions, use the Django management command:

```bash
# Dry run to preview promotions
python manage.py promote_students --school-id 1 --academic-year-id 1 --dry-run

# Promote all classes in a school
python manage.py promote_students --school-id 1 --academic-year-id 1

# Promote specific class level
python manage.py promote_students --school-id 1 --academic-year-id 1 --from-class BASIC_1

# Force promotion ignoring eligibility
python manage.py promote_students --school-id 1 --academic-year-id 1 --force
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200 OK`: Successful promotion
- `400 Bad Request`: Invalid input data or business rule violation
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found

Common error scenarios:
- Third term not completed (use `force_promotion=true` to override)
- No next class available for progression
- Students not found or not in the specified school
- Invalid class or academic year IDs

## Permissions

Only users with `SCHOOL_ADMIN` or `PRINCIPAL` roles can perform promotions.

## Frontend Integration

The React component `StudentPromotionSystem` provides a complete UI for:
- Previewing eligible students
- Bulk class promotion
- Selective student promotion
- Real-time feedback and progress tracking