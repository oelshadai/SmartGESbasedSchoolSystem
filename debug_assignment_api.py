#!/usr/bin/env python3
"""
DEBUG ASSIGNMENT API
Check assignment ID 13 data and API response
"""
import sqlite3
import json

DB_PATH = 'backend/db.sqlite3'

def debug_assignment_api():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== DEBUGGING ASSIGNMENT API ISSUE ===\n")
    
    # Check assignment ID 13 specifically
    assignment_id = 13
    print(f"1. Checking Assignment ID {assignment_id}:")
    
    cursor.execute("""
        SELECT a.*, c.level, c.section, u.first_name, u.last_name
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        LEFT JOIN users u ON a.created_by_id = u.id
        WHERE a.id = ?
    """, (assignment_id,))
    
    assignment = cursor.fetchone()
    
    if assignment:
        print("   Assignment found in database:")
        columns = [desc[0] for desc in cursor.description]
        for i, col in enumerate(columns):
            print(f"   - {col}: {assignment[i]}")
    else:
        print("   Assignment NOT found in database!")
        conn.close()
        return
    
    # Check student assignment record
    print(f"\n2. Checking Student Assignment Records for ID {assignment_id}:")
    
    cursor.execute("""
        SELECT sa.*, s.first_name, s.last_name, s.student_id
        FROM student_assignments sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.assignment_id = ?
    """, (assignment_id,))
    
    student_assignments = cursor.fetchall()
    
    if student_assignments:
        print(f"   Found {len(student_assignments)} student assignment records:")
        for sa in student_assignments:
            print(f"   - Student: {sa[-2]} {sa[-1]} ({sa[-3]}), Status: {sa[3]}")
    else:
        print("   No student assignment records found!")
    
    # Check assignment questions/content
    print(f"\n3. Checking Assignment Questions for ID {assignment_id}:")
    
    cursor.execute("""
        SELECT * FROM assignment_questions
        WHERE assignment_id = ?
    """, (assignment_id,))
    
    questions = cursor.fetchall()
    
    if questions:
        print(f"   Found {len(questions)} questions:")
        for q in questions:
            print(f"   - Question ID: {q[0]}, Type: {q[3]}, Text: {q[4][:50]}...")
    else:
        print("   No questions found for this assignment!")
    
    # Check if assignment has required fields for API
    print(f"\n4. API Compatibility Check:")
    
    required_fields = ['title', 'description', 'instructions', 'assignment_type', 'status']
    missing_fields = []
    
    for i, field in enumerate(['id', 'title', 'description', 'instructions', 'assignment_type', 'class_instance_id', 'created_by_id', 'due_date', 'max_score', 'status']):
        if assignment[i] is None or assignment[i] == '':
            if field in required_fields:
                missing_fields.append(field)
    
    if missing_fields:
        print(f"   Missing required fields: {missing_fields}")
    else:
        print("   All required fields present")
    
    # Generate API response format
    print(f"\n5. Expected API Response Format:")
    
    api_response = {
        "id": assignment[0],
        "title": assignment[1],
        "description": assignment[2] or "",
        "instructions": assignment[3] or "",
        "assignment_type": assignment[4],
        "class_instance_id": assignment[5],
        "created_by_id": assignment[6],
        "due_date": assignment[7],
        "max_score": assignment[8],
        "status": assignment[9],
        "is_timed": bool(assignment[10]),
        "time_limit": assignment[11],
        "auto_grade": bool(assignment[12]),
        "show_results_immediately": bool(assignment[13]),
        "allow_file_submission": bool(assignment[14]),
        "allow_text_submission": bool(assignment[15]),
        "max_file_size": assignment[16],
        "allowed_file_types": assignment[17],
        "class_name": f"{assignment[-4]} {assignment[-3]}" if assignment[-4] and assignment[-3] else f"Class {assignment[5]}",
        "created_by": f"{assignment[-2]} {assignment[-1]}" if assignment[-2] and assignment[-1] else "Unknown"
    }
    
    print("   API Response JSON:")
    print(json.dumps(api_response, indent=2, default=str))
    
    conn.close()

if __name__ == "__main__":
    debug_assignment_api()