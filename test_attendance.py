#!/usr/bin/env python3
import requests
import json

# Test the attendance API endpoints
BASE_URL = "http://localhost:8000/api"

def test_attendance_endpoints():
    print("Testing attendance endpoints...")
    
    # Test 1: Check if attendance endpoint exists
    try:
        response = requests.get(f"{BASE_URL}/students/attendance/")
        print(f"GET /students/attendance/ - Status: {response.status_code}")
        if response.status_code == 401:
            print("✓ Endpoint exists but requires authentication")
        elif response.status_code == 200:
            print("✓ Endpoint accessible")
        else:
            print(f"✗ Unexpected status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("✗ Server not running on localhost:8000")
        return
    
    # Test 2: Check bulk endpoint
    try:
        response = requests.post(f"{BASE_URL}/students/attendance/bulk/")
        print(f"POST /students/attendance/bulk/ - Status: {response.status_code}")
        if response.status_code == 401:
            print("✓ Bulk endpoint exists but requires authentication")
        elif response.status_code == 400:
            print("✓ Bulk endpoint accessible")
        else:
            print(f"? Unexpected status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("✗ Server not running")

if __name__ == "__main__":
    test_attendance_endpoints()