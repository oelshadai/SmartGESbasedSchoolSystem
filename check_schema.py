#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('backend/db.sqlite3')
cursor = conn.cursor()

# Get student_assignments table schema
cursor.execute("PRAGMA table_info(student_assignments)")
columns = cursor.fetchall()

print("student_assignments table columns:")
for col in columns:
    print(f"- {col[1]} ({col[2]})")

conn.close()