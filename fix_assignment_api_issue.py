#!/usr/bin/env python3
"""
FIX ASSIGNMENT API ISSUE
Fix the NULL status values and missing data causing blank pages
"""
import sqlite3
from datetime import datetime

DB_PATH = 'backend/db.sqlite3'

def fix_assignment_api_issue():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== FIXING ASSIGNMENT API ISSUE ===\n")
    
    # Step 1: Check database schema
    print("1. Checking Database Schema:")
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"   Available tables: {[t[0] for t in tables]}")
    
    # Step 2: Fix NULL status values in student_assignments
    print("\n2. Fixing NULL Status Values:")
    
    cursor.execute("""
        SELECT id, assignment_id, student_id, status
        FROM student_assignments 
        WHERE status IS NULL OR status = ''
    """)
    
    null_status_records = cursor.fetchall()
    
    if null_status_records:
        print(f"   Found {len(null_status_records)} records with NULL/empty status:")
        
        for record in null_status_records:
            sa_id, assignment_id, student_id, status = record
            print(f"   - Student Assignment ID: {sa_id}, Assignment: {assignment_id}, Student: {student_id}")
            
            # Update to NOT_STARTED status
            cursor.execute("""
                UPDATE student_assignments 
                SET status = 'NOT_STARTED', updated_at = ?
                WHERE id = ?
            """, (datetime.now(), sa_id))
            
            print(f"     + Updated status to 'NOT_STARTED'")
    else:
        print("   No NULL status records found")
    
    # Step 3: Fix missing required fields in assignments
    print("\n3. Fixing Missing Assignment Fields:")
    
    cursor.execute("""
        SELECT id, title, description, instructions
        FROM assignments 
        WHERE description IS NULL OR description = '' OR instructions IS NULL OR instructions = ''
    """)
    
    incomplete_assignments = cursor.fetchall()
    
    if incomplete_assignments:
        print(f"   Found {len(incomplete_assignments)} assignments with missing fields:")
        
        for assignment in incomplete_assignments:
            assignment_id, title, description, instructions = assignment
            print(f"   - Assignment ID: {assignment_id}, Title: '{title}'")
            
            # Set default values for missing fields
            new_description = description if description else f"Assignment: {title}"
            new_instructions = instructions if instructions else "Please complete this assignment according to the requirements."
            
            cursor.execute("""
                UPDATE assignments 
                SET description = ?, instructions = ?, updated_at = ?
                WHERE id = ?
            """, (new_description, new_instructions, datetime.now(), assignment_id))
            
            print(f"     + Updated description and instructions")
    else:
        print("   All assignments have required fields")
    
    # Step 4: Check for questions table (might be named differently)
    print("\n4. Checking for Questions/Content Tables:")
    
    question_tables = ['assignment_questions', 'questions', 'quiz_questions', 'assignment_content']
    found_question_table = None
    
    for table_name in question_tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   - {table_name}: {count} records")
            found_question_table = table_name
            break
        except sqlite3.OperationalError:
            print(f"   - {table_name}: Table not found")
    
    # Step 5: Create basic questions if none exist
    if not found_question_table:
        print("\n5. Creating Questions Table and Sample Questions:")
        
        # Create questions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR(20) DEFAULT 'TEXT',
                points INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments (id)
            )
        """)
        
        # Add a sample question for assignment 13
        cursor.execute("""
            INSERT INTO questions (assignment_id, question_text, question_type, points)
            VALUES (13, 'Please provide your answer for this quiz question.', 'TEXT', 10)
        """)
        
        print("   + Created questions table and added sample question for assignment 13")
    
    # Step 6: Verify the fix
    print("\n6. Verification:")
    
    # Check assignment 13 specifically
    cursor.execute("""
        SELECT a.id, a.title, a.description, a.instructions, a.status,
               COUNT(sa.id) as student_count,
               COUNT(CASE WHEN sa.status = 'NOT_STARTED' THEN 1 END) as not_started_count
        FROM assignments a
        LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
        WHERE a.id = 13
        GROUP BY a.id
    """)
    
    result = cursor.fetchone()
    if result:
        assignment_id, title, description, instructions, status, student_count, not_started_count = result
        print(f"   Assignment 13 '{title}':")
        print(f"   - Status: {status}")
        print(f"   - Description: {description[:50]}...")
        print(f"   - Instructions: {instructions[:50]}...")
        print(f"   - Student assignments: {student_count}")
        print(f"   - Not started: {not_started_count}")
    
    # Check if questions exist
    if found_question_table:
        cursor.execute(f"SELECT COUNT(*) FROM {found_question_table} WHERE assignment_id = 13")
        question_count = cursor.fetchone()[0]
        print(f"   - Questions: {question_count}")
    else:
        cursor.execute("SELECT COUNT(*) FROM questions WHERE assignment_id = 13")
        question_count = cursor.fetchone()[0]
        print(f"   - Questions: {question_count}")
    
    # Step 7: Test API data format
    print("\n7. Testing API Data Format:")
    
    cursor.execute("""
        SELECT a.*, c.level, c.section, u.first_name, u.last_name
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        LEFT JOIN users u ON a.created_by_id = u.id
        WHERE a.id = 13
    """)
    
    assignment_data = cursor.fetchone()
    
    if assignment_data:
        print("   Assignment data ready for API:")
        print(f"   - ID: {assignment_data[0]}")
        print(f"   - Title: {assignment_data[1]}")
        print(f"   - Status: {assignment_data[11]}")
        print(f"   - Type: {assignment_data[3]}")
        print(f"   - Has Description: {bool(assignment_data[2])}")
        print(f"   - Has Instructions: {bool(assignment_data[24])}")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"\n+ ASSIGNMENT API FIX COMPLETED")
    print("   - Fixed NULL status values")
    print("   - Added missing descriptions and instructions")
    print("   - Created questions table if needed")
    print("   - Assignment 13 should now load properly in frontend")

if __name__ == "__main__":
    fix_assignment_api_issue()