#!/usr/bin/env python3
"""
Test CORS configuration
"""
import requests

def test_cors():
    """Test CORS configuration"""
    
    # Test CORS preflight request
    api_url = "http://localhost:8000/api/students/auth/login/"
    
    print("=== Testing CORS Configuration ===")
    
    # Test OPTIONS request (preflight)
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(api_url, headers=headers, timeout=10)
        print(f"OPTIONS Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        # Check for required CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print(f"CORS Configuration: {cors_headers}")
        
    except Exception as e:
        print(f"[ERROR] CORS test failed: {e}")
    
    # Test actual POST request with Origin header
    try:
        print("\n=== Testing POST with Origin Header ===")
        headers = {
            'Origin': 'http://localhost:3000',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "student_id": "2025BASIC_9004",
            "password": "8AuoU2"
        }
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=10)
        print(f"POST Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("[SUCCESS] POST request with CORS headers successful")
        else:
            print(f"[ERROR] POST request failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] POST test failed: {e}")

if __name__ == "__main__":
    test_cors()