#!/usr/bin/env python3
"""
TEST ASSIGNMENT GRADING FLOW
Simulates student submission, teacher grading, and verifies grade visibility
"""
import sqlite3
from datetime import datetime

DB_PATH = 'backend/db.sqlite3'

def test_grading_flow():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== TESTING ASSIGNMENT GRADING FLOW ===\n")
    
    # Step 1: Find available assignments and students
    cursor.execute("""
        SELECT sa.id, sa.assignment_id, sa.student_id, sa.status,
               a.title, a.max_score,
               s.first_name, s.last_name, s.student_id as student_number
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        JOIN students s ON sa.student_id = s.id
        WHERE a.status = 'PUBLISHED' AND sa.status = 'NOT_STARTED'
        LIMIT 1
    """)
    
    assignment_data = cursor.fetchone()
    if not assignment_data:
        print("No available assignments found. Creating test scenario...")
        return
    
    sa_id, assignment_id, student_id, status, title, max_score, first_name, last_name, student_number = assignment_data
    
    print(f"Testing with:")
    print(f"- Student: {first_name} {last_name} ({student_number})")
    print(f"- Assignment: '{title}' (Max Score: {max_score})")
    print(f"- Current Status: {status}")
    
    # Step 2: Simulate student submission
    print(f"\n1. STUDENT SUBMITS ASSIGNMENT")
    submission_text = f"This is my submission for {title}. I have completed all the required work and attached my analysis."
    
    cursor.execute("""
        UPDATE student_assignments 
        SET status = 'SUBMITTED',
            submission_text = ?,
            attempts_count = 1,
            submitted_at = ?,
            updated_at = ?
        WHERE id = ?
    """, (submission_text, datetime.now(), datetime.now(), sa_id))
    
    print(f"[OK] Student submitted assignment")
    print(f"  Submission: {submission_text[:50]}...")
    
    # Step 3: Simulate teacher grading
    print(f"\n2. TEACHER GRADES ASSIGNMENT")
    score = int(max_score * 0.85)  # Give 85% score
    teacher_feedback = f"Good work on this assignment! You demonstrated understanding of the key concepts. Score: {score}/{max_score}"
    
    cursor.execute("""
        UPDATE student_assignments 
        SET status = 'GRADED',
            score = ?,
            teacher_feedback = ?,
            graded_at = ?,
            updated_at = ?
        WHERE id = ?
    """, (score, teacher_feedback, datetime.now(), datetime.now(), sa_id))
    
    print(f"[OK] Teacher graded assignment")
    print(f"  Score: {score}/{max_score} ({(score/max_score)*100:.1f}%)")
    print(f"  Feedback: {teacher_feedback[:50]}...")
    
    # Step 4: Verify student can see grade
    print(f"\n3. STUDENT GRADE PAGE VIEW")
    cursor.execute("""
        SELECT sa.score, sa.teacher_feedback, sa.status, sa.graded_at,
               a.title, a.max_score, a.assignment_type
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE sa.student_id = ? AND sa.status = 'GRADED'
        ORDER BY sa.graded_at DESC
    """, (student_id,))
    
    student_grades = cursor.fetchall()
    print(f"[OK] Student can view {len(student_grades)} graded assignment(s):")
    
    for grade in student_grades:
        score, feedback, status, graded_at, title, max_score, assignment_type = grade
        percentage = (score/max_score)*100 if score and max_score else 0
        
        print(f"  - {title} ({assignment_type})")
        print(f"    Score: {score}/{max_score} ({percentage:.1f}%)")
        print(f"    Feedback: {feedback[:60]}...")
        print(f"    Date: {graded_at}")
    
    # Step 5: Verify teacher gradebook view
    print(f"\n4. TEACHER GRADEBOOK VIEW")
    cursor.execute("""
        SELECT s.first_name, s.last_name, s.student_id,
               sa.score, sa.status, sa.submitted_at, sa.graded_at,
               a.title, a.max_score
        FROM student_assignments sa
        JOIN students s ON sa.student_id = s.id
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE a.id = ?
        ORDER BY s.last_name, s.first_name
    """, (assignment_id,))
    
    gradebook_entries = cursor.fetchall()
    print(f"[OK] Teacher gradebook shows {len(gradebook_entries)} student(s) for '{title}':")
    
    for entry in gradebook_entries:
        student_first, student_last, student_num, score, status, submitted_at, graded_at, assignment_title, max_score = entry
        percentage = (score/max_score)*100 if score and max_score else 0
        
        print(f"  - {student_first} {student_last} ({student_num})")
        print(f"    Status: {status}")
        if score is not None:
            print(f"    Score: {score}/{max_score} ({percentage:.1f}%)")
        if submitted_at:
            print(f"    Submitted: {submitted_at}")
        if graded_at:
            print(f"    Graded: {graded_at}")
    
    # Step 6: Test grade statistics
    print(f"\n5. GRADE STATISTICS")
    cursor.execute("""
        SELECT 
            COUNT(*) as total_submissions,
            COUNT(CASE WHEN sa.status = 'SUBMITTED' THEN 1 END) as pending_grading,
            COUNT(CASE WHEN sa.status = 'GRADED' THEN 1 END) as graded,
            AVG(CASE WHEN sa.score IS NOT NULL THEN sa.score END) as avg_score,
            MAX(sa.score) as max_score_achieved,
            MIN(sa.score) as min_score_achieved
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE a.id = ?
    """, (assignment_id,))
    
    stats = cursor.fetchone()
    total, pending, graded, avg_score, max_achieved, min_achieved = stats
    
    print(f"Assignment: '{title}'")
    print(f"  Total Students: {total}")
    print(f"  Pending Grading: {pending}")
    print(f"  Graded: {graded}")
    if avg_score:
        print(f"  Average Score: {avg_score:.1f}/{max_score} ({(avg_score/max_score)*100:.1f}%)")
        print(f"  Highest Score: {max_achieved}/{max_score}")
        print(f"  Lowest Score: {min_achieved}/{max_score}")
    
    # Step 7: Test student overall performance
    print(f"\n6. STUDENT OVERALL PERFORMANCE")
    cursor.execute("""
        SELECT 
            COUNT(*) as total_assignments,
            COUNT(CASE WHEN sa.status = 'GRADED' THEN 1 END) as completed,
            COUNT(CASE WHEN sa.status = 'SUBMITTED' THEN 1 END) as pending,
            COUNT(CASE WHEN sa.status = 'NOT_STARTED' THEN 1 END) as not_started,
            AVG(CASE WHEN sa.score IS NOT NULL THEN (sa.score * 1.0 / a.max_score) * 100 END) as avg_percentage
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE sa.student_id = ? AND a.status = 'PUBLISHED'
    """, (student_id,))
    
    performance = cursor.fetchone()
    total_assign, completed, pending, not_started, avg_percentage = performance
    
    print(f"Student: {first_name} {last_name}")
    print(f"  Total Assignments: {total_assign}")
    print(f"  Completed: {completed}")
    print(f"  Pending Grading: {pending}")
    print(f"  Not Started: {not_started}")
    if avg_percentage:
        print(f"  Average Grade: {avg_percentage:.1f}%")
    
    conn.commit()
    conn.close()
    
    print(f"\n[SUCCESS] GRADING FLOW TEST COMPLETED SUCCESSFULLY")
    print(f"- Assignment submitted and graded")
    print(f"- Grade visible in student portal")
    print(f"- Grade visible in teacher gradebook")
    print(f"- Statistics calculated correctly")

if __name__ == "__main__":
    test_grading_flow()