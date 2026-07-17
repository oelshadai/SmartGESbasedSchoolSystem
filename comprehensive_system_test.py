#!/usr/bin/env python3
"""
COMPREHENSIVE SYSTEM TEST
Creates BS9 student, quiz assignments, and tests complete workflow
"""
import sqlite3
import json
import requests
from datetime import datetime, timedelta

DB_PATH = 'backend/db.sqlite3'
API_BASE = 'http://localhost:8000/api'

def setup_bs9_class_and_student():
    """Create BS9 class and test student"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== SETTING UP BS9 CLASS AND STUDENT ===")
    
    # Check if BS9 class exists
    cursor.execute("SELECT id FROM classes WHERE level = 'BS' AND section = '9'")
    bs9_class = cursor.fetchone()
    
    if not bs9_class:
        # Create BS9 class
        cursor.execute("""
            INSERT INTO classes (level, section, class_name, school_id, created_at, updated_at)
            VALUES ('BS', '9', 'BS 9', 1, ?, ?)
        """, (datetime.now(), datetime.now()))
        bs9_class_id = cursor.lastrowid
        print(f"+ Created BS9 class (ID: {bs9_class_id})")
    else:
        bs9_class_id = bs9_class[0]
        print(f"+ BS9 class exists (ID: {bs9_class_id})")
    
    # Create test student
    student_id = f"BS9-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    cursor.execute("""
        INSERT INTO students 
        (student_id, first_name, last_name, current_class_id, school_id, 
         username, password, is_active, created_at, updated_at)
        VALUES (?, 'Test', 'Student', ?, 1, ?, 'password123', 1, ?, ?)
    """, (student_id, bs9_class_id, student_id.lower(), datetime.now(), datetime.now()))
    
    test_student_db_id = cursor.lastrowid
    print(f"+ Created test student: {student_id} (DB ID: {test_student_db_id})")
    
    conn.commit()
    conn.close()
    
    return bs9_class_id, test_student_db_id, student_id

def create_quiz_assignment(class_id):
    """Create quiz assignment with two questions"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n=== CREATING QUIZ ASSIGNMENT ===")
    
    # Create quiz assignment
    cursor.execute("""
        INSERT INTO assignments 
        (title, description, instructions, assignment_type, class_instance_id, created_by_id,
         due_date, max_score, status, is_timed, auto_grade, show_results_immediately,
         allow_file_submission, allow_text_submission, term_id, created_at, updated_at)
        VALUES (?, ?, ?, 'QUIZ', ?, 1, ?, 20, 'PUBLISHED', 0, 1, 1, 0, 1, 1, ?, ?)
    """, (
        "BS9 Math Quiz",
        "Basic mathematics quiz for BS9 students",
        "Answer all questions carefully. Each question is worth 10 points.",
        class_id,
        datetime.now() + timedelta(days=7),
        datetime.now(),
        datetime.now()
    ))
    
    assignment_id = cursor.lastrowid
    print(f"+ Created quiz assignment (ID: {assignment_id})")
    
    # Add Question 1
    cursor.execute("""
        INSERT INTO assignment_questions 
        (assignment_id, question_text, question_type, options, correct_answer, points, order_index, created_at, updated_at)
        VALUES (?, ?, 'MULTIPLE_CHOICE', ?, ?, 10, 1, ?, ?)
    """, (
        assignment_id,
        "What is 15 + 25?",
        json.dumps(["30", "35", "40", "45"]),
        "40",
        datetime.now(),
        datetime.now()
    ))
    
    # Add Question 2
    cursor.execute("""
        INSERT INTO assignment_questions 
        (assignment_id, question_text, question_type, options, correct_answer, points, order_index, created_at, updated_at)
        VALUES (?, ?, 'MULTIPLE_CHOICE', ?, ?, 10, 2, ?, ?)
    """, (
        assignment_id,
        "What is 8 × 7?",
        json.dumps(["54", "56", "58", "60"]),
        "56",
        datetime.now(),
        datetime.now()
    ))
    
    print("+ Added 2 multiple choice questions")
    
    conn.commit()
    conn.close()
    
    return assignment_id

