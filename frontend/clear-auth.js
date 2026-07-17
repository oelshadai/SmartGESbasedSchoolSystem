// Clear all authentication data from browser storage
console.log('Clearing authentication data...');

// Clear localStorage
localStorage.removeItem('refresh_token');
localStorage.removeItem('auth-storage');

// Clear sessionStorage  
sessionStorage.removeItem('access_token');
sessionStorage.removeItem('user_data');
sessionStorage.removeItem('token_timestamp');

// Clear any other auth-related items
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => localStorage.removeItem(key));

const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
    sessionKeysToRemove.push(key);
  }
}
sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

console.log('Authentication data cleared. Redirecting to login...');

// Redirect to login page
window.location.href = '/login';