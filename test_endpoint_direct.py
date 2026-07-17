#!/usr/bin/env python3
"""
Test attendance bulk endpoint directly
"""
import requests
import json

def test_attendance_endpoint():
    """Test the attendance bulk endpoint"""
    base_url = "http://localhost:8000"
    
    print("Testing attendance bulk endpoint...")
    
    # Test without authentication first
    print("\n1. Testing without authentication:")
    try:
        response = requests.get(f"{base_url}/api/students/attendance/")
        print(f"GET /api/students/attendance/ - Status: {response.status_code}")
        
        response = requests.post(f"{base_url}/api/students/attendance/bulk/")
        print(f"POST /api/students/attendance/bulk/ - Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
    except Exception as e:
        print(f"Error: {e}")
    
    # Test API root
    print("\n2. Testing API root:")
    try:
        response = requests.get(f"{base_url}/api/")
        print(f"GET /api/ - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test health endpoint
    print("\n3. Testing health endpoint:")
    try:
        response = requests.get(f"{base_url}/api/health/")
        print(f"GET /api/health/ - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_attendance_endpoint()