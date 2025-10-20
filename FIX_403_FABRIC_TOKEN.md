# 🔧 403 Error Fix - Fabric API Token Implementation

## 🚨 Problem

**Error**: HTTP 403 Forbidden when calling `/query` endpoint

**Root Cause**: Frontend was sending a **Microsoft Graph token** (`User.Read` scope) instead of a **Fabric API token** (`https://api.fabric.microsoft.com/.default` scope).

**Impact**: Backend cannot call Fabric Data Agent API on behalf of the user.

---

## ✅ Solution Implemented

### Changes Made

| File | What Changed | Why |
|------|--------------|-----|
| **environment.ts** | Changed `apiScopes` from string array to object with `graph` and `fabric` properties | Support both token types |
| **environment.prod.ts** | Same as environment.ts | Production config |
| **msal.service.ts** | Updated `loginPopup()` to acquire Fabric token after Graph authentication | Get correct token for backend |
| **msal.service.ts** | Updated `acquireTokenSilent()` to use Fabric scopes | Silent token refresh uses Fabric token |
| **msal.service.ts** | Added `acquireFabricToken()` private method | Handles Fabric token acquisition logic |

---

## 🔄 New Authentication Flow

### Before (❌ Broken):
```
1. User clicks "Sign In"
2. MSAL popup opens
3. User authenticates
4. Get Graph token (User.Read)
5. Send Graph token to backend ← WRONG TOKEN!
6. Backend tries to call Fabric API with Graph token
7. ❌ 403 Forbidden
```

### After (✅ Fixed):
```
1. User clicks "Sign In"
2. MSAL popup opens (Graph authentication)
3. User authenticates
4. Get Graph token (User.Read)
5. Silently acquire Fabric token (https://api.fabric.microsoft.com/.default)
6. Send Fabric token to backend ← CORRECT TOKEN!
7. Backend calls Fabric API with Fabric token
8. ✅ Success!
```

---

## 📝 Code Changes Detail

### 1. Environment Configuration

**Before:**
```typescript
apiScopes: ['User.Read']
```

**After:**
```typescript
apiScopes: {
  graph: ['User.Read'],                              // For user authentication
  fabric: ['https://api.fabric.microsoft.com/.default'] // For Fabric Data Agent API
}
```

### 2. MSAL Service - loginPopup()

**Before:**
```typescript
loginPopup(): Observable<string> {
  const loginRequest: PopupRequest = {
    scopes: environment.apiScopes  // Just Graph scopes
  };

  return from(this.msalInstance.loginPopup(loginRequest)).pipe(
    tap((response) => this.setActiveAccount(response.account)),
    map((response) => response.accessToken)  // Returns Graph token
  );
}
```

**After:**
```typescript
loginPopup(): Observable<string> {
  console.log('🔑 Step 1: Starting popup login (Graph authentication)...');
  
  const loginRequest: PopupRequest = {
    scopes: environment.apiScopes.graph  // Graph scopes first
  };

  return from(this.msalInstance.loginPopup(loginRequest)).pipe(
    tap((response) => {
      console.log('✅ Graph authentication successful!');
      this.setActiveAccount(response.account);
    }),
    // NEW: Step 2 - Get Fabric API token
    switchMap((graphResponse) => {
      console.log('🔑 Step 2: Acquiring Fabric API token...');
      return this.acquireFabricToken(graphResponse.account);
    })
  );  // Returns Fabric token
}
```

### 3. MSAL Service - New acquireFabricToken() Method

```typescript
private acquireFabricToken(account: AccountInfo): Observable<string> {
  const fabricRequest: SilentRequest = {
    account: account,
    scopes: environment.apiScopes.fabric  // Fabric scopes
  };

  return from(this.msalInstance.acquireTokenSilent(fabricRequest)).pipe(
    tap(() => console.log('✅ Fabric token acquired silently')),
    map((response) => response.accessToken),
    catchError((error) => {
      // If silent fails, use popup
      if (error instanceof InteractionRequiredAuthError) {
        console.warn('⚠️ Interaction required, using popup for Fabric token...');
        
        const fabricPopupRequest: PopupRequest = {
          scopes: environment.apiScopes.fabric,
          account: account
        };
        
        return from(this.msalInstance.acquireTokenPopup(fabricPopupRequest)).pipe(
          tap(() => console.log('✅ Fabric token acquired via popup')),
          map((response) => response.accessToken)
        );
      }
      return throwError(() => error);
    })
  );
}
```

---

## 🧪 Testing the Fix

### Expected Console Output

#### Login Flow:
```
🔐 FabricAuthService v3.0.0: Initialized (Client-Side Auth)
🔑 Starting client-side login flow...
🧹 Clearing cache for fresh start...
✅ MSAL cache cleared
🌐 MSAL popup will open...
🔑 Step 1: Starting popup login (Graph authentication)...
✅ Graph authentication successful!
👤 User: ahaque@insightintechnology.com
🔑 Step 2: Acquiring Fabric API token...
✅ Fabric token acquired silently
✅ Got access token from MSAL
📤 Sending token to backend...
📤 POST /auth/client-login
✅ Backend login successful!
🍪 Session cookie set
```

