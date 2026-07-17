#!/usr/bin/env python3
"""
SIMPLIFIED STUDENT WORKFLOW ANALYSIS
Understanding the complete assignment process without Unicode issues
"""
import sqlite3
from datetime import datetime

DB_PATH = 'backend/db.sqlite3'

def analyze_workflow():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== STUDENT ASSIGNMENT WORKFLOW ANALYSIS ===\n")
    
    # 1. Get all active students
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
    """)
    students = cursor.fetchall()
    
    print(f"ACTIVE STUDENTS: {len(students)}")
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        print(f"- {first_name} {last_name} ({student_number}) in {class_name}")
    
    # 2. Get all published assignments
    cursor.execute("""
        SELECT a.id, a.title, a.assignment_type, a.class_instance_id, a.status,
               c.level, c.section
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        WHERE a.status = 'PUBLISHED'
    """)
    assignments = cursor.fetchall()
    
    print(f"\nPUBLISHED ASSIGNMENTS: {len(assignments)}")
    for assignment in assignments:
        assignment_id, title, assignment_type, class_id, status, level, section = assignment
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        print(f"- '{title}' ({assignment_type}) for {class_name}")
    
    # 3. Check assignment visibility for each student
    print(f"\nASSIGNMENT VISIBILITY BY STUDENT:")
    print("-" * 50)
    
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        
        print(f"\nStudent: {first_name} {last_name} ({student_number})")
        print(f"Class: {class_name}")
        
        # Get assignments for this student's class
        cursor.execute("""
            SELECT a.id, a.title, a.assignment_type, a.status
            FROM assignments a
            WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
        """, (class_id,))
        class_assignments = cursor.fetchall()
        
        print(f"Published assignments in class: {len(class_assignments)}")
        
        # Check which assignments are visible to student
        cursor.execute("""
            SELECT sa.assignment_id, a.title, a.assignment_type, sa.status
            FROM student_assignments sa
            JOIN assignments a ON sa.assignment_id = a.id
            WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
        """, (student_id,))
        visible_assignments = cursor.fetchall()
        
        print(f"Visible assignments: {len(visible_assignments)}")
        
        if visible_assignments:
            for assignment in visible_assignments:
                assignment_id, title, assignment_type, status = assignment
                print(f"  - '{title}' ({assignment_type}) - Status: {status}")
        else:
            print("  NO ASSIGNMENTS VISIBLE")
        
        # Check for missing assignments
        missing_count = len(class_assignments) - len(visible_assignments)
        if missing_count > 0:
            print(f"  WARNING: {missing_count} assignments not visible to student")
    
    # 4. Assignment submission workflow
    print(f"\n\nASSIGNMENT SUBMISSION WORKFLOW:")
    print("-" * 50)
    
    cursor.execute("""
        SELECT sa.id, s.first_name, s.last_name, a.title, sa.status,
               sa.attempts_count, sa.submission_text, sa.created_at, sa.updated_at
        FROM student_assignments sa
        JOIN students s ON sa.student_id = s.id
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE s.is_active = 1
        ORDER BY s.last_name, a.title
    """)
    submissions = cursor.fetchall()
    
    status_counts = {}
    for submission in submissions:
        sa_id, first_name, last_name, title, status, attempts, text, created, updated = submission
        
        if status not in status_counts:
            status_counts[status] = 0
        status_counts[status] += 1
        
        has_submission = len(text.strip()) > 0 if text else False
        submission_status = "HAS CONTENT" if has_submission else "NO CONTENT"
        
        print(f"{first_name} {last_name}: '{title}' - {status} ({submission_status})")
        if attempts > 0:
            print(f"  Attempts: {attempts}")
    
    print(f"\nSUBMISSION STATUS SUMMARY:")
    for status, count in status_counts.items():
        print(f"- {status}: {count}")
    
    # 5. Check for workflow issues
    print(f"\n\nWORKFLOW ISSUES DETECTED:")
    print("-" * 50)
    
    issues_found = 0
    
    # Issue 1: Students without any assignments
    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name
        FROM students s
        WHERE s.is_active = 1
        AND s.id NOT IN (
            SELECT DISTINCT sa.student_id 
            FROM student_assignments sa
            JOIN assignments a ON sa.assignment_id = a.id
            WHERE a.status = 'PUBLISHED'
        )
    """)
    students_no_assignments = cursor.fetchall()
    
    if students_no_assignments:
        issues_found += 1
        print(f"ISSUE {issues_found}: Students with no visible assignments:")
        for student in students_no_assignments:
            student_id, first_name, last_name = student
            print(f"  - {first_name} {last_name}")
    
    # Issue 2: Published assignments without student records
    cursor.execute("""
        SELECT a.id, a.title, a.class_instance_id
        FROM assignments a
        WHERE a.status = 'PUBLISHED'
        AND a.id NOT IN (
            SELECT DISTINCT sa.assignment_id 
            FROM student_assignments sa
        )
    """)
    orphaned_assignments = cursor.fetchall()
    
    if orphaned_assignments:
        issues_found += 1
        print(f"ISSUE {issues_found}: Published assignments with no student records:")
        for assignment in orphaned_assignments:
            assignment_id, title, class_id = assignment
            print(f"  - '{title}' (Class {class_id})")
    
    # Issue 3: Class mismatches
    cursor.execute("""
        SELECT s.first_name, s.last_name, s.current_class_id, a.title, a.class_instance_id
        FROM student_assignments sa
        JOIN students s ON sa.student_id = s.id
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE s.current_class_id != a.class_instance_id
    """)
    class_mismatches = cursor.fetchall()
    
    if class_mismatches:
        issues_found += 1
        print(f"ISSUE {issues_found}: Class mismatches:")
        for mismatch in class_mismatches:
            first_name, last_name, student_class, title, assignment_class = mismatch
            print(f"  - {first_name} {last_name} (Class {student_class}) assigned '{title}' (Class {assignment_class})")
    
    if issues_found == 0:
        print("NO WORKFLOW ISSUES DETECTED - System appears to be working correctly")
    
    conn.close()
    print(f"\n=== WORKFLOW ANALYSIS COMPLETE ===")

if __name__ == "__main__":
    analyze_workflow()