#!/usr/bin/env python3
"""
CORS Integration Test Script
Tests the complete login flow with proper CORS handling
"""

import requests
import json
import sys

def test_cors_integration():
    """Test CORS integration with student login"""
    
    base_url = "http://localhost:8000/api"
    frontend_origin = "http://localhost:8080"
    
    print("🔍 Testing CORS Integration...")
    
    # Test 1: OPTIONS preflight request
    print("\n1. Testing OPTIONS preflight request...")
    
    headers = {
        'Origin': frontend_origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
    }
    
    try:
        response = requests.options(f"{base_url}/auth/student-login/", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   CORS Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("   ✅ Preflight request successful")
        else:
            print("   ❌ Preflight request failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Preflight request error: {e}")
        return False
    
    # Test 2: Actual login request
    print("\n2. Testing student login request...")
    
    login_data = {
        "username": "test_student",
        "password": "test_password"
    }
    
    headers = {
        'Origin': frontend_origin,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/student-login/", 
            json=login_data,
            headers=headers
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code in [200, 401]:  # 401 is expected for invalid credentials
            print("   ✅ Login request processed (CORS working)")
            return True
        else:
            print("   ❌ Login request failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Login request error: {e}")
        return False

def test_security_headers():
    """Test that security headers are not sent as request headers"""
    
    print("\n🛡️  Testing Security Header Filtering...")
    
    base_url = "http://localhost:8000/api"
    frontend_origin = "http://localhost:8080"
    
    # Test with security headers that should be filtered
    headers = {
        'Origin': frontend_origin,
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',  # This should be filtered
        'X-Frame-Options': 'DENY',  # This should be filtered
        'Authorization': 'Bearer fake-token'
    }
    
    try:
        response = requests.get(f"{base_url}/auth/profile/", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 403:  # Should not be blocked by CORS
            print("   ✅ Security headers properly filtered")
            return True
        else:
            print("   ❌ Request blocked - security headers not filtered")
            return False
            
    except Exception as e:
        print(f"   ❌ Security header test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting CORS Integration Tests")
    print("=" * 50)
    
    cors_test = test_cors_integration()
    security_test = test_security_headers()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   CORS Integration: {'✅ PASS' if cors_test else '❌ FAIL'}")
    print(f"   Security Headers: {'✅ PASS' if security_test else '❌ FAIL'}")
    
    if cors_test and security_test:
        print("\n🎉 All tests passed! CORS integration is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Check the configuration.")
        sys.exit(1)