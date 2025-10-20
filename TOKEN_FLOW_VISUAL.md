# 🎨 Token Flow - Visual Guide

## 📊 The Problem (Before Fix)

```
┌──────────────────────────────────────────────────────────────┐
│                    BROKEN FLOW (403 Error)                    │
└──────────────────────────────────────────────────────────────┘

User clicks "Sign In"
         │
         │ MSAL Popup Opens
         ▼
  ┌──────────────┐
  │   Microsoft  │
  │     Login    │
  └──────┬───────┘
         │
         │ User authenticates
         ▼
  ┌──────────────┐
  │ Get Token    │
  │ Scope:       │
  │ User.Read    │
  └──────┬───────┘
         │
         │ Token Type: Graph Token ❌
         │ Audience: https://graph.microsoft.com
         ▼
  ┌──────────────┐
  │ Send to      │
  │ Backend      │
  └──────┬───────┘
         │
         │ POST /auth/client-login
         │ { access_token: "GRAPH_TOKEN" }
         ▼
  ┌──────────────┐
  │   Backend    │
  │   Receives   │
  └──────┬───────┘
         │
         │ Token validation: ✅ Valid
         │ Token audience: https://graph.microsoft.com
         ▼
  ┌──────────────┐
  │   Backend    │
  │   Tries to   │
  │   Call       │
  │   Fabric API │
  └──────┬───────┘
         │
         │ Using Graph token ❌
         ▼
  ┌──────────────┐
  │ Fabric API   │
  │ Response:    │
  │ 403          │
  │ Forbidden    │
  └──────────────┘

❌ Query fails
❌ User sees error
```

---

## 📊 The Solution (After Fix)

```
┌──────────────────────────────────────────────────────────────┐
│                    FIXED FLOW (Success!)                      │
└──────────────────────────────────────────────────────────────┘

User clicks "Sign In"
         │
         │ MSAL Popup Opens
         ▼
  ┌──────────────┐
  │   Microsoft  │
  │     Login    │
  │  (Step 1)    │
  └──────┬───────┘
         │
         │ User authenticates
         ▼
  ┌──────────────┐
  │ Get Graph    │
  │ Token        │
  │ Scope:       │
  │ User.Read    │
  └──────┬───────┘
         │
         │ ✅ Graph token acquired
         │ Purpose: Identify user
         ▼
  ┌──────────────┐
  │ Acquire      │
  │ Fabric Token │
  │  (Step 2)    │
  │              │
  │ Scope:       │
  │ https://api. │
  │ fabric...    │
  └──────┬───────┘
         │
         │ Try silently first
         ▼
  ┌──────────────┐
  │ Silent Token │
  │ Acquisition  │
  └──────┬───────┘
         │
    ┌────┴─────┐
    │          │
 Success    Failed
    │          │
    │          ▼
    │    ┌──────────┐
    │    │ Popup    │
    │    │ Consent  │
    │    └────┬─────┘
    │         │
    └────┬────┘
         │
         │ Token Type: Fabric Token ✅
         │ Audience: https://api.fabric.microsoft.com
         ▼
  ┌──────────────┐
  │ Send Fabric  │
  │ Token to     │
  │ Backend      │
  └──────┬───────┘
         │
         │ POST /auth/client-login
         │ { access_token: "FABRIC_TOKEN" }
         ▼
  ┌──────────────┐
  │   Backend    │
  │   Receives   │
  └──────┬───────┘
         │
         │ Token validation: ✅ Valid
         │ Token audience: https://api.fabric.microsoft.com ✅
         ▼
  ┌──────────────┐
  │ Store Token  │
  │ in Session   │
  └──────┬───────┘
         │
         │ Session cookie created
         ▼
  ┌──────────────┐
  │ User Sends   │
  │ Query        │
  └──────┬───────┘
         │
         │ POST /query
         │ Cookie: fabric_session_id
         ▼
  ┌──────────────┐
  │   Backend    │
  │   Gets Token │
  │   from       │
  │   Session    │
  └──────┬───────┘
         │
         │ Using Fabric token ✅
         ▼
  ┌──────────────┐
  │ Call Fabric  │
  │ Data Agent   │
  │ API          │
  └──────┬───────┘
         │
         │ Authorization: Bearer FABRIC_TOKEN
         ▼
  ┌──────────────┐
  │ Fabric API   │
  │ Response:    │
  │ 200 OK       │
  │ + Data       │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   Backend    │
  │   Returns    │
  │   Data to    │
  │   Frontend   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   User Sees  │
  │   Results ✅ │
  └──────────────┘

✅ Query succeeds
✅ User sees data
```

---

## 🔑 Token Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                   GRAPH TOKEN vs FABRIC TOKEN                │
└─────────────────────────────────────────────────────────────┘

GRAPH TOKEN (User.Read)
┌────────────────────────────────────┐
│ {                                   │
│   "aud": "https://graph.microsoft.com",
│   "scp": "User.Read",               │
│   "sub": "user-id",                 │
│   "name": "ahaque@insightinto..."   │
│ }                                   │
└────────────────────────────────────┘
         │
         │ Purpose: Identify user
         │ Can access: Microsoft Graph API (user profile, email, etc.)
         │ Cannot access: Fabric Data Agent API ❌
         │
         ▼
Used for: Validating user identity


