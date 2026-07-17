#!/usr/bin/env python3
"""
STUDENT ASSIGNMENT WORKFLOW ANALYSIS - SIMPLIFIED
Complete analysis of how students view, attempt, and submit assignments
"""
import sqlite3
from datetime import datetime
import json

DB_PATH = 'backend/db.sqlite3'

def analyze_student_workflow():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== STUDENT ASSIGNMENT WORKFLOW ANALYSIS ===\n")
    
    # 1. STUDENT ASSIGNMENT VISIBILITY
    print("1. ASSIGNMENT VISIBILITY FOR STUDENTS")
    print("-" * 50)
    
    # Get all active students with their assignments
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
               c.level, c.section
        FROM students s
        LEFT JOIN classes c ON s.current_class_id = c.id
        WHERE s.is_active = 1
        ORDER BY s.first_name, s.last_name
    """)
    students = cursor.fetchall()
    
    print(f"Total Active Students: {len(students)}\n")
    
    for student in students:
        student_id, student_number, first_name, last_name, class_id, level, section = student
        class_name = f"{level} {section}" if level and section else f"Class {class_id}"
        
        print(f"Student: {first_name} {last_name} ({student_number})")
        print(f"  Class: {class_name} (ID: {class_id})")
        
        # Get published assignments for this student's class
        cursor.execute("""
            SELECT a.id, a.title, a.assignment_type, a.due_date, a.max_score, a.status
            FROM assignments a
            WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (class_id,))
        class_assignments = cursor.fetchall()
        
        print(f"  Published assignments in class: {len(class_assignments)}")
        
        # Get StudentAssignment records (what student can actually see)
        cursor.execute("""
            SELECT sa.id, sa.status, sa.score, sa.submitted_at, sa.attempts_count,
                   a.title, a.assignment_type, a.due_date
            FROM student_assignments sa
            JOIN assignments a ON sa.assignment_id = a.id
            WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
            ORDER BY a.created_at DESC
        """, (student_id,))
        student_assignments = cursor.fetchall()
        
        print(f"  Visible assignments: {len(student_assignments)}")
        
        if student_assignments:
            for sa in student_assignments:
                sa_id, status, score, submitted_at, attempts, title, assignment_type, due_date = sa
                status_icon = {
                    'NOT_STARTED': '⏳',
                    'IN_PROGRESS': '🔄',
                    'SUBMITTED': '✅',
                    'GRADED': '📊'
                }.get(status, '❓')
                
                print(f"    {status_icon} '{title}' ({assignment_type})")
                print(f"       Status: {status}, Score: {score}, Attempts: {attempts}")
                if due_date:
                    print(f"       Due: {due_date}")
        
        # Check for missing assignments
        missing_count = len(class_assignments) - len(student_assignments)
        if missing_count > 0:
            print(f"  ⚠️  ISSUE: {missing_count} assignments not visible to student!")
        
        print()
    
    # 2. ASSIGNMENT ATTEMPT TRACKING
    print("\n2. ASSIGNMENT ATTEMPT TRACKING")
    print("-" * 50)
    
    # Get quiz attempts
    cursor.execute("""
        SELECT qa.id, qa.assignment_id, qa.student_id, qa.status, qa.score, 
               qa.started_at, qa.submitted_at,
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
    
    if attempts:
        for attempt in attempts:
            attempt_id, assignment_id, student_id, status, score, started_at, submitted_at, title, assignment_type, time_limit, first_name, last_name = attempt
            
            print(f"\n📝 Attempt #{attempt_id}")
            print(f"   Student: {first_name} {last_name}")
            print(f"   Assignment: '{title}' ({assignment_type})")
            print(f"   Status: {status}")
            print(f"   Score: {score}")
            print(f"   Started: {started_at}")
            print(f"   Submitted: {submitted_at}")
            if time_limit:
                print(f"   Time Limit: {time_limit} minutes")
            
            # Get answers for this attempt
            cursor.execute("""
                SELECT qa.question_id, qa.answer_text, qa.selected_option_id, 
                       qa.is_correct, qa.points_earned,
                       q.question_text, q.question_type, q.points
                FROM quiz_answers qa
                JOIN questions q ON qa.question_id = q.id
                WHERE qa.attempt_id = ?
                ORDER BY q.order, q.id
            """, (attempt_id,))
            answers = cursor.fetchall()
            
            print(f"   Answers: {len(answers)}")
            correct_answers = sum(1 for a in answers if a[3])  # is_correct
            if answers:
                print(f"   Correct: {correct_answers}/{len(answers)}")
    else:
        print("No quiz attempts found")
    
    # 3. SUBMISSION STATISTICS
    print("\n\n3. SUBMISSION STATISTICS")
    print("-" * 50)
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
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
    
    print(f"Overall Assignment Status:")
    print(f"  📊 Total Assignments: {total}")
    print(f"  ⏳ Not Started: {not_started} ({not_started/total*100:.1f}%)" if total > 0 else "  ⏳ Not Started: 0")
    print(f"  🔄 In Progress: {in_progress} ({in_progress/total*100:.1f}%)" if total > 0 else "  🔄 In Progress: 0")
    print(f"  ✅ Submitted: {submitted} ({submitted/total*100:.1f}%)" if total > 0 else "  ✅ Submitted: 0")
    print(f"  📊 Graded: {graded} ({graded/total*100:.1f}%)" if total > 0 else "  📊 Graded: 0")
    
    # 4. WORKFLOW ISSUES
    print("\n\n4. WORKFLOW ISSUES ANALYSIS")
    print("-" * 50)
    
    # Find students missing assignments
    cursor.execute("""
        SELECT s.id, s.first_name, s.last_name, s.current_class_id,
               COUNT(DISTINCT a.id) as class_assignments,
               COUNT(DISTINCT sa.id) as visible_assignments
        FROM students s
        LEFT JOIN assignments a ON s.current_class_id = a.class_instance_id AND a.status = 'PUBLISHED'
        LEFT JOIN student_assignments sa ON s.id = sa.student_id AND sa.assignment_id = a.id
        WHERE s.is_active = 1
        GROUP BY s.id, s.first_name, s.last_name, s.current_class_id
        HAVING COUNT(DISTINCT a.id) > COUNT(DISTINCT sa.id)
    """)
    missing_assignments = cursor.fetchall()
    
    print(f"🚨 Students with Missing Assignment Visibility: {len(missing_assignments)}")
    for student in missing_assignments:
        student_id, first_name, last_name, class_id, class_assignments, visible_assignments = student
        missing = class_assignments - visible_assignments
        print(f"   {first_name} {last_name}: Missing {missing} out of {class_assignments} assignments")
    
    # Find incomplete attempts
    cursor.execute("""
        SELECT COUNT(*) as incomplete
        FROM quiz_attempts
        WHERE status = 'IN_PROGRESS' AND started_at < datetime('now', '-1 hour')
    """)
    incomplete = cursor.fetchone()[0]
    
    if incomplete > 0:
        print(f"\n⏰ Stalled Attempts (>1 hour): {incomplete}")
    
    # Find overdue assignments
    cursor.execute("""
        SELECT COUNT(*) as overdue
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE a.due_date < datetime('now') 
        AND sa.status = 'NOT_STARTED'
        AND a.status = 'PUBLISHED'
    """)
    overdue = cursor.fetchone()[0]
    
    if overdue > 0:
        print(f"📅 Overdue Assignments: {overdue}")
    
    # 5. STUDENT WORKFLOW STEPS
    print("\n\n5. STUDENT WORKFLOW STEPS")
    print("-" * 50)
    
    print("How Students View and Attempt Assignments:")
    print()
    print("STEP 1: LOGIN & DASHBOARD ACCESS")
    print("  • Student logs in with username/password")
    print("  • System identifies student record and class")
    print("  • Dashboard loads via /api/assignments/student/my-assignments/")
    print()
    print("STEP 2: ASSIGNMENT VISIBILITY")
    print("  • System finds published assignments for student's class")
    print("  • Checks for existing StudentAssignment records")
    print("  • Auto-creates missing StudentAssignment records")
    print("  • Displays assignments with status (NOT_STARTED, IN_PROGRESS, etc.)")
    print()
    print("STEP 3: STARTING AN ASSIGNMENT")
    print("  • Student clicks 'Take Assignment' button")
    print("  • Frontend calls /api/assignments/student/{id}/take/")
    print("  • System verifies student access to assignment")
    print("  • Returns assignment details and questions")
    print()
    print("STEP 4: ATTEMPTING ASSIGNMENT")
    print("  • For QUIZ/EXAM: Creates QuizAttempt record")
    print("  • Student answers questions in frontend interface")
    print("  • Auto-save functionality saves progress periodically")
    print("  • Timer countdown for timed assignments")
    print()
    print("STEP 5: SUBMISSION")
    print("  • Student clicks 'Submit Assignment'")
    print("  • Frontend calls /api/assignments/student/{id}/submit/")
    print("  • System processes answers and calculates score")
    print("  • Updates StudentAssignment status to SUBMITTED/GRADED")
    print("  • Returns final score and feedback")
    
    # 6. API ENDPOINTS
    print("\n\n6. KEY API ENDPOINTS")
    print("-" * 50)
    
    print("Student Assignment APIs:")
    print("  GET  /api/assignments/student/my-assignments/")
    print("       → List all assignments for logged-in student")
    print()
    print("  GET  /api/assignments/student/{id}/take/")
    print("       → Get assignment details and questions for attempt")
    print()
    print("  POST /api/assignments/student/{id}/save/")
    print("       → Save work in progress (auto-save)")
    print()
    print("  POST /api/assignments/student/{id}/submit/")
    print("       → Submit final answers and get score")
    print()
    print("  GET  /api/assignments/student/{id}/submission/")
    print("       → Get submission status and results")
    
    # 7. FRONTEND COMPONENTS
    print("\n\n7. FRONTEND COMPONENTS")
    print("-" * 50)
    
    print("Key React Components:")
    print("  📱 StudentDashboard.jsx")
    print("     → Main assignment list and overview")
    print()
    print("  📝 StudentAssignmentView.jsx")
    print("     → Assignment taking interface with questions")
    print()
    print("  🔄 AssignmentSubmissionFlow.jsx")
    print("     → Handles submission process and confirmation")
    print()
    print("  📊 StudentAssignments.jsx")
    print("     → Assignment history and results")
    
    conn.close()
    print(f"\n=== ANALYSIS COMPLETE ===")

def test_specific_student():
    """Test assignment access for a specific student"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n=== TESTING SPECIFIC STUDENT ACCESS ===")
    
    # Get first active student
    cursor.execute("""
        SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id
        FROM students s
        WHERE s.is_active = 1
        LIMIT 1
    """)
    student = cursor.fetchone()
    
    if not student:
        print("No active students found")
        return
    
    student_id, student_number, first_name, last_name, class_id = student
    
    print(f"Testing: {first_name} {last_name} ({student_number})")
    print(f"Class ID: {class_id}")
    
    # Test API simulation
    print(f"\n🔍 Simulating API Call: /api/assignments/student/my-assignments/")
    
    # Step 1: Find published assignments for student's class
    cursor.execute("""
        SELECT a.id, a.title, a.assignment_type, a.status
        FROM assignments a
        WHERE a.class_instance_id = ? AND a.status = 'PUBLISHED'
    """, (class_id,))
    published_assignments = cursor.fetchall()
    
    print(f"   Found {len(published_assignments)} published assignments in class")
    
    # Step 2: Check existing StudentAssignment records
    cursor.execute("""
        SELECT sa.assignment_id, sa.status, sa.score
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
    """, (student_id,))
    existing_assignments = cursor.fetchall()
    
    print(f"   Student has {len(existing_assignments)} visible assignments")
    
    # Step 3: Show what would be returned to frontend
    print(f"\n📤 API Response Data:")
    for assignment in published_assignments:
        assignment_id, title, assignment_type, status = assignment
        
        # Find corresponding StudentAssignment
        student_assignment = next((sa for sa in existing_assignments if sa[0] == assignment_id), None)
        
        if student_assignment:
            _, sa_status, sa_score = student_assignment
            print(f"   ✅ {title} ({assignment_type})")
            print(f"      Status: {sa_status}, Score: {sa_score}")
        else:
            print(f"   ❌ {title} ({assignment_type}) - MISSING StudentAssignment!")
    
    conn.close()

if __name__ == "__main__":
    analyze_student_workflow()
    test_specific_student()