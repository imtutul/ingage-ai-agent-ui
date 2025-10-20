# 🎨 Visual Guide: Token Scopes Fix

## 🔍 The Problem (Before Fix)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│                                                          │
│  User clicks Login                                       │
│         ↓                                                │
│  Request token with:                                     │
│  ❌ scopes: ['.default']                                │
│         ↓                                                │
│  Token acquired BUT has NO SCOPES! ❌                   │
│         ↓                                                │
│  Token sent to backend                                   │
└──────────────────────────────┬──────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                               │
│                                                          │
│  Receives token                                          │
│         ↓                                                │
│  Calls Fabric API with token                             │
│         ↓                                                │
│  Fabric API checks token                                 │
│         ↓                                                │
│  ❌ "Token has no scopes!" ❌                           │
│         ↓                                                │
│  Returns: 403 Forbidden                                  │
└──────────────────────────────┬──────────────────────────┘
                               ↓
                         User sees error! ❌
```

---

## ✅ The Solution (After Fix)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│                                                          │
│  User clicks Login                                       │
│         ↓                                                │
│  Request token with:                                     │
│  ✅ scopes: [                                           │
│       'Workspace.Read.All',                              │
│       'Workspace.ReadWrite.All',                         │
│       'Item.Read.All',                                   │
│       'Item.ReadWrite.All'                               │
│     ]                                                    │
│         ↓                                                │
│  Token acquired with SPECIFIC SCOPES! ✅                │
│         ↓                                                │
│  Token sent to backend                                   │
└──────────────────────────────┬──────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                               │
│                                                          │
│  Receives token                                          │
│         ↓                                                │
│  Calls Fabric API with token                             │
│         ↓                                                │
│  Fabric API checks token                                 │
│         ↓                                                │
│  ✅ "Token has correct scopes!" ✅                      │
│         ↓                                                │
│  Returns: 200 OK with data                               │
└──────────────────────────────┬──────────────────────────┘
                               ↓
                    User gets response! ✅
```

---

## 🔐 Token Comparison

### ❌ Before (`.default` scope)

```json
{
  "aud": "https://api.fabric.microsoft.com",
  "iss": "https://login.microsoftonline.com/.../",
  "iat": 1729533926,
  "exp": 1729537826,
  "scp": null,           ← ❌ NO SCOPES!
  "roles": null,         ← ❌ NO ROLES!
  "appid": "3503e363-86d6-4b02-807d-489886873632"
}
```

**Result:** Fabric API rejects this token → **403 Forbidden**

---

### ✅ After (Specific scopes)

```json
{
  "aud": "https://api.fabric.microsoft.com",
  "iss": "https://login.microsoftonline.com/.../",
  "iat": 1729533926,
  "exp": 1729537826,
  "scp": "Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All",  ← ✅ HAS SCOPES!
  "appid": "3503e363-86d6-4b02-807d-489886873632"
}
```

**Result:** Fabric API accepts this token → **200 OK with data**

---

## 📋 What Each Scope Does

| Scope | What It Allows |
|-------|----------------|
| `Workspace.Read.All` | Read all workspace data |
| `Workspace.ReadWrite.All` | Read AND write workspace data |
| `Item.Read.All` | Read all items (datasets, reports, etc.) |
| `Item.ReadWrite.All` | Read AND write all items |

**Together:** These scopes give your app full access to Fabric resources.

---

## 🔄 Complete Flow: From Login to Query

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "LOGIN"                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. GRAPH AUTHENTICATION                                  │
│    • Popup opens                                         │
│    • User signs in                                       │
│    • Token acquired with: User.Read                      │
│    • ✅ User authenticated                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. FABRIC TOKEN ACQUISITION                              │
│    • Try silent acquisition first                        │
│    • If fails → Popup for Fabric consent                 │
│    • User accepts Fabric permissions                     │
│    • Token acquired with: Workspace.*, Item.*            │
│    • ✅ Fabric token obtained                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. TOKEN SENT TO BACKEND                                 │
│    • POST /auth/client-login                             │
│    • Body: { access_token: "..." }                       │
│    • Backend validates token                             │
│    • Session created                                     │
│    • ✅ Session cookie set                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. USER IS AUTHENTICATED                                 │
│    • Chat interface shown                                │
│    • Ready to send queries                               │
│    • ✅ Login complete                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. USER SENDS QUERY                                      │
│    • Query: "total plan count"                           │
│    • POST /query                                         │
│    • Session cookie sent automatically                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. BACKEND PROCESSES QUERY                               │
│    • Gets token from session                             │
│    • Calls Fabric AI Skill with token                    │
│    • Fabric API validates token scopes ✅               │
│    • Fabric API processes query                          │
│    • Returns result                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 8. USER GETS RESPONSE                                    │
│    • "The total plan count is 42"                        │
│    • ✅ SUCCESS!                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Critical Components