FABRIC TOKEN (https://api.fabric.microsoft.com/.default)
┌────────────────────────────────────┐
│ {                                   │
│   "aud": "https://api.fabric.microsoft.com",
│   "scp": "FabricOpenAI.All.Default",│
│   "sub": "user-id",                 │
│   "name": "ahaque@insightinto..."   │
│ }                                   │
└────────────────────────────────────┘
         │
         │ Purpose: Access Fabric APIs
         │ Can access: Fabric Data Agent API ✅
         │ Can access: Microsoft Graph API ❌
         │
         ▼
Used for: Calling Fabric Data Agent on behalf of user
```

---

## 🎯 Two-Step Authentication Sequence

```
┌─────────────────────────────────────────────────────────────┐
│           STEP 1: GRAPH AUTHENTICATION                       │
└─────────────────────────────────────────────────────────────┘

loginPopup({ scopes: ['User.Read'] })
    ↓
Microsoft login page opens
    ↓
User enters credentials
    ↓
Returns: {
  account: { ... },
  accessToken: "eyJ0eX...GRAPH_TOKEN"
}


┌─────────────────────────────────────────────────────────────┐
│           STEP 2: FABRIC TOKEN ACQUISITION                   │
└─────────────────────────────────────────────────────────────┘

acquireTokenSilent({
  account: previousAccount,
  scopes: ['https://api.fabric.microsoft.com/.default']
})
    ↓
Try to get from cache or refresh
    ↓
    ├─ Success → Return Fabric token
    │
    └─ Fail → acquireTokenPopup()
              ↓
              Consent popup (if needed)
              ↓
              Returns: {
                account: { ... },
                accessToken: "eyJ0eX...FABRIC_TOKEN"
              }
```

---

## 📊 Cookie + Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│         HOW TOKENS AND COOKIES WORK TOGETHER                 │
└─────────────────────────────────────────────────────────────┘

1. LOGIN PHASE
   ┌──────────────┐
   │   Frontend   │
   │   Gets       │
   │   Fabric     │
   │   Token      │
   └──────┬───────┘
          │
          │ POST /auth/client-login
          │ Body: { access_token: "FABRIC_TOKEN" }
          ▼
   ┌──────────────┐
   │   Backend    │
   │   Validates  │
   │   Token      │
   └──────┬───────┘
          │
          │ Token is valid ✅
          │ Stores token in memory
          ▼
   ┌──────────────┐
   │   Backend    │
   │   Creates    │
   │   Session    │
   │              │
   │ session_id:  │
   │ "abc123"     │
   │              │
   │ user_email:  │
   │ "ahaque@..." │
   │              │
   │ fabric_token:│
   │ "eyJ0eX..."  │
   └──────┬───────┘
          │
          │ Set-Cookie: fabric_session_id=abc123
          ▼
   ┌──────────────┐
   │   Frontend   │
   │   Stores     │
   │   Cookie     │
   └──────────────┘


2. QUERY PHASE
   ┌──────────────┐
   │   Frontend   │
   │   Sends      │
   │   Query      │
   └──────┬───────┘
          │
          │ POST /query
          │ Cookie: fabric_session_id=abc123
          │ Body: { query: "total plan count" }
          ▼
   ┌──────────────┐
   │   Backend    │
   │   Reads      │
   │   Cookie     │
   └──────┬───────┘
          │
          │ session_id = "abc123"
          │ Look up session
          ▼
   ┌──────────────┐
   │   Backend    │
   │   Gets       │
   │   Fabric     │
   │   Token from │
   │   Session    │
   └──────┬───────┘
          │
          │ fabric_token = "eyJ0eX..."
          ▼
   ┌──────────────┐
   │   Backend    │
   │   Calls      │
   │   Fabric API │
   └──────┬───────┘
          │
          │ Authorization: Bearer eyJ0eX...
          │ POST https://api.fabric.microsoft.com/v1/...
          ▼
   ┌──────────────┐
   │ Fabric API   │
   │ Returns Data │
   └──────┬───────┘
          │
          │ { response: "There are 150 plans" }
          ▼
   ┌──────────────┐
   │   Backend    │
   │   Returns to │
   │   Frontend   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   User Sees  │
   │   "There are │
   │   150 plans" │
   └──────────────┘
```

---

## 🔄 Silent Token Refresh

```
┌─────────────────────────────────────────────────────────────┐
│              TOKEN REFRESH MECHANISM                         │
└─────────────────────────────────────────────────────────────┘

Token expires (after 1 hour typically)
    ↓
User makes request
    ↓
Backend uses expired token
    ↓
Fabric API returns 401
    ↓
Backend returns 401 to frontend
    ↓
Frontend detects 401
    ↓
    ┌─────────────────────┐
    │ acquireTokenSilent()│
    │ (Fabric scopes)     │
    └─────────┬───────────┘
              │
         ┌────┴─────┐
         │          │
      Success    Failed
         │          │
         │          ▼
         │    ┌──────────┐
         │    │ Popup    │
         │    │ Re-auth  │
         │    └────┬─────┘
         │         │
         └────┬────┘
              │
              ▼
    ┌──────────────┐
    │ New Fabric   │
    │ Token        │
    └──────┬───────┘
           │
           │ POST /auth/client-login
           ▼
    ┌──────────────┐
    │ Session      │
    │ Updated      │
    └──────┬───────┘
           │
           │ Retry original request
           ▼
    ┌──────────────┐
    │ ✅ Success   │
    └──────────────┘
```

---

**Purpose**: Visual understanding of token flow  
**Use**: Reference when debugging authentication issues  
**Status**: ✅ Complete
