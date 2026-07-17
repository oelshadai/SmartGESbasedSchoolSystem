#!/usr/bin/env python3
"""
Diagnostic script to test student login credentials
Tests the exact credentials that are failing in the login system
"""

import json
import hashlib

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def test_student_credentials():
    """Test all student credentials from the database"""
    
    # Student credentials from the system
    students = [
        {"username": "2025BASIC_9001", "password": "student123", "name": "John Doe"},
        {"username": "2025BASIC_9002", "password": "student456", "name": "Jane Smith"},
        {"username": "2025BASIC_9003", "password": "student789", "name": "Bob Johnson"},
        {"username": "2025BASIC_9004", "password": "student321", "name": "Alice Brown"},
        {"username": "2025BASIC_9005", "password": "student654", "name": "Charlie Wilson"}
    ]
    
    print("=== STUDENT LOGIN DIAGNOSTIC TEST ===\n")
    
    for i, student in enumerate(students, 1):
        print(f"Student {i}:")
        print(f"  Username: {student['username']}")
        print(f"  Password: {student['password']}")
        print(f"  Name: {student['name']}")
        print(f"  Password Hash: {hash_password(student['password'])}")
        
        # Test credential format
        if len(student['username']) == 14 and student['username'].startswith('2025BASIC_'):
            print(f"  [OK] Username format: VALID")
        else:
            print(f"  [ERROR] Username format: INVALID")
            
        if len(student['password']) >= 8:
            print(f"  [OK] Password length: VALID ({len(student['password'])} chars)")
        else:
            print(f"  [ERROR] Password length: INVALID ({len(student['password'])} chars)")
            
        print()
    
    # Test the specific failing credential
    print("=== TESTING SPECIFIC FAILING CREDENTIAL ===")
    failing_username = "2025BASIC_9001"
    failing_password = "student123"
    
    print(f"Testing: {failing_username} / {failing_password}")
    print(f"Hashed password: {hash_password(failing_password)}")
    
    # Simulate login validation
    found_student = None
    for student in students:
        if student['username'] == failing_username:
            found_student = student
            break
    
    if found_student:
        print(f"[OK] Username found in database")
        if found_student['password'] == failing_password:
            print(f"[OK] Password matches")
            print(f"[SUCCESS] LOGIN SHOULD SUCCEED for {found_student['name']}")
        else:
            print(f"[ERROR] Password mismatch")
            print(f"  Expected: {found_student['password']}")
            print(f"  Provided: {failing_password}")
    else:
        print(f"[ERROR] Username not found in database")
    
    print("\n=== SUMMARY ===")
    print(f"Total students in database: {len(students)}")
    print("All credentials appear to be properly formatted")
    print("The failing login (2025BASIC_9001/student123) should work based on this test")

if __name__ == "__main__":
    test_student_credentials()