#!/usr/bin/env python3
"""
QUIZ VALIDATION FIX
Fix the test1 assignment that has validation issues due to missing time limit
"""
import sqlite3
from datetime import datetime

DB_PATH = 'backend/db.sqlite3'

def fix_quiz_validation():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== FIXING QUIZ VALIDATION ISSUE ===\n")
    
    # Step 1: Find the problematic assignment
    print("1. Identifying problematic quiz assignments:")
    
    cursor.execute("""
        SELECT id, title, assignment_type, is_timed, time_limit, status
        FROM assignments 
        WHERE assignment_type = 'QUIZ' AND (is_timed = 0 OR time_limit IS NULL)
    """)
    
    problematic_assignments = cursor.fetchall()
    
    if not problematic_assignments:
        print("   No problematic quiz assignments found.")
        conn.close()
        return
    
    print(f"   Found {len(problematic_assignments)} quiz assignments with validation issues:")
    for assignment in problematic_assignments:
        assignment_id, title, assignment_type, is_timed, time_limit, status = assignment
        print(f"   - ID: {assignment_id}, Title: '{title}', Timed: {bool(is_timed)}, Time Limit: {time_limit}")
    
    # Step 2: Fix each problematic assignment
    print(f"\n2. Fixing quiz assignments:")
    
    fixed_count = 0
    for assignment in problematic_assignments:
        assignment_id, title, assignment_type, is_timed, time_limit, status = assignment
        
        # Set reasonable defaults for quiz
        new_time_limit = 30  # 30 minutes default for quiz
        new_is_timed = 1     # Enable timing
        
        cursor.execute("""
            UPDATE assignments 
            SET is_timed = ?, time_limit = ?, updated_at = ?
            WHERE id = ?
        """, (new_is_timed, new_time_limit, datetime.now(), assignment_id))
        
        print(f"   + Fixed '{title}' (ID: {assignment_id})")
        print(f"     - Set is_timed = True")
        print(f"     - Set time_limit = {new_time_limit} minutes")
        
        fixed_count += 1
    
    # Step 3: Verify the fix
    print(f"\n3. Verification:")
    
    cursor.execute("""
        SELECT id, title, assignment_type, is_timed, time_limit, status
        FROM assignments 
        WHERE assignment_type = 'QUIZ'
    """)
    
    all_quizzes = cursor.fetchall()
    
    print(f"   All quiz assignments after fix:")
    valid_count = 0
    for assignment in all_quizzes:
        assignment_id, title, assignment_type, is_timed, time_limit, status = assignment
        is_valid = bool(is_timed) and time_limit is not None and time_limit > 0
        status_icon = "+" if is_valid else "-"
        
        print(f"   {status_icon} ID: {assignment_id}, '{title}', Timed: {bool(is_timed)}, Limit: {time_limit}min")
        
        if is_valid:
            valid_count += 1
    
    print(f"\n   Summary:")
    print(f"   - Total quiz assignments: {len(all_quizzes)}")
    print(f"   - Valid quiz assignments: {valid_count}")
    print(f"   - Fixed in this run: {fixed_count}")
    
    # Step 4: Test validation by attempting to save
    print(f"\n4. Testing validation:")
    
    for assignment in all_quizzes:
        assignment_id, title, assignment_type, is_timed, time_limit, status = assignment
        
        # Simulate the validation logic from models.py
        validation_passed = True
        validation_errors = []
        
        if assignment_type in ['QUIZ', 'EXAM']:
            if not is_timed or not time_limit:
                validation_passed = False
                validation_errors.append(f'{assignment_type} must have time limit')
        
        if assignment_type == 'EXAM' and status in ['PUBLISHED', 'ACTIVE']:
            # Check max_attempts = 1 for exams (not applicable to quiz, but good to check)
            cursor.execute("SELECT max_attempts FROM assignments WHERE id = ?", (assignment_id,))
            max_attempts = cursor.fetchone()[0]
            if max_attempts != 1:
                validation_errors.append('Exams allow only 1 attempt')
        
        status_icon = "+" if validation_passed else "-"
        print(f"   {status_icon} '{title}' validation: {'PASSED' if validation_passed else 'FAILED'}")
        
        if validation_errors:
            for error in validation_errors:
                print(f"     - Error: {error}")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"\n+ QUIZ VALIDATION FIX COMPLETED")
    print(f"   - Fixed {fixed_count} quiz assignments")
    print(f"   - All quiz assignments now have proper time limits")

if __name__ == "__main__":
    fix_quiz_validation()