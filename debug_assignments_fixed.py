#!/usr/bin/env python3
import sqlite3
import json

DB_PATH = 'backend/db.sqlite3'

def debug_assignment_issue():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== DEBUGGING ASSIGNMENT VISIBILITY ISSUE ===\n")
    
    # 1. Check what tables actually exist
    print("1. Database tables:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    for table in tables:
        print(f"   - {table[0]}")
    
    # 2. Check total assignments created by teachers
    print("\n2. Total assignments in database:")
    cursor.execute("SELECT COUNT(*) FROM assignments")
    total_assignments = cursor.fetchone()[0]
    print(f"   Total assignments: {total_assignments}")
    
    # 3. Check assignments by status
    print("\n3. Assignments by status:")
    cursor.execute("SELECT status, COUNT(*) FROM assignments GROUP BY status")
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]}")
    
    # 4. Check if student_assignments records exist
    print("\n4. Student assignment records:")
    cursor.execute("SELECT COUNT(*) FROM student_assignments")
    total_student_assignments = cursor.fetchone()[0]
    print(f"   Total student_assignments: {total_student_assignments}")
    
    # 5. Check assignments that have student_assignments vs those that don't
    print("\n5. Assignment distribution:")
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
    
    # 6. Check what student table actually exists
    print("\n6. Student table check:")
    student_tables = [table[0] for table in tables if 'student' in table[0].lower()]
    print(f"   Student-related tables: {student_tables}")
    
    # 7. Check students table structure
    if 'students' in [table[0] for table in tables]:
        print("\n7. Students table structure:")
        cursor.execute("PRAGMA table_info(students)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"   - {col[1]} ({col[2]})")
        
        # Check student count
        cursor.execute("SELECT COUNT(*) FROM students")
        student_count = cursor.fetchone()[0]
        print(f"   Total students: {student_count}")
        
        # Sample student assignment check (first student)
        print("\n8. Sample student assignment check (first student):")
        cursor.execute("SELECT id, student_id, first_name, last_name, current_class_id FROM students LIMIT 1")
        student_result = cursor.fetchone()
        
        if student_result:
            student_id, student_number, first_name, last_name, class_id = student_result
            print(f"   Student: {first_name} {last_name} (ID: {student_id}, Number: {student_number}, Class: {class_id})")
            
            cursor.execute("""
                SELECT a.id, a.title, a.status, a.class_instance_id, sa.id as student_assignment_id
                FROM assignments a
                LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = ?
                ORDER BY a.created_at DESC
            """, (student_id,))
            
            print(f"   Assignments for this student:")
            for row in cursor.fetchall():
                has_record = "YES" if row[4] else "NO"
                class_match = "MATCH" if row[3] == class_id else f"MISMATCH (Assignment class: {row[3]}, Student class: {class_id})"
                print(f"   - Assignment '{row[1]}' (ID: {row[0]}, Status: {row[2]}) - Student record: {has_record} - Class: {class_match}")
    
    # 9. Check class assignment distribution
    print("\n9. Class assignment distribution:")
    cursor.execute("""
        SELECT c.id, c.level, c.section, COUNT(a.id) as assignment_count
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        GROUP BY c.id, c.level, c.section
        ORDER BY c.level, c.section
    """)
    
    print("   Assignments by class:")
    for row in cursor.fetchall():
        class_id = row[0] if row[0] else "No Class"
        level = row[1] if row[1] else "No Level"
        section = row[2] if row[2] else ""
        print(f"   - Class {class_id} ({level} {section}): {row[3]} assignments")
    
    # 10. Check if there are students in classes with assignments
    print("\n10. Students in classes with assignments:")
    cursor.execute("""
        SELECT c.id, c.level, c.section, 
               COUNT(DISTINCT a.id) as assignment_count,
               COUNT(DISTINCT s.id) as student_count
        FROM classes c
        LEFT JOIN assignments a ON c.id = a.class_instance_id
        LEFT JOIN students s ON c.id = s.current_class_id
        GROUP BY c.id, c.level, c.section
        HAVING assignment_count > 0 OR student_count > 0
        ORDER BY c.level, c.section
    """)
    
    print("   Class analysis:")
    for row in cursor.fetchall():
        class_id, level, section, assignment_count, student_count = row
        print(f"   - Class {class_id} ({level} {section}): {assignment_count} assignments, {student_count} students")
    
    conn.close()

if __name__ == '__main__':
    debug_assignment_issue()