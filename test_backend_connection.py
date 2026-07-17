import requests
import json

def test_backend_connection():
    """Test if backend server is running and responding"""
    
    base_url = "http://localhost:8000"
    api_url = f"{base_url}/api"
    
    print("Testing Backend Connection...")
    print(f"Base URL: {base_url}")
    print(f"API URL: {api_url}")
    print("-" * 50)
    
    # Test 1: Basic server response
    try:
        response = requests.get(base_url, timeout=5)
        print(f"✓ Server is running (Status: {response.status_code})")
    except requests.exceptions.ConnectionError:
        print("✗ Server is not running or not accessible")
        return False
    except Exception as e:
        print(f"✗ Server error: {e}")
        return False
    
    # Test 2: API endpoints
    endpoints_to_test = [
        "/auth/csrf-token/",
        "/auth/login/",
    ]
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{api_url}{endpoint}"
            response = requests.get(url, timeout=5)
            print(f"✓ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"✗ {endpoint} - Error: {e}")
    
    # Test 3: CORS headers
    try:
        response = requests.options(f"{api_url}/auth/login/", 
                                  headers={'Origin': 'http://localhost:8080'}, 
                                  timeout=5)
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        print(f"✓ CORS Headers: {cors_headers}")
    except Exception as e:
        print(f"✗ CORS test failed: {e}")
    
    return True

if __name__ == "__main__":
    test_backend_connection()