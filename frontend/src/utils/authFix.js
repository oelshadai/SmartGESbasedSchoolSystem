// Emergency auth fix - run this in browser console
function clearAllAuthData() {
  // Clear all possible auth storage locations
  sessionStorage.clear();
  localStorage.clear();
  
  // Clear specific auth keys that might persist
  const authKeys = [
    'access_token', 'refresh_token', 'user_data', 'token_timestamp',
    'auth-storage', 'login_attempts'
  ];
  
  authKeys.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
  
  // Clear any cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  console.log('All authentication data cleared');
  
  // Force reload to login page
  window.location.href = '/login';
}

// Run the fix
clearAllAuthData();