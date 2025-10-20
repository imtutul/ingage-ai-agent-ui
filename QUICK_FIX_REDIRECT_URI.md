# 🎯 QUICK FIX: Add Redirect URI (2 Minutes)

## 🚨 The Error

```
AADSTS500113: No reply address is registered for the application.
```

**What it means**: Azure AD doesn't know about `http://localhost:4200`

---

## ✅ The Fix (Step-by-Step)

### 1️⃣ Open Azure Portal (30 seconds)

🔗 Go to: **https://portal.azure.com**

---

### 2️⃣ Find Your App Registration (30 seconds)

**Option A - Search Bar:**
```
Top search bar → Type: "3503e363-86d6-4b02-807d-489886873632"
→ Click on the app when it appears
```

**Option B - Navigate:**
```
Home → Azure Active Directory → App registrations 
→ Find: "3503e363-86d6-4b02-807d-489886873632"
```

---

### 3️⃣ Go to Authentication (10 seconds)

```
Left sidebar → Click "Authentication"
```

---

### 4️⃣ Add Redirect URI (30 seconds)

**Look for section**: "Platform configurations"

**You'll see**: "Single-page application" section

**Click**: "+ Add URI" (or "Add a platform" if SPA not configured)

**Type exactly**:
```
http://localhost:4200
```

**Click**: "Save" at the bottom

---

### 5️⃣ Wait & Test (30 seconds)

**Wait**: 1-2 minutes for Azure to update

**Clear cache** (in browser console F12):
```javascript
localStorage.clear();
location.reload();
```

**Try login again**: Click "Sign In with Microsoft"

✅ **Should work now!**

---

## 📋 Add ALL These URIs

For both local and production:

```
http://localhost:4200
https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
```

---

## 🎯 Visual Location Guide

```
Azure Portal
    ↓
Search: "3503e363-86d6-4b02-807d-489886873632"
    ↓
Click on your app
    ↓
LEFT SIDEBAR: "Authentication"
    ↓
SECTION: "Platform configurations"
    ↓
SUBSECTION: "Single-page application"
    ↓
BUTTON: "+ Add URI"
    ↓
TYPE: http://localhost:4200
    ↓
BUTTON: "Save" (bottom of page)
```

---

## ⚡ What to Look For

### In "Platform configurations" section:

```
┌──────────────────────────────────────────────┐
│  Platform configurations                     │
│                                              │
│  ➕ Add a platform                          │
│                                              │
│  📱 Single-page application                 │
│     Redirect URIs:                          │
│                                              │
│     https://ingage-agent-ui-aqcxg2hhdxa...  │
│     [Delete]                                 │
│                                              │
│     [+ Add URI] ← CLICK HERE                │
│                                              │
│     Then type: http://localhost:4200        │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🔍 After Saving

You should see:

```
✅ Single-page application
   Redirect URIs:
   • https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
   • http://localhost:4200  ← NEW!
```

---

## 🧪 Test

1. Clear browser cache
2. Reload http://localhost:4200
3. Click "Sign In with Microsoft"
4. ✅ Should open Microsoft login popup
5. ✅ Should authenticate successfully

---

## 🆘 Still Not Working?

### Double-check these match EXACTLY:

**In Azure AD**:
- Platform: Single-page application (NOT "Web")
- URI: `http://localhost:4200` (lowercase, port 4200)

**In your code** (environment.ts):
- redirectUri: `'http://localhost:4200'` (same as Azure)

### Must be identical! Case-sensitive!

---

**Time**: 2-3 minutes  
**Difficulty**: Easy  
**Status**: Ready to fix now! 🚀