#### Query Flow:
```
📤 Sending query v3: total plan count...
✅ Query successful
📊 SQL: SELECT COUNT(*) FROM Plans
```

### Backend Should Log:
```
🔍 Validating token with Microsoft Graph...
🔍 Token audience: https://api.fabric.microsoft.com  ✅
🔍 Token scopes: FabricOpenAI.All.Default
✅ Token validated successfully
👤 User: ahaque@insightintechnology.com
```

---

## 🔍 Verification Steps

### 1. Check Token in Browser DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. **Local Storage** → Your domain
4. Look for keys starting with `msal.`
5. Find token cache entries
6. Should see entries for **both**:
   - `https://graph.microsoft.com` (Graph token)
   - `https://api.fabric.microsoft.com` (Fabric token)

### 2. Check Network Requests

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter: XHR
4. Click "Sign In with Microsoft"
5. Look for `/auth/client-login` request
6. Check **Request Payload**: Should contain `access_token`
7. Copy token value
8. Go to https://jwt.ms
9. Paste token
10. Check **"aud"** (audience) claim:
    - ✅ Should be: `https://api.fabric.microsoft.com`
    - ❌ NOT: `https://graph.microsoft.com`

### 3. Test Query

1. Login successfully
2. Send a query: "total plan count"
3. Check console for:
   ```
   ✅ Query successful
   📊 SQL: SELECT ...
   ```
4. Should see data, not 403 error

---

## 🚨 Troubleshooting

### Issue 1: "consent_required" Error

**Symptoms:**
```
❌ Fabric token acquisition failed: consent_required
```

**Cause**: User hasn't consented to Fabric API access

**Fix**: 
- Will trigger popup for consent automatically
- User must approve Fabric API permissions
- Only happens once per user

### Issue 2: Still Getting 403

**Check 1 - Token Audience:**
```javascript
// In browser console, after login:
const tokenKeys = Object.keys(localStorage).filter(k => k.includes('accesstoken'));
console.log(tokenKeys);
// Should see both graph and fabric tokens
```

**Check 2 - Backend Logs:**
Look for:
```
🔍 Token audience: ???
```

If it says `https://graph.microsoft.com` → Frontend is sending wrong token
If it says `https://api.fabric.microsoft.com` → Token is correct, check Fabric permissions

**Check 3 - Session Cookie:**
```javascript
// In browser console:
document.cookie.split(';').filter(c => c.includes('fabric_session'));
// Should show: fabric_session_id=...
```

If no cookie → Backend login failed
If cookie exists → Session is set, check backend API calls

### Issue 3: "invalid_client" Error

**Cause**: Azure AD app doesn't have API permissions for Fabric

**Fix**: 
1. Go to Azure Portal
2. App registrations → Your app
3. API permissions
4. Add a permission
5. **APIs my organization uses** → Search "Power BI Service"
6. Select: **Dataset.ReadWrite.All** or **Workspace.ReadWrite.All**
7. Grant admin consent

---

## 📊 Before vs After Comparison

| Aspect | Before (Broken) | After (Fixed) |
|--------|----------------|---------------|
| **Token Type** | Microsoft Graph | Fabric API |
| **Token Scope** | User.Read | https://api.fabric.microsoft.com/.default |
| **Token Audience** | https://graph.microsoft.com | https://api.fabric.microsoft.com |
| **Backend Can Call Fabric** | ❌ No (403) | ✅ Yes |
| **Query Response** | 403 Forbidden | Real data |
| **User Experience** | Error message | Working queries |

---

## 🎯 Success Criteria

- [x] Environment updated with separate Graph/Fabric scopes
- [x] MSAL service acquires Fabric token after Graph authentication
- [x] Silent token refresh uses Fabric scopes
- [x] No compilation errors
- [ ] Login shows 2-step process in console
- [ ] Token audience is `https://api.fabric.microsoft.com`
- [ ] Backend accepts token successfully
- [ ] Queries return real data (not 403)
- [ ] Session cookie is set correctly

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `environment.ts` | Development config with Fabric scopes |
| `environment.prod.ts` | Production config with Fabric scopes |
| `msal.service.ts` | MSAL wrapper with Fabric token acquisition |
| `fabric-auth-v3-client.service.ts` | Auth service (sends Fabric token to backend) |

---

## 🚀 Next Steps

1. **Test locally**:
   ```bash
   npm start
   # Open http://localhost:4200
   # Login and test query
   ```

2. **Check console logs** for the 2-step authentication

3. **Verify token** at https://jwt.ms (should show Fabric audience)

4. **Test query** - should return data, not 403

5. **Build and deploy**:
   ```bash
   ng build --configuration production
   # Deploy to Azure
   ```

---

**Status**: ✅ Implementation Complete  
**Testing**: ⏳ Ready for Testing  
**Expected Result**: Queries should work without 403 errors  
**Date**: October 20, 2025  
**Version**: 3.1.0
