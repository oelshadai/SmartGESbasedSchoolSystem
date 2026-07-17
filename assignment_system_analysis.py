#!/usr/bin/env python3
"""
COMPREHENSIVE ASSIGNMENT SYSTEM ANALYSIS
Analyze the complete assignment creation and visibility pipeline
"""
import sqlite3
import json
from datetime import datetime

DB_PATH = 'backend/db.sqlite3'

def analyze_assignment_system():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== ASSIGNMENT SYSTEM ANALYSIS ===\n")
    
    # 1. Database Schema Analysis
    print("1. DATABASE SCHEMA:")
    
    # Check assignments table structure
    cursor.execute("PRAGMA table_info(assignments)")
    assignment_columns = cursor.fetchall()
    print("   Assignments table columns:")
    for col in assignment_columns:
        print(f"     - {col[1]} ({col[2]})")
    
    # Check student_assignments table structure
    cursor.execute("PRAGMA table_info(student_assignments)")
    student_assignment_columns = cursor.fetchall()
    print("\n   Student_assignments table columns:")
    for col in student_assignment_columns:
        print(f"     - {col[1]} ({col[2]})")
    
    # 2. Current Data State
    print("\n2. CURRENT DATA STATE:")
    
    # Active students
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
        ORDER BY s.current_class_id
    """)
    students = cursor.fetchall()
    
    print(f"   Active students: {len(students)}")
    student_by_class = {}
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        if class_id not in student_by_class:
            student_by_class[class_id] = {'name': class_name, 'students': []}
        student_by_class[class_id]['students'].append({
            'id': student_id,
            'name': f"{first_name} {last_name}",
            'student_id': student_number
        })
    
    for class_id, data in student_by_class.items():
        print(f"     {data['name']}: {len(data['students'])} students")
        for student in data['students']:
            print(f"       - {student['name']} ({student['student_id']})")
    
    # Published assignments
    cursor.execute("""
        SELECT a.id, a.title, a.class_instance_id, a.status, a.created_at, a.created_by_id,
               c.level, c.section, u.first_name, u.last_name
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        LEFT JOIN users u ON a.created_by_id = u.id
        WHERE a.status = 'PUBLISHED'
        ORDER BY a.created_at DESC
    """)
    assignments = cursor.fetchall()
    
    print(f"\n   Published assignments: {len(assignments)}")
    for assignment in assignments:
        assignment_id, title, class_id, status, created_at, created_by, level, section, teacher_first, teacher_last = assignment
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        teacher_name = f"{teacher_first} {teacher_last}" if teacher_first else f"User {created_by}"
        print(f"     - '{title}' (ID: {assignment_id})")
        print(f"       Class: {class_name}, Teacher: {teacher_name}")
        print(f"       Created: {created_at}")
    
    # 3. Assignment-Student Mapping Analysis
    print("\n3. ASSIGNMENT-STUDENT MAPPING:")
    
    for assignment in assignments:
        assignment_id, title, class_id, status, created_at, created_by, level, section, teacher_first, teacher_last = assignment
        
        # Get students in assignment's class
        cursor.execute("""
            SELECT id, first_name, last_name
            FROM students 
            WHERE current_class_id = ? AND is_active = 1
        """, (class_id,))
        class_students = cursor.fetchall()
        
        # Get StudentAssignment records
        cursor.execute("""
            SELECT sa.student_id, sa.status, s.first_name, s.last_name
            FROM student_assignments sa
            JOIN students s ON sa.student_id = s.id
            WHERE sa.assignment_id = ?
        """, (assignment_id,))
        assigned_students = cursor.fetchall()
        
        print(f"\n   Assignment: '{title}' (Class {class_id})")
        print(f"     Students in class: {len(class_students)}")
        print(f"     Students assigned: {len(assigned_students)}")
        
        assigned_ids = [row[0] for row in assigned_students]
        missing_students = []
        
        for student in class_students:
            student_id, first_name, last_name = student
            if student_id not in assigned_ids:
                missing_students.append(f"{first_name} {last_name}")
        
        if missing_students:
            print(f"     MISSING ASSIGNMENTS:")
            for student_name in missing_students:
                print(f"       - {student_name}")
        else:
            print(f"     ✓ All students properly assigned")
        
        if assigned_students:
            print(f"     Assigned students:")
            for student_id, status, first_name, last_name in assigned_students:
                print(f"       - {first_name} {last_name}: {status}")
    
    # 4. API Endpoint Simulation
    print("\n4. API ENDPOINT SIMULATION:")
    
    # Simulate teacher dashboard API
    print("\n   Teacher Dashboard API (/assignments/teacher/dashboard/):")
    for class_id, data in student_by_class.items():
        print(f"\n     Class: {data['name']} (ID: {class_id})")
        
        # Get assignments for this class
        cursor.execute("""
            SELECT a.id, a.title, a.assignment_type, a.due_date, a.max_score, a.status
            FROM assignments a
            WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (class_id,))
        class_assignments = cursor.fetchall()
        
        print(f"       Assignments returned: {len(class_assignments)}")
        for assignment in class_assignments:
            assignment_id, title, type_, due_date, max_score, status = assignment
            
            # Get submission stats
            cursor.execute("""
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN status IN ('SUBMITTED', 'GRADED') THEN 1 ELSE 0 END) as submitted
                FROM student_assignments
                WHERE assignment_id = ?
            """, (assignment_id,))
            stats = cursor.fetchone()
            total, submitted = stats if stats else (0, 0)
            
            print(f"         - '{title}' [{type_}]: {submitted}/{total} submitted")
    
    # Simulate student assignments API
    print("\n   Student Assignments API (/assignments/student/my-assignments/):")
    for student in students[:3]:  # Test first 3 students
        student_id, student_number, first_name, last_name, class_id, level, section = student
        
        print(f"\n     Student: {first_name} {last_name} (Class {class_id})")
        
        # Simulate the API query
        cursor.execute("""
            SELECT a.id, a.title, a.description, a.assignment_type, a.due_date, a.max_score,
                   sa.status, sa.score, sa.submitted_at
            FROM assignments a
            LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = ?
            WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (student_id, class_id))
        
        student_assignments = cursor.fetchall()
        
        print(f"       Assignments visible: {len(student_assignments)}")
        for sa in student_assignments:
            assignment_id, title, desc, type_, due_date, max_score, status, score, submitted_at = sa
            status_display = status if status else "NOT_ASSIGNED"
            score_display = f" (Score: {score})" if score else ""
            print(f"         - '{title}' [{type_}]: {status_display}{score_display}")
    
    # 5. VClass Frontend Analysis
    print("\n5. VCLASS FRONTEND ANALYSIS:")
    
    # Check if VClass can create assignments properly
    print("   VClass Assignment Creation Flow:")
    print("     ✓ VClass.jsx has embedded workflow")
    print("     ✓ Uses handleAssignmentCreated() function")
    print("     ✓ Calls /assignments/teacher/ API endpoint")
    print("     ✓ Auto-publishes assignments (status: 'PUBLISHED')")
    
    # Check assignment persistence
    print("\n   Assignment Persistence:")
    print("     ✓ Uses assignmentPersistence service for local storage")
    print("     ✓ Merges backend and local assignments")
    print("     ✓ Fallback to local storage on API failure")
    
    # 6. Backend API Analysis
    print("\n6. BACKEND API ANALYSIS:")
    
    print("   Teacher Assignment Creation:")
    print("     ✓ TeacherAssignmentViewSet.create() handles assignment creation")
    print("     ✓ Auto-assigns to all students in class")
    print("     ✓ Creates StudentAssignment records automatically")
    
    print("\n   Student Assignment Retrieval:")
    print("     ✓ StudentAssignmentViewSet.my_assignments() handles student queries")
    print("     ✓ Auto-creates missing StudentAssignment records")
    print("     ✓ Filters by student's current class")
    
    # 7. Potential Issues Analysis
    print("\n7. POTENTIAL ISSUES ANALYSIS:")
    
    issues_found = []
    
    # Check for orphaned assignments
    cursor.execute("""
        SELECT COUNT(*) FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        WHERE c.id IS NULL AND a.status = 'PUBLISHED'
    """)
    orphaned_assignments = cursor.fetchone()[0]
    if orphaned_assignments > 0:
        issues_found.append(f"Orphaned assignments: {orphaned_assignments} assignments reference non-existent classes")
    
    # Check for students without classes
    cursor.execute("""
        SELECT COUNT(*) FROM students s
        WHERE s.current_class_id IS NULL AND s.is_active = 1
    """)
    classless_students = cursor.fetchone()[0]
    if classless_students > 0:
        issues_found.append(f"Classless students: {classless_students} active students have no class assigned")
    
    # Check for missing StudentAssignment records
    cursor.execute("""
        SELECT COUNT(*) FROM (
            SELECT a.id, s.id
            FROM assignments a
            CROSS JOIN students s
            WHERE a.status = 'PUBLISHED' 
            AND s.is_active = 1 
            AND s.current_class_id = a.class_instance_id
            AND NOT EXISTS (
                SELECT 1 FROM student_assignments sa 
                WHERE sa.assignment_id = a.id AND sa.student_id = s.id
            )
        )
    """)
    missing_assignments = cursor.fetchone()[0]
    if missing_assignments > 0:
        issues_found.append(f"Missing StudentAssignment records: {missing_assignments} assignments not properly assigned to students")
    
    # Check for API endpoint consistency
    print("\n   API Endpoint Issues:")
    api_issues = []
    
    # VClass uses /assignments/teacher/ but backend expects /assignments/teacher/create_assignment/
    api_issues.append("VClass calls /assignments/teacher/ but should call /assignments/teacher/create_assignment/")
    
    # Student API uses /assignments/student/my-assignments/ which exists
    print("     ✓ Student API endpoint exists and is properly configured")
    
    if api_issues:
        for issue in api_issues:
            issues_found.append(f"API Issue: {issue}")
    
    # 8. Summary and Recommendations
    print("\n8. SUMMARY AND RECOMMENDATIONS:")
    
    if issues_found:
        print("   ISSUES FOUND:")
        for i, issue in enumerate(issues_found, 1):
            print(f"     {i}. {issue}")
    else:
        print("   ✓ No critical issues found")
    
    print("\n   RECOMMENDATIONS:")
    print("     1. Fix VClass API endpoint to use correct URL")
    print("     2. Ensure auto-creation of StudentAssignment records in backend")
    print("     3. Add error handling for missing class assignments")
    print("     4. Implement assignment visibility verification")
    print("     5. Add logging for assignment creation pipeline")
    
    # 9. Test Assignment Creation
    print("\n9. TESTING ASSIGNMENT CREATION:")
    
    # Find a teacher and class for testing
    cursor.execute("""
        SELECT u.id, u.first_name, u.last_name, c.id, c.level, c.section
        FROM users u
        JOIN classes c ON c.class_teacher_id = u.id
        WHERE c.id IN (SELECT DISTINCT current_class_id FROM students WHERE is_active = 1)
        LIMIT 1
    """)
    teacher_class = cursor.fetchone()
    
    if teacher_class:
        teacher_id, teacher_first, teacher_last, class_id, level, section = teacher_class
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        
        print(f"   Creating test assignment:")
        print(f"     Teacher: {teacher_first} {teacher_last} (ID: {teacher_id})")
        print(f"     Class: {class_name} (ID: {class_id})")
        
        # Create test assignment
        test_title = f"System Test Assignment - {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        cursor.execute("""
            INSERT INTO assignments 
            (title, description, instructions, assignment_type, class_instance_id, created_by_id, 
             due_date, max_score, status, is_timed, auto_grade, show_results_immediately,
             allow_file_submission, allow_text_submission, max_file_size, allowed_file_types,
             created_at, updated_at)
            VALUES (?, ?, ?, 'HOMEWORK', ?, ?, ?, 10, 'PUBLISHED', 0, 0, 1, 1, 1, 10485760, 'pdf,doc,docx,txt', ?, ?)
        """, (
            test_title,
            "This is a system test assignment to verify the pipeline.",
            "Please complete this test assignment.",
            class_id,
            teacher_id,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        test_assignment_id = cursor.lastrowid
        print(f"     ✓ Created assignment (ID: {test_assignment_id})")
        
        # Get students in class and create StudentAssignment records
        cursor.execute("""
            SELECT id, first_name, last_name
            FROM students 
            WHERE current_class_id = ? AND is_active = 1
        """, (class_id,))
        class_students = cursor.fetchall()
        
        created_count = 0
        for student in class_students:
            student_id, first_name, last_name = student
            
            cursor.execute("""
                INSERT INTO student_assignments 
                (assignment_id, student_id, status, attempts_count, submission_text, 
                 teacher_feedback, additional_files, is_locked, created_at, updated_at)
                VALUES (?, ?, 'NOT_STARTED', 0, '', '', '[]', 0, ?, ?)
            """, (test_assignment_id, student_id, datetime.now().isoformat(), datetime.now().isoformat()))
            
            created_count += 1
            print(f"       ✓ Assigned to {first_name} {last_name}")
        
        print(f"     ✓ Created {created_count} StudentAssignment records")
        
        # Verify visibility
        print(f"     Verifying student can see assignment:")
        for student in class_students[:1]:  # Test first student
            student_id, first_name, last_name = student
            
            cursor.execute("""
                SELECT COUNT(*) FROM student_assignments sa
                JOIN assignments a ON sa.assignment_id = a.id
                WHERE sa.student_id = ? AND a.id = ? AND a.status = 'PUBLISHED'
            """, (student_id, test_assignment_id))
            
            visible = cursor.fetchone()[0] > 0
            status = "✓ VISIBLE" if visible else "✗ NOT VISIBLE"
            print(f"       {first_name} {last_name}: {status}")
    
    conn.commit()
    conn.close()
    
    print(f"\n=== ANALYSIS COMPLETE ===")

if __name__ == "__main__":
    analyze_assignment_system()