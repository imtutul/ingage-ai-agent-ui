# 401 Unauthorized Error Diagnosis & Fix

## Error Analysis

Based on the DevTools console screenshot, you're experiencing a **401 Unauthorized** error when making queries to the API, despite successful authentication.

### Console Log Analysis:
- ✅ **Graph authentication successful** - Microsoft login worked
- ✅ **Fabric token acquired silently** - Token obtained successfully  
- ✅ **Backend login successful** - Token sent to backend and validated
- ✅ **Session cookie set** - Authentication session established
- ❌ **Query fails with 401** - Actual API call unauthorized

## Root Cause Analysis

### Most Likely Causes:

#### 1. **Session Cookie Expiration**
- Session cookie expired between login and query
- Backend session validation failing
- Cookie not being sent with query request

#### 2. **Token Scope Issues**
- Fabric token missing required scopes for specific operations
- AI Skills (MLModel) requiring additional permissions
- Backend not properly validating token scopes

#### 3. **Backend Session Management**
- Backend session not properly associated with cookies
- Session validation logic failing
- Cross-origin cookie issues

## Fixes Implemented

### 1. Added Pre-Query Authentication Check

**File**: `src/app/services/chat.service.ts`

**Changes**:
- Added `FabricAuthService` injection
- Modified `sendMessage()` to verify authentication before queries
- Added detailed logging for debugging

```typescript
// Before sending query, verify authentication
this.authService.checkAuthenticationStatus().subscribe({
  next: (authStatus) => {
    if (authStatus.authenticated) {
      console.log('✅ Authentication verified, sending query');
      this.sendToBackend(content);
    } else {
      // Handle unauthenticated state
    }
  }
});
```

### 2. Enhanced Query Debugging

**Added Debug Logging**:
```typescript
console.log('📤 Sending query to backend:', {
  endpoint: `${this.API_BASE_URL}/query`,
  queryLength: message.length,
  historyLength: conversationHistory.length
});
```

## Immediate Testing Steps

### Step 1: Test With Enhanced Logging

1. **Start the application**: `npm start`
2. **Open DevTools** → Console tab
3. **Clear console logs**
4. **Sign in** (if not already signed in)
5. **Send a query** and watch the console logs

**Expected Console Output**:
```
🔐 Checking authentication before sending query...
✅ Authentication verified, sending query
📤 Sending query to backend: {endpoint: "...", queryLength: 25, historyLength: 0}
```

### Step 2: Check Session Status

If authentication check passes but query still fails, the issue is likely backend session validation.

### Step 3: Verify Cookie Transmission

1. **Open DevTools** → Network tab
2. **Send a query**
3. **Check POST /query request**
4. **Verify Cookies** section includes session cookie

## Additional Debugging Solutions

### Solution A: Force Token Refresh

If the issue persists, try forcing a fresh token:

<function_calls>
<invoke name="create_file">
<parameter name="content">// Add this method to FabricAuthService
refreshAuthentication(): Observable<LoginResponse> {
  console.log('🔄 Forcing authentication refresh...');
  
  // Clear current tokens
  this.msalService.clearCache();
  
  // Force new login
  return this.login();
}