# 🔧 Fix: AADSTS500113 - No Reply Address Registered

## 🚨 Error

```
AADSTS500113: No reply address is registered for the application.
```

## 🎯 Root Cause

Your Azure AD app registration doesn't have `http://localhost:4200` configured as a valid redirect URI.

**Current Config:**
- Client ID: `3503e363-86d6-4b02-807d-489886873632`
- Tenant ID: `4d4eca3f-b031-47f1-8932-59112bf47e6b`
- Redirect URI in code: `http://localhost:4200`
- ❌ Missing in Azure AD app registration

---

## ✅ Solution: Add Redirect URI to Azure AD

### Step 1: Open Azure Portal

1. Go to: https://portal.azure.com
2. Sign in with your Microsoft account

### Step 2: Navigate to App Registration

1. Click **"Azure Active Directory"** (or search for it)
2. Click **"App registrations"** in left menu
3. Find your app: **Client ID = `3503e363-86d6-4b02-807d-489886873632`**
4. Click on it to open

### Step 3: Add Redirect URI

1. In left menu, click **"Authentication"**
2. Under **"Platform configurations"**, look for **"Single-page application"** section
3. Click **"Add a platform"** if SPA not configured, or click **"Add URI"** if it exists
4. Add these redirect URIs:
   ```
   http://localhost:4200
   http://localhost:4200/
   ```
5. Scroll down and click **"Save"**

### Visual Guide:

```
Azure Portal → Azure Active Directory → App registrations
    ↓
Find app: 3503e363-86d6-4b02-807d-489886873632
    ↓
Click "Authentication" (left menu)
    ↓
Platform configurations → Single-page application
    ↓
Add URI: http://localhost:4200
    ↓
Save
```

---

## 📋 Complete Redirect URI List

Add ALL of these to support both local development and production:

### Single-Page Application (SPA) Platform:

```
http://localhost:4200
http://localhost:4200/
https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/
```

### Important:
- ✅ Use **"Single-page application"** platform (NOT "Web")
- ✅ Do NOT use wildcards (*)
- ✅ Include trailing slash versions
- ✅ Use exact URLs (case-sensitive)

---

## 🖼️ Screenshot Guide

### What to Look For:

```
┌─────────────────────────────────────────────────────────────┐
│ App registration: [Your App Name]                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 Overview                                                 │
│  🔐 Authentication  ← Click here                            │
│  📜 Certificates & secrets                                   │
│  🔑 API permissions                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Then:

┌─────────────────────────────────────────────────────────────┐
│ Authentication                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Platform configurations                                     │
│                                                              │
│  ➕ Add a platform                                          │
│                                                              │
│  📱 Single-page application                                 │
│     Redirect URIs:                                          │
│     • https://ingage-agent-ui-aqcxg2hhdxa2gcfr...           │
│       [Delete]                                              │
│     • http://localhost:4200        ← ADD THIS               │
│       [Delete]                                              │
│                                                              │
│     [+ Add URI]                                             │
│                                                              │
│  💾 Save                           ← Click when done        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test After Fix

### 1. Save Changes in Azure Portal

Click **"Save"** at the bottom of the Authentication page.

### 2. Wait 1-2 Minutes

Azure AD changes can take a moment to propagate.

### 3. Clear Browser Cache

```javascript
// In browser DevTools console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or use the built-in method:
```typescript
// Your app already has this method!
// Just need to call it from console if needed
this.authService.clearAllAuthData();
```

### 4. Try Login Again

1. Open http://localhost:4200
2. Click **"Sign In with Microsoft"**
3. Should now work! ✅

### Expected Console Output:

```
🔐 FabricAuthService v3.0.0: Initialized (Client-Side Auth)
🔑 Starting client-side login flow...
🧹 Clearing cache for fresh start...
✅ MSAL cache cleared
🌐 MSAL popup will open...
🔑 Starting popup login...
✅ Login successful!
👤 User: your.email@example.com
```