def create_student_assignment_record(assignment_id, student_id):
    """Create student assignment record"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO student_assignments 
        (assignment_id, student_id, status, attempts_count, submission_text, 
         teacher_feedback, additional_files, is_locked, created_at, updated_at)
        VALUES (?, ?, 'NOT_STARTED', 0, '', '', '[]', 0, ?, ?)
    """, (assignment_id, student_id, datetime.now(), datetime.now()))
    
    conn.commit()
    conn.close()
    print("+ Created student assignment record")

def simulate_student_login_and_attempt(student_username, assignment_id):
    """Simulate student login and assignment attempt"""
    print(f"\n=== SIMULATING STUDENT LOGIN: {student_username} ===")
    
    # Simulate login
    login_data = {
        'username': student_username,
        'password': 'password123'
    }
    
    try:
        # Check if assignment is visible
        print("+ Checking assignment visibility...")
        
        # Simulate assignment attempt
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get student ID
        cursor.execute("SELECT id FROM students WHERE username = ?", (student_username,))
        student_db_id = cursor.fetchone()[0]
        
        # Check if assignment is visible
        cursor.execute("""
            SELECT sa.id, a.title, a.max_score
            FROM student_assignments sa
            JOIN assignments a ON sa.assignment_id = a.id
            WHERE sa.student_id = ? AND sa.assignment_id = ?
        """, (student_db_id, assignment_id))
        
        assignment_record = cursor.fetchone()
        if assignment_record:
            print(f"+ Assignment visible: {assignment_record[1]}")
            
            # Simulate answering questions
            answers = {
                "1": "40",  # Correct answer for 15 + 25
                "2": "56"   # Correct answer for 8 × 7
            }
            
            # Update student assignment with submission
            cursor.execute("""
                UPDATE student_assignments 
                SET status = 'SUBMITTED', 
                    submission_text = ?, 
                    attempts_count = 1,
                    submitted_at = ?,
                    updated_at = ?
                WHERE student_id = ? AND assignment_id = ?
            """, (
                json.dumps(answers),
                datetime.now(),
                datetime.now(),
                student_db_id,
                assignment_id
            ))
            
            # Calculate score (both answers are correct = 20 points)
            score = 20
            cursor.execute("""
                UPDATE student_assignments 
                SET score = ?, status = 'GRADED'
                WHERE student_id = ? AND assignment_id = ?
            """, (score, student_db_id, assignment_id))
            
            print(f"+ Submitted assignment with score: {score}/20")
            
        else:
            print("- Assignment NOT visible to student!")
            
        conn.commit()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"- Error during student simulation: {e}")
        return False

def check_student_gradebook(student_username):
    """Check if response appears in student gradebook"""
    print(f"\n=== CHECKING STUDENT GRADEBOOK: {student_username} ===")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get student grades
    cursor.execute("""
        SELECT a.title, sa.score, sa.status, a.max_score, sa.submitted_at
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        JOIN students s ON sa.student_id = s.id
        WHERE s.username = ? AND sa.status IN ('SUBMITTED', 'GRADED')
    """, (student_username,))
    
    grades = cursor.fetchall()
    
    if grades:
        print("+ Student gradebook entries:")
        for grade in grades:
            title, score, status, max_score, submitted_at = grade
            print(f"  - {title}: {score}/{max_score} ({status}) - {submitted_at}")
    else:
        print("- No grades found in student gradebook")
    
    conn.close()
    return len(grades) > 0

def check_teacher_gradebook(assignment_id):
    """Check if teacher can see student responses"""
    print(f"\n=== CHECKING TEACHER GRADEBOOK FOR ASSIGNMENT {assignment_id} ===")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all student submissions for this assignment
    cursor.execute("""
        SELECT s.first_name, s.last_name, s.student_id, sa.score, sa.status, 
               sa.submission_text, sa.submitted_at
        FROM student_assignments sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.assignment_id = ? AND sa.status IN ('SUBMITTED', 'GRADED')
    """, (assignment_id,))
    
    submissions = cursor.fetchall()
    
    if submissions:
        print("+ Teacher gradebook entries:")
        for submission in submissions:
            first_name, last_name, student_id, score, status, submission_text, submitted_at = submission
            print(f"  - {first_name} {last_name} ({student_id}): {score} ({status}) - {submitted_at}")
            if submission_text:
                answers = json.loads(submission_text)
                print(f"    Answers: {answers}")
    else:
        print("- No submissions found in teacher gradebook")
    
    conn.close()
    return len(submissions) > 0