### 1. Azure AD App Registration

```
App Registration: fabric-data-agent-service
├── Authentication
│   └── Redirect URIs
│       ├── ✅ http://localhost:4200/
│       └── ✅ https://[production-url]/
│
├── API Permissions
│   ├── Microsoft Graph
│   │   └── ✅ User.Read (Delegated)
│   │
│   └── Microsoft Fabric / Power BI Service  ← CRITICAL!
│       ├── ✅ Workspace.Read.All (Delegated)
│       ├── ✅ Workspace.ReadWrite.All (Delegated)
│       ├── ✅ Item.Read.All (Delegated)
│       └── ✅ Item.ReadWrite.All (Delegated)
│
└── Certificates & secrets
    └── (not used for client-side auth)
```

---

### 2. Frontend Configuration

```typescript
// environment.ts
export const environment = {
  msalConfig: {
    auth: {
      clientId: '3503e363-86d6-4b02-807d-489886873632',
      authority: 'https://login.microsoftonline.com/4d4eca3f-b031-47f1-8932-59112bf47e6b',
      redirectUri: 'http://localhost:4200/'
    }
  },
  apiScopes: {
    graph: ['User.Read'],
    fabric: [                                    ← CRITICAL!
      'https://api.fabric.microsoft.com/Workspace.Read.All',
      'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
      'https://api.fabric.microsoft.com/Item.Read.All',
      'https://api.fabric.microsoft.com/Item.ReadWrite.All'
    ]
  }
};
```

---

### 3. MSAL Service

```typescript
// msal.service.ts
private acquireFabricToken(account: AccountInfo): Observable<string> {
  const fabricRequest: SilentRequest = {
    account: account,
    scopes: environment.apiScopes.fabric  ← Uses specific scopes!
  };

  return from(this.msalInstance.acquireTokenSilent(fabricRequest)).pipe(
    tap((response) => {
      this.logTokenDetails(response.accessToken);  ← Logs token details!
    }),
    // ... error handling
  );
}
```

---

## 🔍 Debugging Checklist

### When Login Happens:

Console should show:

```
✅ Graph authentication successful!
   ↓
🔑 Step 2: Acquiring Fabric API token...
   ↓
✅ Fabric token acquired
   ↓
🔍 Token Details:
   📍 Audience: https://api.fabric.microsoft.com     ← Must be Fabric!
   🔑 Scopes: Workspace.Read.All ...                  ← Must have scopes!
   ⏰ Expires: [future date]                          ← Not expired!
   ↓
✅ Token audience is correct
✅ Token has scopes
   ↓
📤 Sending token to backend...
   ↓
✅ Backend login successful!
```

**If any step fails → That's where the problem is!**

---

## 🚨 Common Problems - Visual Guide

### Problem 1: No Azure AD Permissions

```
Azure Portal
└── App registrations
    └── Your app
        └── API permissions
            ├── ✅ Microsoft Graph (User.Read)
            └── ❌ NO Fabric permissions!  ← PROBLEM!

Result: Token has no scopes → 403 error
```

**Fix:** Add Fabric API permissions in Azure Portal

---

### Problem 2: Using `.default` Scope

```typescript
// ❌ WRONG
fabric: ['https://api.fabric.microsoft.com/.default']

Token payload:
{
  "scp": null  ← NO SCOPES!
}

Result: 403 error
```

**Fix:** Use specific scopes (already done!)

---

### Problem 3: Cache Not Cleared

```
Old token (with no scopes) still in cache
   ↓
Login attempts to use old token
   ↓
Fabric API rejects old token
   ↓
403 error
```

**Fix:** Clear cache before testing

---

## ✅ Success Indicators

### 1. Console Logs
```
✅ Fabric token acquired
✅ Token has scopes: Workspace.Read.All ...
✅ Backend login successful!
```

### 2. Network Tab
```
Request to /query:
  Status: 200 OK
  Response: { "success": true, "response": "..." }
```

### 3. UI
```
Query input: "total plan count"
Response: "The total plan count is 42"
```

---

## 🎯 Summary Visual

```
┌──────────────────┐
│  AZURE AD SETUP  │  ← Add Fabric permissions
└────────┬─────────┘
         ↓
┌──────────────────┐
│  CODE CHANGES    │  ← Use specific scopes (DONE!)
└────────┬─────────┘
         ↓
┌──────────────────┐
│  CLEAR CACHE     │  ← Remove old tokens
└────────┬─────────┘
         ↓
┌──────────────────┐
│  TEST LOGIN      │  ← Should see scopes in token
└────────┬─────────┘
         ↓
┌──────────────────┐
│  TEST QUERY      │  ← Should get 200 OK response
└────────┬─────────┘
         ↓
    ✅ SUCCESS!
```

---

**The fix is simple:** Azure AD permissions + Specific scopes = Working app! 🚀
