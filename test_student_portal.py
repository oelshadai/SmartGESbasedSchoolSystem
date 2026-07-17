#!/usr/bin/env python3
"""
STUDENT PORTAL TEST
Simple test to verify student assignment visibility
"""
import sqlite3
import json

DB_PATH = 'backend/db.sqlite3'

def test_student_portal():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== STUDENT PORTAL ASSIGNMENT VISIBILITY TEST ===\n")
    
    # Get all active students
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
    """)
    students = cursor.fetchall()
    
    print(f"Testing {len(students)} active students:\n")
    
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        
        print(f"Student: {first_name} {last_name} ({student_number})")
        print(f"Class: {class_name}")
        
        # Simulate the student API call - get assignments for this student
        cursor.execute("""
            SELECT DISTINCT a.id, a.title, a.assignment_type, a.due_date, a.max_score,
                   sa.status, sa.score, sa.submission_text
            FROM assignments a
            JOIN student_assignments sa ON a.id = sa.assignment_id
            WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (student_id,))
        
        assignments = cursor.fetchall()
        
        if assignments:
            print(f"Assignments visible: {len(assignments)}")
            for assignment in assignments:
                assignment_id, title, assignment_type, due_date, max_score, status, score, submission_text = assignment
                print(f"  - '{title}' [{assignment_type}]: {status}")
                if score:
                    print(f"    Score: {score}/{max_score}")
        else:
            print("❌ NO ASSIGNMENTS VISIBLE")
            
            # Check if there are assignments for this class that aren't assigned
            cursor.execute("""
                SELECT a.id, a.title, a.assignment_type
                FROM assignments a
                WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
            """, (class_id,))
            
            class_assignments = cursor.fetchall()
            if class_assignments:
                print(f"  ⚠️  Found {len(class_assignments)} assignments for this class but not assigned to student:")
                for assignment in class_assignments:
                    assignment_id, title, assignment_type = assignment
                    print(f"    - '{title}' [{assignment_type}] (ID: {assignment_id})")
        
        print("-" * 50)
    
    conn.close()

if __name__ == "__main__":
    test_student_portal()