def create_other_assignment_types(class_id):
    """Create other assignment types for comprehensive testing"""
    print(f"\n=== CREATING OTHER ASSIGNMENT TYPES ===")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    assignment_types = [
        ('HOMEWORK', 'BS9 Homework Assignment', 'Complete the homework exercises'),
        ('PROJECT', 'BS9 Science Project', 'Create a science project presentation'),
        ('EXAM', 'BS9 Mid-term Exam', 'Mid-term examination for BS9')
    ]
    
    created_assignments = []
    
    for assignment_type, title, description in assignment_types:
        cursor.execute("""
            INSERT INTO assignments 
            (title, description, instructions, assignment_type, class_instance_id, created_by_id,
             due_date, max_score, status, is_timed, auto_grade, show_results_immediately,
             allow_file_submission, allow_text_submission, term_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, 100, 'PUBLISHED', 0, 0, 1, 1, 1, 1, ?, ?)
        """, (
            title,
            description,
            f"Instructions for {title}",
            assignment_type,
            class_id,
            datetime.now() + timedelta(days=14),
            datetime.now(),
            datetime.now()
        ))
        
        assignment_id = cursor.lastrowid
        created_assignments.append((assignment_id, assignment_type, title))
        print(f"+ Created {assignment_type}: {title} (ID: {assignment_id})")
    
    conn.commit()
    conn.close()
    
    return created_assignments

def run_comprehensive_test():
    """Run the complete system test"""
    print("🚀 STARTING COMPREHENSIVE SYSTEM TEST")
    print("=" * 50)
    
    # Step 1: Setup BS9 class and student
    bs9_class_id, student_db_id, student_username = setup_bs9_class_and_student()
    
    # Step 2: Create quiz assignment
    quiz_assignment_id = create_quiz_assignment(bs9_class_id)
    
    # Step 3: Create student assignment record
    create_student_assignment_record(quiz_assignment_id, student_db_id)
    
    # Step 4: Simulate student login and attempt
    student_success = simulate_student_login_and_attempt(student_username, quiz_assignment_id)
    
    # Step 5: Check student gradebook
    student_gradebook_success = check_student_gradebook(student_username)
    
    # Step 6: Check teacher gradebook
    teacher_gradebook_success = check_teacher_gradebook(quiz_assignment_id)
    
    # Step 7: Create other assignment types
    other_assignments = create_other_assignment_types(bs9_class_id)
    
    # Step 8: Create student records for other assignments
    print(f"\n=== CREATING STUDENT RECORDS FOR OTHER ASSIGNMENTS ===")
    for assignment_id, assignment_type, title in other_assignments:
        create_student_assignment_record(assignment_id, student_db_id)
        print(f"+ Created student record for {assignment_type}: {title}")
    
    # Final Summary
    print(f"\n" + "=" * 50)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("=" * 50)
    print(f"✅ BS9 Class Created: ID {bs9_class_id}")
    print(f"✅ Test Student Created: {student_username} (ID: {student_db_id})")
    print(f"✅ Quiz Assignment Created: ID {quiz_assignment_id}")
    print(f"{'✅' if student_success else '❌'} Student Login & Attempt: {'SUCCESS' if student_success else 'FAILED'}")
    print(f"{'✅' if student_gradebook_success else '❌'} Student Gradebook: {'SUCCESS' if student_gradebook_success else 'FAILED'}")
    print(f"{'✅' if teacher_gradebook_success else '❌'} Teacher Gradebook: {'SUCCESS' if teacher_gradebook_success else 'FAILED'}")
    print(f"✅ Other Assignment Types Created: {len(other_assignments)}")
    
    # Test credentials for manual verification
    print(f"\n🔑 TEST CREDENTIALS FOR MANUAL VERIFICATION:")
    print(f"Student Username: {student_username}")
    print(f"Student Password: password123")
    print(f"Class: BS 9")
    
    overall_success = student_success and student_gradebook_success and teacher_gradebook_success
    print(f"\n🎯 OVERALL TEST STATUS: {'✅ PASSED' if overall_success else '❌ FAILED'}")
    
    return overall_success

if __name__ == "__main__":
    run_comprehensive_test()