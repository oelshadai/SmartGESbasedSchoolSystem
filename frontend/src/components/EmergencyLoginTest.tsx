import React, { useState } from 'react';
import { emergencyAuthService } from '@/lib/emergencyApiClient';

const EmergencyLoginTest = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const testConnection = async () => {
    setLoading(true);
    addResult('Testing backend connection...', 'info');
    
    const result = await emergencyAuthService.testConnection();
    
    if (result.success) {
      addResult('Backend connection successful!', 'success');
    } else {
      addResult(`Backend connection failed: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const testStudentLogin = async () => {
    setLoading(true);
    addResult('Testing student login...', 'info');
    
    const result = await emergencyAuthService.studentLogin('TEST001', 'testpass123');
    
    if (result.success) {
      addResult(`Student login successful! User: ${result.data.user.first_name}`, 'success');
    } else {
      addResult(`Student login failed: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const testTeacherLogin = async () => {
    setLoading(true);
    addResult('Testing teacher login...', 'info');
    
    const result = await emergencyAuthService.teacherLogin('teacher@test.com', 'testpass123');
    
    if (result.success) {
      addResult(`Teacher login successful! User: ${result.data.user.first_name}`, 'success');
    } else {
      addResult(`Teacher login failed: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const testAdminLogin = async () => {
    setLoading(true);
    addResult('Testing admin login...', 'info');
    
    const result = await emergencyAuthService.adminLogin('admin@test.com', 'testpass123');
    
    if (result.success) {
      addResult(`Admin login successful! User: ${result.data.user.first_name}`, 'success');
    } else {
      addResult(`Admin login failed: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚨 Emergency Login Test</h1>
      <p>This component tests authentication directly without complex interceptors.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Test Connection
        </button>
        <button 
          onClick={testStudentLogin} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Test Student Login
        </button>
        <button 
          onClick={testTeacherLogin} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Test Teacher Login
        </button>
        <button 
          onClick={testAdminLogin} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px' }}
        >
          Test Admin Login
        </button>
        <button 
          onClick={clearResults}
          style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px', 
        border: '1px solid #dee2e6',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3>Test Results:</h3>
        {results.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No tests run yet. Click a button above to start testing.</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {results.map((result, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
        <h4>🔑 Test Credentials:</h4>
        <ul>
          <li><strong>Student:</strong> TEST001 / testpass123</li>
          <li><strong>Teacher:</strong> teacher@test.com / testpass123</li>
          <li><strong>Admin:</strong> admin@test.com / testpass123</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyLoginTest;