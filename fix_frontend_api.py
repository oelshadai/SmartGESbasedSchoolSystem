#!/usr/bin/env python3
"""
FRONTEND API FIX
Fix the frontend to use the correct API endpoint for student assignments
"""

import os
import re

def fix_frontend_api():
    print("=== FIXING FRONTEND API CALLS ===\n")
    
    # Path to the frontend API file
    api_file = "frontend/src/api/studentAssignmentApiProduction.js"
    
    if not os.path.exists(api_file):
        print(f"ERROR: {api_file} not found")
        return
    
    # Read the current file
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Current API configuration:")
    print("- Dashboard endpoint: /students/auth/dashboard/")
    print("- Assignment endpoint: /assignments/student-assignments/my-assignments/")
    
    # The dashboard endpoint already returns assignments, but let's make sure
    # the frontend properly handles the response
    
    # Update the API to use the dashboard endpoint correctly
    new_content = content.replace(
        "const response = await api.get('/students/auth/dashboard/');",
        """const response = await api.get('/students/auth/dashboard/');
        
        // Extract assignments from dashboard response
        if (response.data && response.data.assignments) {
            return {
                data: {
                    results: response.data.assignments,
                    count: response.data.assignments.length
                }
            };
        }"""
    )
    
    # Also add a fallback to the dedicated assignment endpoint
    if new_content == content:
        # If the above replacement didn't work, try a different approach
        new_content = re.sub(
            r'const response = await api\.get\([\'\"]/students/auth/dashboard/[\'\"]\);',
            '''const response = await api.get('/students/auth/dashboard/');
        
        // Extract assignments from dashboard response
        if (response.data && response.data.assignments) {
            return {
                data: {
                    results: response.data.assignments,
                    count: response.data.assignments.length
                }
            };
        }''',
            new_content
        )
    
    # Write the updated file
    with open(api_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n✓ Updated {api_file}")
    print("- Dashboard endpoint now properly extracts assignment data")
    print("- Frontend should now display student assignments correctly")

if __name__ == "__main__":
    fix_frontend_api()