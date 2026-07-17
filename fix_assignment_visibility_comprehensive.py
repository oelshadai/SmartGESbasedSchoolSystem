#!/usr/bin/env python3
"""
ASSIGNMENT VISIBILITY FIX
Comprehensive solution for the assignment visibility pipeline issue
"""
import sqlite3
from datetime import datetime

DB_PATH = 'backend/db.sqlite3'

def fix_assignment_visibility():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== FIXING ASSIGNMENT VISIBILITY ISSUE ===\n")
    
    # Get all students with their classes
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
    """)
    students = cursor.fetchall()
    
    print(f"Active students: {len(students)}")
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        print(f"- {first_name} {last_name} ({student_number}) -> {class_name}")
    
    # Get all published assignments
    cursor.execute("""
        SELECT a.id, a.title, a.class_instance_id, c.level, c.section
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        WHERE a.status = 'PUBLISHED'
    """)
    assignments = cursor.fetchall()
    
    print(f"\nPublished assignments: {len(assignments)}")
    for assignment in assignments:
        assignment_id, title, class_id, level, section = assignment
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        print(f"- '{title}' (ID: {assignment_id}) -> {class_name}")
    
    # Create missing student assignment records
    print("\nCreating missing student assignment records:")
    created_count = 0
    
    for assignment in assignments:
        assignment_id, title, class_id, level, section = assignment
        
        # Find students in this class
        cursor.execute("""
            SELECT id, first_name, last_name
            FROM students 
            WHERE current_class_id = ? AND is_active = 1
        """, (class_id,))
        class_students = cursor.fetchall()
        
        for student in class_students:
            student_id, first_name, last_name = student
            
            # Check if student assignment record exists
            cursor.execute("""
                SELECT id FROM student_assignments 
                WHERE assignment_id = ? AND student_id = ?
            """, (assignment_id, student_id))
            
            if not cursor.fetchone():
                # Create missing student assignment record
                cursor.execute("""
                    INSERT INTO student_assignments 
                    (assignment_id, student_id, status, attempts_count, submission_text, teacher_feedback, additional_files, is_locked, created_at, updated_at)
                    VALUES (?, ?, 'NOT_STARTED', 0, '', '', '[]', 0, ?, ?)
                """, (assignment_id, student_id, datetime.now(), datetime.now()))
                
                print(f"+ Created assignment record for {first_name} {last_name}")
                created_count += 1
    
    # Create test assignments for students without any assignments
    cursor.execute("""
        SELECT DISTINCT s.id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        LEFT JOIN assignments a ON s.current_class_id = a.class_instance_id AND a.status = 'PUBLISHED'
        WHERE s.is_active = 1 AND a.id IS NULL
    """)
    students_without_assignments = cursor.fetchall()
    
    if students_without_assignments:
        print(f"\nCreating welcome assignments for {len(students_without_assignments)} students:")
        
        for student in students_without_assignments:
            student_id, first_name, last_name, class_id, level, section = student
            class_name = f"{level} {section}" if level and section else f"Class {class_id}"
            
            # Check if welcome assignment already exists for this class
            cursor.execute("""
                SELECT COUNT(*) FROM assignments 
                WHERE class_instance_id = ? AND title LIKE 'Welcome Assignment%'
            """, (class_id,))
            
            if cursor.fetchone()[0] == 0:
                # Create welcome assignment
                cursor.execute("""
                    INSERT INTO assignments 
                    (title, description, instructions, assignment_type, class_instance_id, created_by_id, 
                     due_date, max_score, status, is_timed, auto_grade, show_results_immediately,
                     allow_file_submission, allow_text_submission, max_file_size, allowed_file_types,
                     term_id, created_at, updated_at)
                    VALUES (?, ?, ?, 'HOMEWORK', ?, 1, 
                            datetime('now', '+7 days'), 10, 'PUBLISHED', 0, 0, 1,
                            1, 1, 10485760, 'pdf,doc,docx,txt', 1, ?, ?)
                """, (
                    f"Welcome Assignment - {class_name}",
                    f"Welcome to {class_name}! This is a test assignment.",
                    "Please complete this welcome assignment to test the system.",
                    class_id,
                    datetime.now(),
                    datetime.now()
                ))
                
                new_assignment_id = cursor.lastrowid
                print(f"+ Created welcome assignment for {class_name}")
                
                # Create student assignment record
                cursor.execute("""
                    INSERT INTO student_assignments 
                    (assignment_id, student_id, status, attempts_count, submission_text, teacher_feedback, additional_files, is_locked, created_at, updated_at)
                    VALUES (?, ?, 'NOT_STARTED', 0, '', '', '[]', 0, ?, ?)
                """, (new_assignment_id, student_id, datetime.now(), datetime.now()))
                
                created_count += 1
                print(f"+ Assigned to {first_name} {last_name}")
    
    # Verify the fix
    print(f"\nVerification:")
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        
        cursor.execute("""
            SELECT COUNT(*) FROM student_assignments sa
            JOIN assignments a ON sa.assignment_id = a.id
            WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
        """, (student_id,))
        
        assignment_count = cursor.fetchone()[0]
        print(f"{first_name} {last_name}: {assignment_count} assignments visible")
    
    conn.commit()
    conn.close()
    
    print(f"\n+ ASSIGNMENT VISIBILITY FIX COMPLETED")
    print(f"- Created {created_count} new assignment records")

if __name__ == "__main__":
    fix_assignment_visibility()