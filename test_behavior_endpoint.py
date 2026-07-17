#!/usr/bin/env python3
"""
Test script to verify the behavior endpoint is working
"""
import requests
import json

def test_behavior_endpoint():
    base_url = "http://localhost:8000"
    
    # Test if server is running
    try:
        response = requests.get(f"{base_url}/api/students/behaviour/", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 401:
            print("✅ Server is running but requires authentication (expected)")
        elif response.status_code == 200:
            print("✅ Server is running and endpoint is accessible")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server at http://localhost:8000")
        print("Make sure the Django server is running with: python manage.py runserver")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_behavior_endpoint()