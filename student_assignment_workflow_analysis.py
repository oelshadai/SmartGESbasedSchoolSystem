#!/usr/bin/env python3
"""
STUDENT ASSIGNMENT WORKFLOW ANALYSIS
Complete analysis of how students view, attempt, and submit assignments
"""
import sqlite3
from datetime import datetime
import json

DB_PATH = 'backend/db.sqlite3'

def analyze_student_assignment_workflow():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== STUDENT ASSIGNMENT WORKFLOW ANALYSIS ===\n")
    
    # 1. ASSIGNMENT VISIBILITY - How students see assignments
    print("1. ASSIGNMENT VISIBILITY PIPELINE")
    print("-" * 50)
    
    # Get all active students
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section, s.user_id
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
        ORDER BY s.first_name, s.last_name
    """)
    students = cursor.fetchall()
    
    print(f"Active Students: {len(students)}")
    
    for student in students[:5]:  # Show first 5 students
        student_id, student_number, first_name, last_name, class_id, level, section, user_id = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        
        print(f"\nStudent: {first_name} {last_name} ({student_number})")
        print(f"  Class: {class_name}")
        print(f"  User ID: {user_id}")
        
        # Check published assignments for this student's class
        cursor.execute("""
            SELECT a.id, a.title, a.assignment_type, a.due_date, a.status
            FROM assignments a
            WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (class_id,))
        class_assignments = cursor.fetchall()
        
        print(f"  Published assignments in class: {len(class_assignments)}")
        
        # Check StudentAssignment records
        cursor.execute("""
            SELECT sa.id, sa.status, sa.score, sa.submitted_at, a.title
            FROM student_assignments sa
            JOIN assignments a ON sa.assignment_id = a.id
            WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (student_id,))
        student_assignments = cursor.fetchall()
        
        print(f"  Visible assignments (StudentAssignment records): {len(student_assignments)}")
        
        if student_assignments:
            for sa in student_assignments[:3]:  # Show first 3
                sa_id, status, score, submitted_at, title = sa
                print(f"    - '{title}': {status} (Score: {score})")
        
        # Check for missing assignments
        missing_count = len(class_assignments) - len(student_assignments)
        if missing_count > 0:
            print(f"  ⚠️  MISSING: {missing_count} assignments not visible to student")
    
    # 2. ASSIGNMENT ATTEMPT PROCESS
    print(f"\n\n2. ASSIGNMENT ATTEMPT PROCESS")
    print("-" * 50)
    
    # Get quiz attempts
    cursor.execute("""
        SELECT qa.id, qa.assignment_id, qa.student_id, qa.status, qa.score, qa.started_at, qa.submitted_at,
               a.title, a.assignment_type, a.time_limit,
               s.first_name, s.last_name
        FROM quiz_attempts qa
        JOIN assignments a ON qa.assignment_id = a.id
        JOIN students s ON qa.student_id = s.id
        ORDER BY qa.started_at DESC
        LIMIT 10
    """)
    attempts = cursor.fetchall()
    
    print(f"Recent Quiz Attempts: {len(attempts)}")
    
    for attempt in attempts:
        attempt_id, assignment_id, student_id, status, score, started_at, submitted_at, title, assignment_type, time_limit, first_name, last_name = attempt
        
        print(f"\nAttempt ID: {attempt_id}")
        print(f"  Student: {first_name} {last_name}")
        print(f"  Assignment: '{title}' ({assignment_type})")
        print(f"  Status: {status}")
        print(f"  Score: {score}")
        print(f"  Started: {started_at}")
        print(f"  Submitted: {submitted_at}")
        print(f"  Time Limit: {time_limit} minutes" if time_limit else "  No time limit")
        
        # Get answers for this attempt
        cursor.execute("""
            SELECT qa.id, qa.question_id, qa.answer_text, qa.selected_option_id, qa.is_correct, qa.points_earned,
                   q.question_text, q.question_type, q.points
            FROM quiz_answers qa
            JOIN questions q ON qa.question_id = q.id
            WHERE qa.attempt_id = ?
            ORDER BY q.order, q.id
        """, (attempt_id,))
        answers = cursor.fetchall()
        
        print(f"  Answers: {len(answers)}")
        for answer in answers[:3]:  # Show first 3 answers
            qa_id, question_id, answer_text, selected_option_id, is_correct, points_earned, question_text, question_type, points = answer
            print(f"    Q: {question_text[:50]}...")
            print(f"       Type: {question_type}, Answer: {answer_text or f'Option {selected_option_id}'}")
            print(f"       Correct: {is_correct}, Points: {points_earned}/{points}")
    
    # 3. SUBMISSION TRACKING
    print(f"\n\n3. SUBMISSION TRACKING")
    print("-" * 50)
    
    # Get submission statistics
    cursor.execute("""
        SELECT 
            COUNT(*) as total_assignments,
            COUNT(CASE WHEN sa.status = 'NOT_STARTED' THEN 1 END) as not_started,
            COUNT(CASE WHEN sa.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
            COUNT(CASE WHEN sa.status = 'SUBMITTED' THEN 1 END) as submitted,
            COUNT(CASE WHEN sa.status = 'GRADED' THEN 1 END) as graded
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE a.status = 'PUBLISHED'
    """)
    stats = cursor.fetchone()
    
    total, not_started, in_progress, submitted, graded = stats
    print(f"Overall Submission Statistics:")
    print(f"  Total Assignments: {total}")
    print(f"  Not Started: {not_started} ({not_started/total*100:.1f}%)")
    print(f"  In Progress: {in_progress} ({in_progress/total*100:.1f}%)")
    print(f"  Submitted: {submitted} ({submitted/total*100:.1f}%)")
    print(f"  Graded: {graded} ({graded/total*100:.1f}%)")
    
    # 4. STUDENT PORTAL ACCESS FLOW
    print(f"\n\n4. STUDENT PORTAL ACCESS FLOW")
    print("-" * 50)
    
    # Check user authentication setup
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.user_id,
               u.username, u.email, u.is_active, u.date_joined
        FROM students s
        LEFT JOIN auth_user u ON s.user_id = u.id
        WHERE s.is_active = 1
        ORDER BY s.id
        LIMIT 5
    """)
    student_users = cursor.fetchall()
    
    print("Student Authentication Setup:")
    for student_user in student_users:
        student_id, student_number, first_name, last_name, user_id, username, email, is_active, date_joined = student_user
        
        print(f"\nStudent: {first_name} {last_name} ({student_number})")
        if user_id:
            print(f"  ✅ User Account: {username} ({email})")
            print(f"  Active: {is_active}, Joined: {date_joined}")
        else:
            print(f"  ❌ No user account linked")
    
    # 5. API ENDPOINT ANALYSIS
    print(f"\n\n5. API ENDPOINT FLOW")
    print("-" * 50)
    
    print("Student Assignment API Endpoints:")
    print("1. GET /api/students/assignments/ - List student's assignments")
    print("2. GET /api/assignments/student/{id}/take/ - Get assignment details for taking")
    print("3. POST /api/assignments/student/{id}/save/ - Save work in progress")
    print("4. POST /api/assignments/student/{id}/submit/ - Submit final answers")
    print("5. GET /api/assignments/student/{id}/submission/ - Get submission status")
    
    # 6. WORKFLOW ISSUES ANALYSIS
    print(f"\n\n6. WORKFLOW ISSUES ANALYSIS")
    print("-" * 50)
    
    # Find students with missing assignments
    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name, s.current_class_id,
               COUNT(a.id) as class_assignments,
               COUNT(sa.id) as visible_assignments
        FROM students s
        LEFT JOIN assignments a ON s.current_class_id = a.class_instance_id AND a.status = 'PUBLISHED'
        LEFT JOIN student_assignments sa ON s.id = sa.student_id AND sa.assignment_id = a.id
        WHERE s.is_active = 1
        GROUP BY s.id, s.first_name, s.last_name, s.current_class_id
        HAVING COUNT(a.id) > COUNT(sa.id)
    """)
    missing_assignments = cursor.fetchall()
    
    print(f"Students with Missing Assignment Visibility: {len(missing_assignments)}")
    for student in missing_assignments[:5]:
        student_id, first_name, last_name, class_id, class_assignments, visible_assignments = student
        missing = class_assignments - visible_assignments
        print(f"  {first_name} {last_name}: {missing} missing out of {class_assignments}")
    
    # Find incomplete attempts
    cursor.execute("""
        SELECT COUNT(*) as incomplete_attempts
        FROM quiz_attempts
        WHERE status = 'IN_PROGRESS' AND started_at < datetime('now', '-1 hour')
    """)
    incomplete = cursor.fetchone()[0]
    print(f"\nIncomplete Attempts (>1 hour old): {incomplete}")
    
    # Find overdue assignments
    cursor.execute("""
        SELECT COUNT(*) as overdue_assignments
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE a.due_date < datetime('now') 
        AND sa.status = 'NOT_STARTED'
        AND a.status = 'PUBLISHED'
    """)
    overdue = cursor.fetchone()[0]
    print(f"Overdue Assignments (Not Started): {overdue}")
    
    # 7. FRONTEND COMPONENT ANALYSIS
    print(f"\n\n7. FRONTEND COMPONENT FLOW")
    print("-" * 50)
    
    print("Student Assignment Components:")
    print("1. StudentDashboard.jsx - Main assignment list view")
    print("2. StudentAssignmentView.jsx - Assignment taking interface")
    print("3. AssignmentSubmissionFlow.jsx - Submission process")
    print("4. StudentAssignments.jsx - Assignment history")
    
    print("\nKey Frontend Features:")
    print("- Auto-save functionality during assignment attempt")
    print("- Timer countdown for timed assignments")
    print("- Progress tracking and status updates")
    print("- Multiple choice and short answer question types")
    print("- Submission confirmation and feedback")
    
    # 8. RECOMMENDATIONS
    print(f"\n\n8. WORKFLOW IMPROVEMENT RECOMMENDATIONS")
    print("-" * 50)
    
    print("Critical Issues to Address:")
    if missing_assignments:
        print(f"1. Fix assignment visibility - {len(missing_assignments)} students missing assignments")
    if incomplete > 0:
        print(f"2. Handle incomplete attempts - {incomplete} stalled attempts")
    if overdue > 0:
        print(f"3. Manage overdue assignments - {overdue} overdue submissions")
    
    print("\nWorkflow Enhancements:")
    print("1. Implement automatic StudentAssignment creation on assignment publish")
    print("2. Add assignment attempt timeout handling")
    print("3. Improve error handling in frontend components")
    print("4. Add real-time progress synchronization")
    print("5. Implement assignment notification system")
    
    conn.close()
    print(f"\n=== ANALYSIS COMPLETE ===")

def test_student_assignment_access():
    """Test a specific student's assignment access"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n=== TESTING STUDENT ASSIGNMENT ACCESS ===")
    
    # Get a test student
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.user_id, s.current_class_id
        FROM students s
        WHERE s.is_active = 1
        LIMIT 1
    """)
    student = cursor.fetchone()
    
    if not student:
        print("No active students found")
        return
    
    student_id, student_number, first_name, last_name, user_id, class_id = student
    
    print(f"Testing access for: {first_name} {last_name} ({student_number})")
    print(f"Student ID: {student_id}, User ID: {user_id}, Class ID: {class_id}")
    
    # Test assignment visibility
    cursor.execute("""
        SELECT a.id, a.title, a.assignment_type, a.status
        FROM assignments a
        WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
    """, (class_id,))
    assignments = cursor.fetchall()
    
    print(f"\nPublished assignments in class: {len(assignments)}")
    
    for assignment in assignments:
        assignment_id, title, assignment_type, status = assignment
        
        # Check if student has StudentAssignment record
        cursor.execute("""
            SELECT sa.id, sa.status, sa.score
            FROM student_assignments sa
            WHERE sa.assignment_id = ? AND sa.student_id = ?
        """, (assignment_id, student_id))
        student_assignment = cursor.fetchone()
        
        print(f"\nAssignment: '{title}' (ID: {assignment_id})")
        print(f"  Type: {assignment_type}")
        
        if student_assignment:
            sa_id, sa_status, sa_score = student_assignment
            print(f"  ✅ Visible to student (SA ID: {sa_id})")
            print(f"  Status: {sa_status}, Score: {sa_score}")
            
            # If it's a quiz, check for attempts
            if assignment_type in ['QUIZ', 'EXAM']:
                cursor.execute("""
                    SELECT qa.id, qa.status, qa.score, qa.started_at
                    FROM quiz_attempts qa
                    WHERE qa.assignment_id = ? AND qa.student_id = ?
                """, (assignment_id, student_id))
                attempt = cursor.fetchone()
                
                if attempt:
                    qa_id, qa_status, qa_score, started_at = attempt
                    print(f"  Quiz Attempt: {qa_status} (Score: {qa_score})")
                else:
                    print(f"  No quiz attempt yet")
        else:
            print(f"  ❌ NOT visible to student - Missing StudentAssignment record")
    
    conn.close()

if __name__ == "__main__":
    analyze_student_assignment_workflow()
    test_student_assignment_access()