#!/usr/bin/env python3
import sqlite3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import os

# Database path
DB_PATH = 'backend/db.sqlite3'

class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        try:
            if path == '/api/test':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"status": "API is working", "database": "connected"}
                self.wfile.write(json.dumps(response).encode())
                
            elif path == '/api/tables':
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                # Get all table names
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"tables": tables}
                self.wfile.write(json.dumps(response).encode())
                
            elif path == '/api/users':
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                # Try to get users from auth_user table
                cursor.execute("SELECT id, username, email, is_active FROM auth_user LIMIT 10;")
                users = []
                for row in cursor.fetchall():
                    users.append({
                        "id": row[0],
                        "username": row[1],
                        "email": row[2],
                        "is_active": row[3]
                    })
                
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"users": users}
                self.wfile.write(json.dumps(response).encode())
                
            elif path == '/api/assignments':
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                # Get assignments with their status and class info
                cursor.execute("""
                    SELECT a.id, a.title, a.status, a.created_at, a.class_instance_id,
                           c.level, c.section, u.username as created_by
                    FROM assignments a
                    LEFT JOIN schools_class c ON a.class_instance_id = c.id
                    LEFT JOIN auth_user u ON a.created_by_id = u.id
                    ORDER BY a.created_at DESC
                    LIMIT 20;
                """)
                
                assignments = []
                for row in cursor.fetchall():
                    assignments.append({
                        "id": row[0],
                        "title": row[1],
                        "status": row[2],
                        "created_at": row[3],
                        "class_instance_id": row[4],
                        "class_level": row[5],
                        "class_section": row[6],
                        "created_by": row[7]
                    })
                
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"assignments": assignments}
                self.wfile.write(json.dumps(response).encode())
                
            elif path == '/api/student-assignments':
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                # Get student assignments
                cursor.execute("""
                    SELECT sa.id, sa.assignment_id, sa.student_id, sa.status,
                           a.title, s.first_name, s.last_name, s.student_id as student_number
                    FROM student_assignments sa
                    LEFT JOIN assignments a ON sa.assignment_id = a.id
                    LEFT JOIN students_student s ON sa.student_id = s.id
                    ORDER BY sa.created_at DESC
                    LIMIT 20;
                """)
                
                student_assignments = []
                for row in cursor.fetchall():
                    student_assignments.append({
                        "id": row[0],
                        "assignment_id": row[1],
                        "student_id": row[2],
                        "status": row[3],
                        "assignment_title": row[4],
                        "student_first_name": row[5],
                        "student_last_name": row[6],
                        "student_number": row[7]
                    })
                
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"student_assignments": student_assignments}
                self.wfile.write(json.dumps(response).encode())
                
            elif path == '/api/students':
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                # Get students with their class info
                cursor.execute("""
                    SELECT s.id, s.student_id, s.first_name, s.last_name, s.current_class_id,
                           c.level, c.section, u.username
                    FROM students_student s
                    LEFT JOIN schools_class c ON s.current_class_id = c.id
                    LEFT JOIN auth_user u ON s.user_id = u.id
                    ORDER BY s.first_name
                    LIMIT 20;
                """)
                
                students = []
                for row in cursor.fetchall():
                    students.append({
                        "id": row[0],
                        "student_id": row[1],
                        "first_name": row[2],
                        "last_name": row[3],
                        "current_class_id": row[4],
                        "class_level": row[5],
                        "class_section": row[6],
                        "username": row[7]
                    })
                
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"students": students}
                self.wfile.write(json.dumps(response).encode())
                
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"error": "Endpoint not found"}
                self.wfile.write(json.dumps(response).encode())
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        exit(1)
    
    server = HTTPServer(('localhost', 8001), APIHandler)
    print("Simple API server running on http://localhost:8001")
    print("Test endpoints:")
    print("  GET /api/test - Basic API test")
    print("  GET /api/tables - List database tables")
    print("  GET /api/users - Get users from auth_user table")
    print("  GET /api/assignments - Get assignments with status")
    print("  GET /api/student-assignments - Get student assignment records")
    print("  GET /api/students - Get students with class info")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
        server.server_close()