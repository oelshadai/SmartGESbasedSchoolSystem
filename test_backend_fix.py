#!/usr/bin/env python3
"""
Quick test script to verify backend fixes
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test the fixed endpoints"""
    
    print("Testing backend endpoints...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{BASE_URL}/api/health/")
        print(f"✓ Health check: {response.status_code}")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
    
    # Test 2: Assignments test endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/assignments/test/")
        print(f"✓ Assignments test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Message: {data.get('message')}")
    except Exception as e:
        print(f"✗ Assignments test failed: {e}")
    
    # Test 3: Tasks available endpoint (should return 401 without auth)
    try:
        response = requests.get(f"{BASE_URL}/api/assignments/tasks/available/")
        print(f"✓ Tasks available: {response.status_code} (expected 401 without auth)")
    except Exception as e:
        print(f"✗ Tasks available failed: {e}")
    
    print("\nBackend test completed!")

if __name__ == "__main__":
    test_endpoints()