---

## 🔍 Verify Configuration

### Check Azure AD Settings:

1. **Client ID**: `3503e363-86d6-4b02-807d-489886873632` ✅
2. **Tenant ID**: `4d4eca3f-b031-47f1-8932-59112bf47e6b` ✅
3. **Redirect URIs** (must match exactly):
   - ✅ `http://localhost:4200` (for local dev)
   - ✅ `https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net` (for prod)
4. **Platform**: Single-page application (SPA) ✅
5. **API Permissions**: Microsoft Graph > User.Read ✅

### Check Your Code (Already Correct):

```typescript
// environment.ts
msalConfig: {
  auth: {
    clientId: '3503e363-86d6-4b02-807d-489886873632', ✅
    authority: 'https://login.microsoftonline.com/4d4eca3f-b031-47f1-8932-59112bf47e6b', ✅
    redirectUri: 'http://localhost:4200', ✅
    postLogoutRedirectUri: 'http://localhost:4200' ✅
  }
}
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Wrong Platform Type
```
DON'T use: "Web" platform
DO use: "Single-page application" platform
```

### ❌ Missing Trailing Slash
```
Add both:
- http://localhost:4200
- http://localhost:4200/
```

### ❌ Wrong URL
```
DON'T: http://localhost:8000 (that's your backend!)
DO: http://localhost:4200 (that's your frontend!)
```

### ❌ Case Sensitivity
```
URLs are case-sensitive. Must match exactly:
http://localhost:4200  ← Correct
Http://Localhost:4200  ← Wrong
```

---

## 🔄 Alternative: Use Azure CLI

If you prefer command line:

```bash
# Login to Azure
az login

# Add redirect URI
az ad app update \
  --id 3503e363-86d6-4b02-807d-489886873632 \
  --web-redirect-uris \
    "http://localhost:4200" \
    "https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net"
```

---

## 📊 Quick Checklist

Before trying login again:

- [ ] Opened Azure Portal
- [ ] Found app registration (Client ID: 3503e363-86d6-4b02-807d-489886873632)
- [ ] Clicked "Authentication"
- [ ] Selected "Single-page application" platform
- [ ] Added `http://localhost:4200` to redirect URIs
- [ ] Clicked "Save"
- [ ] Waited 1-2 minutes
- [ ] Cleared browser cache
- [ ] Ready to test!

---

## 🎯 What Should Happen After Fix

### Before (Current Error):
```
❌ AADSTS500113: No reply address is registered for the application.
```

### After (Success):
```
✅ Microsoft login popup opens
✅ User can sign in
✅ Popup closes automatically
✅ Token received
✅ Backend login successful
✅ User authenticated
```

---

## 📚 Additional Resources

### Microsoft Documentation:
- [Redirect URI/reply URL restrictions](https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url)
- [Register a SPA app](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration)
- [MSAL.js configuration](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)

### Your App Configuration:
- **Frontend (localhost)**: http://localhost:4200
- **Frontend (prod)**: https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
- **Backend (localhost)**: http://localhost:8000
- **Backend (prod)**: https://ingage-ai-agent-api-c6f9htcfd3baa2b4.canadacentral-01.azurewebsites.net

---

## ⚡ Quick Fix Summary

**Problem**: Azure AD doesn't recognize `http://localhost:4200` as valid redirect URI

**Solution**: Add it in Azure Portal

**Steps**:
1. Azure Portal → Azure AD → App registrations
2. Find app: `3503e363-86d6-4b02-807d-489886873632`
3. Authentication → Single-page application → Add URI
4. Add: `http://localhost:4200`
5. Save
6. Clear cache and test

**Time**: 2-3 minutes

---

**Status**: ⏳ Awaiting Azure AD Configuration  
**Next Step**: Add redirect URI in Azure Portal  
**Expected Result**: Login will work after configuration ✅
