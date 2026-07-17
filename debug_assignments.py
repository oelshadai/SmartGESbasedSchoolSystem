#!/usr/bin/env python3
import sqlite3
import json

DB_PATH = 'backend/db.sqlite3'

def debug_assignment_issue():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== DEBUGGING ASSIGNMENT VISIBILITY ISSUE ===\n")
    
    # 1. Check total assignments created by teachers
    print("1. Total assignments in database:")
    cursor.execute("SELECT COUNT(*) FROM assignments")
    total_assignments = cursor.fetchone()[0]
    print(f"   Total assignments: {total_assignments}")
    
    # 2. Check assignments by status
    print("\n2. Assignments by status:")
    cursor.execute("SELECT status, COUNT(*) FROM assignments GROUP BY status")
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]}")
    
    # 3. Check if student_assignments records exist
    print("\n3. Student assignment records:")
    cursor.execute("SELECT COUNT(*) FROM student_assignments")
    total_student_assignments = cursor.fetchone()[0]
    print(f"   Total student_assignments: {total_student_assignments}")
    
    # 4. Check assignments that have student_assignments vs those that don't
    print("\n4. Assignment distribution:")
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT a.id) as total_assignments,
            COUNT(DISTINCT sa.assignment_id) as assignments_with_students
        FROM assignments a
        LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
    """)
    result = cursor.fetchone()
    print(f"   Total assignments: {result[0]}")
    print(f"   Assignments with student records: {result[1]}")
    print(f"   Assignments WITHOUT student records: {result[0] - result[1]}")
    
    # 5. Check specific student's assignments (you'll need to replace student_id)
    print("\n5. Sample student assignment check (first student):")
    cursor.execute("SELECT id FROM students_student LIMIT 1")
    student_result = cursor.fetchone()
    
    if student_result:
        student_id = student_result[0]
        cursor.execute("""
            SELECT a.id, a.title, a.status, sa.id as student_assignment_id
            FROM assignments a
            LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = ?
            ORDER BY a.created_at DESC
        """, (student_id,))
        
        print(f"   For student ID {student_id}:")
        for row in cursor.fetchall():
            has_record = "YES" if row[3] else "NO"
            print(f"   - Assignment '{row[1]}' (ID: {row[0]}, Status: {row[2]}) - Student record: {has_record}")
    
    # 6. Check if there's a class mismatch issue
    print("\n6. Class assignment distribution:")
    cursor.execute("""
        SELECT c.level, c.section, COUNT(a.id) as assignment_count
        FROM assignments a
        LEFT JOIN schools_class c ON a.class_instance_id = c.id
        GROUP BY c.level, c.section
        ORDER BY c.level, c.section
    """)
    
    print("   Assignments by class:")
    for row in cursor.fetchall():
        level = row[0] if row[0] else "No Class"
        section = row[1] if row[1] else ""
        print(f"   - {level} {section}: {row[2]} assignments")
    
    conn.close()

if __name__ == '__main__':
    debug_assignment_issue()