import { secureApiClient } from './secureApiClient';

// Export the secure API client as the default
// This maintains backward compatibility while providing enhanced security
export default secureApiClient;

// Legacy export for any existing code that might import apiClient directly
export const apiClient = secureApiClient;
