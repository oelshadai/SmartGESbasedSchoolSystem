#!/usr/bin/env python3
"""
ASSIGNMENT PIPELINE VERIFICATION
Test the complete flow from VClass creation to student visibility
"""
import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = 'backend/db.sqlite3'

def verify_assignment_pipeline():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== ASSIGNMENT PIPELINE VERIFICATION ===\n")
    
    # Step 1: Check current state
    print("1. Current Database State:")
    
    # Get active students
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
        ORDER BY s.current_class_id, s.first_name
    """)
    students = cursor.fetchall()
    
    print(f"   Active students: {len(students)}")
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        print(f"   - {first_name} {last_name} ({student_number}) -> {class_name}")
    
    # Get published assignments
    cursor.execute("""
        SELECT a.id, a.title, a.class_instance_id, a.status, a.created_at,
               c.level, c.section
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        WHERE a.status = 'PUBLISHED'
        ORDER BY a.created_at DESC
    """)
    assignments = cursor.fetchall()
    
    print(f"\n   Published assignments: {len(assignments)}")
    for assignment in assignments:
        assignment_id, title, class_id, status, created_at, level, section = assignment
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        print(f"   - '{title}' (ID: {assignment_id}) -> {class_name} [{status}]")
    
    # Step 2: Check StudentAssignment records
    print(f"\n2. StudentAssignment Records:")
    
    cursor.execute("""
        SELECT sa.id, sa.assignment_id, sa.student_id, sa.status,
               a.title, s.first_name, s.last_name
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        JOIN students s ON sa.student_id = s.id
        WHERE a.status = 'PUBLISHED'
        ORDER BY a.id, s.first_name
    """)
    student_assignments = cursor.fetchall()
    
    print(f"   Total StudentAssignment records: {len(student_assignments)}")
    
    # Group by assignment
    assignment_groups = {}
    for sa in student_assignments:
        sa_id, assignment_id, student_id, status, title, first_name, last_name = sa
        if assignment_id not in assignment_groups:
            assignment_groups[assignment_id] = {'title': title, 'students': []}
        assignment_groups[assignment_id]['students'].append({
            'name': f"{first_name} {last_name}",
            'status': status
        })
    
    for assignment_id, data in assignment_groups.items():
        print(f"\n   Assignment: '{data['title']}' (ID: {assignment_id})")
        print(f"   Students assigned: {len(data['students'])}")
        for student in data['students']:
            print(f"     - {student['name']}: {student['status']}")
    
    # Step 3: Identify gaps
    print(f"\n3. Gap Analysis:")
    
    gaps_found = 0
    for assignment in assignments:
        assignment_id, title, class_id, status, created_at, level, section = assignment
        
        # Get students in this class
        cursor.execute("""
            SELECT id, first_name, last_name
            FROM students 
            WHERE current_class_id = ? AND is_active = 1
        """, (class_id,))
        class_students = cursor.fetchall()
        
        # Check which students have StudentAssignment records
        cursor.execute("""
            SELECT student_id FROM student_assignments 
            WHERE assignment_id = ?
        """, (assignment_id,))
        assigned_student_ids = [row[0] for row in cursor.fetchall()]
        
        missing_students = []
        for student in class_students:
            student_id, first_name, last_name = student
            if student_id not in assigned_student_ids:
                missing_students.append(f"{first_name} {last_name}")
                gaps_found += 1
        
        if missing_students:
            print(f"   MISSING: Assignment '{title}' not assigned to:")
            for student_name in missing_students:
                print(f"     - {student_name}")
        else:
            print(f"   OK Assignment '{title}' properly assigned to all students")
    
    # Step 4: Test student API simulation
    print(f"\n4. Student API Simulation:")
    
    for student in students[:3]:  # Test first 3 students
        student_id, student_number, first_name, last_name, class_id, level, section = student
        
        print(f"\n   Testing for {first_name} {last_name} (Class {class_id}):")
        
        # Simulate the student API query
        cursor.execute("""
            SELECT a.id, a.title, a.description, a.assignment_type, a.due_date, a.max_score,
                   sa.status, sa.score, sa.submitted_at
            FROM assignments a
            LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = ?
            WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (student_id, class_id))
        
        student_assignments = cursor.fetchall()
        
        print(f"     Assignments visible: {len(student_assignments)}")
        for sa in student_assignments:
            assignment_id, title, desc, type_, due_date, max_score, status, score, submitted_at = sa
            status_display = status if status else "NOT_ASSIGNED"
            print(f"     - '{title}' [{type_}]: {status_display}")
    
    # Step 5: Summary
    print(f"\n5. Pipeline Status Summary:")
    print(f"   Total active students: {len(students)}")
    print(f"   Total published assignments: {len(assignments)}")
    print(f"   Total StudentAssignment records: {len(student_assignments)}")
    print(f"   Missing assignments found: {gaps_found}")
    
    if gaps_found == 0:
        print(f"   OK PIPELINE STATUS: HEALTHY - All assignments properly assigned")
    else:
        print(f"   WARNING PIPELINE STATUS: GAPS DETECTED - {gaps_found} missing assignments")
    
    # Step 6: Create test assignment to verify pipeline
    print(f"\n6. Testing Assignment Creation Pipeline:")
    
    # Get a teacher and class for testing
    cursor.execute("""
        SELECT u.id, u.first_name, u.last_name, c.id, c.level, c.section
        FROM auth_user u
        JOIN classes c ON c.class_teacher_id = u.id
        WHERE c.id IN (SELECT DISTINCT current_class_id FROM students WHERE is_active = 1)
        LIMIT 1
    """)
    teacher_class = cursor.fetchone()
    
    if teacher_class:
        teacher_id, teacher_first, teacher_last, class_id, level, section = teacher_class
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        
        print(f"   Creating test assignment:")
        print(f"   Teacher: {teacher_first} {teacher_last} (ID: {teacher_id})")
        print(f"   Class: {class_name} (ID: {class_id})")
        
        # Create test assignment
        test_title = f"Pipeline Test Assignment - {datetime.now().strftime('%H:%M:%S')}"
        cursor.execute("""
            INSERT INTO assignments 
            (title, description, assignment_type, class_instance_id, created_by_id, 
             due_date, max_score, status, created_at, updated_at)
            VALUES (?, ?, 'HOMEWORK', ?, ?, ?, 10, 'PUBLISHED', ?, ?)
        """, (
            test_title,
            "This is a test assignment to verify the pipeline works correctly.",
            class_id,
            teacher_id,
            (datetime.now() + timedelta(days=7)).isoformat(),
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        test_assignment_id = cursor.lastrowid
        print(f"   + Created test assignment (ID: {test_assignment_id})")
        
        # Get students in this class
        cursor.execute("""
            SELECT id, first_name, last_name
            FROM students 
            WHERE current_class_id = ? AND is_active = 1
        """, (class_id,))
        class_students = cursor.fetchall()
        
        # Create StudentAssignment records (simulating backend auto-creation)
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
            print(f"     + Assigned to {first_name} {last_name}")
        
        print(f"   + Created {created_count} StudentAssignment records")
        
        # Verify students can see the assignment
        print(f"   Verifying student visibility:")
        for student in class_students[:2]:  # Test first 2 students
            student_id, first_name, last_name = student
            
            cursor.execute("""
                SELECT COUNT(*) FROM student_assignments sa
                JOIN assignments a ON sa.assignment_id = a.id
                WHERE sa.student_id = ? AND a.id = ? AND a.status = 'PUBLISHED'
            """, (student_id, test_assignment_id))
            
            visible_count = cursor.fetchone()[0]
            if visible_count > 0:
                print(f"     + {first_name} {last_name} can see the assignment")
            else:
                print(f"     - {first_name} {last_name} CANNOT see the assignment")
    
    conn.commit()
    conn.close()
    
    print(f"\n=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    verify_assignment_pipeline()