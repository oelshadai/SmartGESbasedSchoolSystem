#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime

# Database path
DB_PATH = 'backend/db.sqlite3'

def investigate_assignments():
    """Investigate assignment data flow between teacher and student portals"""
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("=== ASSIGNMENT INVESTIGATION ===\n")
        
        # 1. Check if assignments table exists and has data
        print("1. ASSIGNMENTS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM assignments")
        assignment_count = cursor.fetchone()[0]
        print(f"   Total assignments: {assignment_count}")
        
        if assignment_count > 0:
            cursor.execute("""
                SELECT id, title, assignment_type, status, created_by_id, class_instance_id, 
                       created_at, published_at 
                FROM assignments 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            assignments = cursor.fetchall()
            
            print("   Recent assignments:")
            for assignment in assignments:
                print(f"     ID: {assignment[0]}, Title: {assignment[1]}, Type: {assignment[2]}")
                print(f"     Status: {assignment[3]}, Class: {assignment[5]}, Created: {assignment[6]}")
                print(f"     Published: {assignment[7] or 'Not published'}")
                print()
        
        # 2. Check student assignments table
        print("2. STUDENT ASSIGNMENTS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM student_assignments")
        student_assignment_count = cursor.fetchone()[0]
        print(f"   Total student assignments: {student_assignment_count}")
        
        if student_assignment_count > 0:
            cursor.execute("""
                SELECT sa.id, sa.assignment_id, sa.student_id, sa.status, 
                       a.title, a.status as assignment_status
                FROM student_assignments sa
                JOIN assignments a ON sa.assignment_id = a.id
                ORDER BY sa.created_at DESC
                LIMIT 10
            """)
            student_assignments = cursor.fetchall()
            
            print("   Recent student assignments:")
            for sa in student_assignments:
                print(f"     Student Assignment ID: {sa[0]}, Assignment: {sa[4]}")
                print(f"     Student ID: {sa[2]}, Status: {sa[3]}, Assignment Status: {sa[5]}")
                print()
        
        # 3. Check students table
        print("3. STUDENTS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM students_student")
        student_count = cursor.fetchone()[0]
        print(f"   Total students: {student_count}")
        
        if student_count > 0:
            cursor.execute("""
                SELECT id, student_id, first_name, last_name, current_class_id, user_id
                FROM students_student
                LIMIT 5
            """)
            students = cursor.fetchall()
            
            print("   Sample students:")
            for student in students:
                print(f"     ID: {student[0]}, Student ID: {student[1]}")
                print(f"     Name: {student[2]} {student[3]}, Class: {student[4]}, User: {student[5]}")
                print()
        
        # 4. Check classes table
        print("4. CLASSES TABLE:")
        cursor.execute("SELECT COUNT(*) FROM schools_class")
        class_count = cursor.fetchone()[0]
        print(f"   Total classes: {class_count}")
        
        if class_count > 0:
            cursor.execute("""
                SELECT id, level, section, class_teacher_id
                FROM schools_class
                LIMIT 5
            """)
            classes = cursor.fetchall()
            
            print("   Sample classes:")
            for cls in classes:
                print(f"     ID: {cls[0]}, Level: {cls[1]}, Section: {cls[2]}, Teacher: {cls[3]}")
        
        # 5. Check auth_user table for teachers and students
        print("\n5. USERS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM auth_user")
        user_count = cursor.fetchone()[0]
        print(f"   Total users: {user_count}")
        
        cursor.execute("""
            SELECT id, username, email, is_active, date_joined
            FROM auth_user
            ORDER BY date_joined DESC
            LIMIT 10
        """)
        users = cursor.fetchall()
        
        print("   Recent users:")
        for user in users:
            print(f"     ID: {user[0]}, Username: {user[1]}, Email: {user[2]}")
            print(f"     Active: {user[3]}, Joined: {user[4]}")
            print()
        
        # 6. Check for data consistency issues
        print("6. DATA CONSISTENCY CHECK:")
        
        # Check assignments without student assignments
        cursor.execute("""
            SELECT a.id, a.title, a.status, a.class_instance_id
            FROM assignments a
            LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
            WHERE a.status = 'PUBLISHED' AND sa.id IS NULL
        """)
        orphaned_assignments = cursor.fetchall()
        
        if orphaned_assignments:
            print("   ⚠️  Published assignments without student assignments:")
            for assignment in orphaned_assignments:
                print(f"     Assignment ID: {assignment[0]}, Title: {assignment[1]}")
                print(f"     Status: {assignment[2]}, Class: {assignment[3]}")
                print()
        else:
            print("   ✅ All published assignments have student assignment records")
        
        # Check students without assignments
        cursor.execute("""
            SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id
            FROM students_student s
            LEFT JOIN student_assignments sa ON s.id = sa.student_id
            WHERE sa.id IS NULL AND s.current_class_id IS NOT NULL
        """)
        students_without_assignments = cursor.fetchall()
        
        if students_without_assignments:
            print("   ⚠️  Students without any assignments:")
            for student in students_without_assignments:
                print(f"     Student ID: {student[0]}, Name: {student[2]} {student[3]}")
                print(f"     Class: {student[4]}")
                print()
        else:
            print("   ✅ All students have assignment records")
        
        # 7. Check class-student-assignment relationships
        print("7. CLASS-STUDENT-ASSIGNMENT RELATIONSHIPS:")
        cursor.execute("""
            SELECT 
                c.id as class_id,
                c.level,
                COUNT(DISTINCT s.id) as student_count,
                COUNT(DISTINCT a.id) as assignment_count,
                COUNT(DISTINCT sa.id) as student_assignment_count
            FROM schools_class c
            LEFT JOIN students_student s ON c.id = s.current_class_id
            LEFT JOIN assignments a ON c.id = a.class_instance_id AND a.status = 'PUBLISHED'
            LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
            GROUP BY c.id, c.level
            ORDER BY c.level
        """)
        class_stats = cursor.fetchall()
        
        print("   Class statistics:")
        for stat in class_stats:
            print(f"     Class {stat[1]} (ID: {stat[0]}): {stat[1]} students, {stat[2]} assignments, {stat[3]} student assignments")
        
        conn.close()
        
    except Exception as e:
        print(f"Error investigating assignments: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    investigate_assignments()