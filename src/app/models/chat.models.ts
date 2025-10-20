// ============================================
// API v2.0.0 - User Delegation Authentication
// ============================================

/**
 * User information from Microsoft Graph API
 * Returned from /auth/login, /auth/status, /auth/user
 */
export interface User {
  email: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  userPrincipalName?: string;
}

/**
 * Authentication status from /auth/status
 */
export interface AuthStatus {
  authenticated: boolean;
  user?: User;
  message?: string;
}

/**
 * Login response from /auth/login
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  session_expires_at?: string;
}

/**
 * Query response from /query or /query/detailed
 */
export interface QueryResponse {
  success: boolean;
  response: string;
  query?: string;              // Original user question
  runStatus?: string;          // Execution status
  stepsCount?: number;         // Number of steps executed
  sqlQuery?: string;           // Generated SQL query
  dataPreview?: string[];      // Sample data rows
  error?: string;              // Error message if any
  timestamp?: Date;            // When query was executed
}

/**
 * Chat message with optional query metadata
 */
export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'agent';
  queryResponse?: QueryResponse;  // Attach query metadata to assistant messages
  isTyping?: boolean;
}

/**
 * Overall chat state
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  user?: User;                    // Current authenticated user
  authenticated: boolean;         // Authentication status
}

/**
 * Legacy API response (for backward compatibility)
 * @deprecated Use QueryResponse instead
 */
export interface ApiResponse {
  result?: string;
  answer?: string;
  response?: string;
  error?: boolean;
  message?: string;
}