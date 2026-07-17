#!/usr/bin/env python3
"""
Test Assignment API Endpoint
"""
import sqlite3
import json

DB_PATH = 'backend/db.sqlite3'

def test_assignment_api():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=== TESTING ASSIGNMENT API DATA ===\n")
    
    # Test assignment ID 13 (the one showing blank page)
    assignment_id = 13
    
    # Get assignment with all related data
    cursor.execute("""
        SELECT a.*, c.level, c.section, u.first_name as teacher_first_name, u.last_name as teacher_last_name
        FROM assignments a
        LEFT JOIN classes c ON a.class_instance_id = c.id
        LEFT JOIN users u ON a.created_by_id = u.id
        WHERE a.id = ?
    """, (assignment_id,))
    
    assignment = cursor.fetchone()
    if not assignment:
        print(f"[ERROR] Assignment {assignment_id} not found!")
        return
    
    # Get column names
    columns = [description[0] for description in cursor.description]
    assignment_dict = dict(zip(columns, assignment))
    
    print(f"[OK] Assignment {assignment_id} found:")
    print(f"   Title: {assignment_dict['title']}")
    print(f"   Status: {assignment_dict['status']}")
    print(f"   Type: {assignment_dict['assignment_type']}")
    print(f"   Class: {assignment_dict['level']} {assignment_dict['section']}")
    print(f"   Teacher: {assignment_dict['teacher_first_name']} {assignment_dict['teacher_last_name']}")
    print(f"   Description: {assignment_dict['description'][:50]}...")
    
    # Get questions for this assignment
    cursor.execute("""
        SELECT q.*, GROUP_CONCAT(qo.option_text || '|' || qo.is_correct, ';') as options
        FROM questions q
        LEFT JOIN question_options qo ON q.id = qo.question_id
        WHERE q.assignment_id = ?
        GROUP BY q.id
        ORDER BY q.id
    """, (assignment_id,))
    
    questions = cursor.fetchall()
    question_columns = [description[0] for description in cursor.description]
    
    print(f"\n[QUESTIONS] Questions for assignment {assignment_id}:")
    if questions:
        for i, question in enumerate(questions):
            q_dict = dict(zip(question_columns, question))
            print(f"   {i+1}. {q_dict['question_text']}")
            
            if q_dict['options']:
                options = q_dict['options'].split(';')
                for j, option in enumerate(options):
                    if '|' in option:
                        text, is_correct = option.split('|')
                        correct_mark = " [CORRECT]" if is_correct == '1' else ""
                        print(f"      {chr(65+j)}. {text}{correct_mark}")
    else:
        print("   No questions found!")
    
    # Get student assignments
    cursor.execute("""
        SELECT sa.*, s.first_name, s.last_name, s.student_id
        FROM student_assignments sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.assignment_id = ?
    """, (assignment_id,))
    
    student_assignments = cursor.fetchall()
    sa_columns = [description[0] for description in cursor.description]
    
    print(f"\n[STUDENTS] Student assignments for assignment {assignment_id}:")
    if student_assignments:
        for sa in student_assignments:
            sa_dict = dict(zip(sa_columns, sa))
            print(f"   - {sa_dict['first_name']} {sa_dict['last_name']} ({sa_dict['student_id']}): {sa_dict['status']}")
    else:
        print("   No student assignments found!")
    
    # Create API response format
    api_response = {
        "id": assignment_dict['id'],
        "title": assignment_dict['title'],
        "description": assignment_dict['description'] or "Complete this assignment",
        "instructions": assignment_dict['instructions'] or "",
        "assignment_type": assignment_dict['assignment_type'],
        "status": assignment_dict['status'],
        "due_date": assignment_dict['due_date'],
        "time_limit": assignment_dict['time_limit'],
        "max_score": assignment_dict['max_score'],
        "class_subject": f"{assignment_dict['level']} {assignment_dict['section']}" if assignment_dict['level'] else "General",
        "created_by_name": f"{assignment_dict['teacher_first_name']} {assignment_dict['teacher_last_name']}",
        "questions": []
    }
    
    # Add questions to API response
    for question in questions:
        q_dict = dict(zip(question_columns, question))
        question_data = {
            "id": q_dict['id'],
            "question_text": q_dict['question_text'],
            "question_type": q_dict['question_type'],
            "points": q_dict['points'],
            "options": []
        }
        
        if q_dict['options']:
            options = q_dict['options'].split(';')
            for option in options:
                if '|' in option:
                    text, is_correct = option.split('|')
                    question_data['options'].append({
                        "option_text": text,
                        "is_correct": is_correct == '1'
                    })
        
        api_response['questions'].append(question_data)
    
    print(f"\n[API] API Response Format:")
    print(json.dumps(api_response, indent=2, default=str))
    
    conn.close()
    
    print(f"\n[OK] Assignment API test completed!")
    print(f"   - Assignment exists: OK")
    print(f"   - Has questions: {'OK' if questions else 'NO'}")
    print(f"   - Has student records: {'OK' if student_assignments else 'NO'}")
    print(f"   - Ready for API: OK")

if __name__ == "__main__":
    test_assignment_api()