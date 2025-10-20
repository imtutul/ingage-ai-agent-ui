# ✅ Fix AADSTS65001: Consent Required Error

## 🎯 Error You're Seeing

```json
{
    "error": "invalid_grant",
    "error_description": "AADSTS65001: The user or administrator has not consented to use the application with ID '3503e363-86d6-4b02-807d-489886873632' named 'fabric-data-agent-service'. Send an interactive authorization request for this user and resource.",
    "suberror": "consent_required"
}
```

**When**: Acquiring Fabric API token (Step 2 of authentication)

---

## 🔍 Root Cause

Your Azure AD app registration **does NOT have Fabric API permissions configured**.

**Current state:**
```
Your App Registration:
├── API Permissions
│   └── Microsoft Graph
│       └── ✅ User.Read (Delegated) ← THIS WORKS
│   
│   ❌ NO Power BI / Fabric API permissions ← THIS IS MISSING!
```

**What you need:**
```
Your App Registration:
├── API Permissions
│   ├── Microsoft Graph
│   │   └── ✅ User.Read (Delegated)
│   │
│   └── Power BI Service / Fabric API
│       ├── ✅ Tenant.Read.All (Delegated)
│       └── ✅ Tenant.ReadWrite.All (Delegated)
```

---

## ✅ Solution: Add Fabric API Permissions

### Step 1: Open Azure Portal

1. Go to: **https://portal.azure.com**
2. Sign in with your admin account

---

### Step 2: Navigate to App Registrations

1. In the search bar at the top, type: **"App registrations"**
2. Click on **"App registrations"**

---

### Step 3: Find Your App

1. You should see a list of app registrations
2. Look for: **"fabric-data-agent-service"**
   - Client ID: `3503e363-86d6-4b02-807d-489886873632`
3. Click on it

---

### Step 4: Go to API Permissions

1. In the left sidebar, click **"API permissions"**
2. You should see:
   ```
   API / Permission name    Type        Status
   ─────────────────────────────────────────────
   Microsoft Graph
     User.Read              Delegated   Granted
   ```

---

### Step 5: Add Fabric API Permission

1. Click **"+ Add a permission"** (top of the page)

2. A panel opens on the right: **"Request API permissions"**

3. Click on the **"APIs my organization uses"** tab

4. In the search box, type: **"Power BI Service"**
   - Alternative names to search:
     - "Fabric"
     - "Power BI"
     - "Analysis Services"

5. You should see: **"Power BI Service"** (or similar name)
   - If you don't see it, try searching for: **"00000009-0000-0000-c000-000000000000"**
   - This is the standard Power BI Service App ID

6. **Click on "Power BI Service"**

---
    
### Step 6: Select Delegated Permissions

1. In the permission selection screen:
   - Click **"Delegated permissions"** (if not already selected)

2. You'll see a list of available permissions

3. **Check these permissions:**
   - ✅ **Tenant.Read.All** (View all content in tenant)
   - ✅ **Tenant.ReadWrite.All** (Read and write all content in tenant)
   
   Alternative permission names you might see:
   - ✅ **Content.Create**
   - ✅ **Workspace.ReadWrite.All**
   - ✅ **Dataset.ReadWrite.All**

4. Click **"Add permissions"** (bottom of the panel)

---

### Step 7: Grant Admin Consent ⚠️ IMPORTANT!

1. You're back at the **"API permissions"** page

2. You should now see:
   ```
   API / Permission name          Type        Status
   ──────────────────────────────────────────────────────
   Microsoft Graph
     User.Read                    Delegated   Granted
   
   Power BI Service
     Tenant.Read.All              Delegated   ⚠️ Not granted
     Tenant.ReadWrite.All         Delegated   ⚠️ Not granted
   ```

3. **Click "Grant admin consent for [your organization]"**
   - This button is at the top of the API permissions list
   - You might need to be a Global Administrator

4. A popup appears asking: **"Grant admin consent confirmation"**
   - Click **"Yes"**

5. After a moment, the status should update:
   ```
   API / Permission name          Type        Status
   ──────────────────────────────────────────────────────
   Microsoft Graph
     User.Read                    Delegated   ✅ Granted
   
   Power BI Service
     Tenant.Read.All              Delegated   ✅ Granted
     Tenant.ReadWrite.All         Delegated   ✅ Granted
   ```

---

## 🧪 Test After Adding Permissions

### Step 1: Clear Browser Cache

**Important!** MSAL caches the previous failure.

```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or use Ctrl+Shift+Delete → Clear all data

---

### Step 2: Login Again

1. Click **"Login"** button
2. Popup opens for Graph authentication
3. Click **"Accept"** (if consent screen appears)
4. Popup closes
5. **NEW**: Another popup might open for Fabric consent
6. Click **"Accept"** for Fabric permissions
7. Popup closes
8. ✅ Login successful!

---

### Step 3: Expected Console Output

**Before fix:**
```
✅ Graph authentication successful!
👤 User: shahriar@insightinhealth.com
🔑 Step 2: Acquiring Fabric API token...
❌ 400 (Bad Request)
❌ Error: AADSTS65001: consent_required
```

**After fix:**
```
✅ Graph authentication successful!
👤 User: shahriar@insightinhealth.com
🔑 Step 2: Acquiring Fabric API token...
⚠️ Interaction required, using popup for Fabric token...
   [Popup opens]
   [Click Accept]
✅ Fabric token acquired via popup
📤 Sending token to backend...
✅ Backend login successful!
🍪 Session cookie: fabric_session_id
```

**Or if silent acquisition works:**
```
✅ Graph authentication successful!
👤 User: shahriar@insightinhealth.com
🔑 Step 2: Acquiring Fabric API token...
✅ Fabric token acquired silently
📤 Sending token to backend...
✅ Backend login successful!
```

---

## 🚨 Troubleshooting

### Issue 1: Can't Find "Power BI Service" in API List

**Solution A: Use Application ID**

1. In "Request API permissions" → "APIs my organization uses"
2. Type this **Application ID**: `00000009-0000-0000-c000-000000000000`
3. Press Enter
4. Select it
5. Continue with selecting permissions

**Solution B: Check if Fabric API Exists**

Your tenant might use a different name:
- Try searching: "Fabric"
- Try searching: "Analysis Services"
- Try searching: "Power Platform"

**Solution C: Contact Your Azure AD Admin**

You might need someone with Global Administrator rights to:
1. Enable the Power BI / Fabric API in your tenant
2. Grant the necessary permissions

---

### Issue 2: "Grant admin consent" Button Disabled

**Cause**: You don't have sufficient permissions

**Solution**:
- You need **Global Administrator** or **Cloud Application Administrator** role
- Ask your Azure AD admin to grant consent

**Alternative**: User Consent (if admin consent not available)
```typescript
// In msal.service.ts, modify acquireFabricToken popup request:
const fabricPopupRequest: PopupRequest = {
  scopes: environment.apiScopes.fabric,
  account: account,
  prompt: 'consent' // Force consent prompt for each user
};
```

---

### Issue 3: Still Getting 400 Error After Adding Permissions

**Possible causes:**

1. **Cache not cleared**
   ```javascript
   // Force clear everything
   localStorage.clear();
   sessionStorage.clear();
   indexedDB.databases().then(dbs => {
     dbs.forEach(db => indexedDB.deleteDatabase(db.name));
   });
   location.reload();
   ```

2. **Permissions not fully propagated**
   - Wait 5-10 minutes for Azure AD to propagate changes
   - Sign out and sign in again to Azure Portal

3. **Wrong scope format**
   - Check `environment.ts`:
     ```typescript
     fabric: ['https://api.fabric.microsoft.com/.default']
     ```
   - Try alternative:
     ```typescript
     fabric: ['https://analysis.windows.net/powerbi/api/.default']
     ```

---

### Issue 4: Different Fabric API Scopes

If `https://api.fabric.microsoft.com/.default` doesn't work, try these alternatives:

**Option 1: Power BI API scope**
```typescript
// environment.ts
apiScopes: {
  graph: ['User.Read'],
  fabric: ['https://analysis.windows.net/powerbi/api/.default']
}
```

**Option 2: Specific permissions**
```typescript
// environment.ts
apiScopes: {
  graph: ['User.Read'],
  fabric: [
    'https://analysis.windows.net/powerbi/api/Tenant.Read.All',
    'https://analysis.windows.net/powerbi/api/Tenant.ReadWrite.All'
  ]
}
```

**Option 3: Check Azure Portal for exact scope**
1. Azure Portal → Your app → API permissions
2. Click on the Fabric permission
3. Copy the **exact scope value** shown
4. Use that in your `environment.ts`

---

## 🔍 Verify Configuration

### Check Azure Portal:

1. **App registrations** → Your app → **API permissions**

Should show:
```
✅ Microsoft Graph
   └── User.Read (Delegated) - Granted

✅ Power BI Service / Fabric API
   ├── Tenant.Read.All (Delegated) - Granted
   └── Tenant.ReadWrite.All (Delegated) - Granted
```

2. **Authentication** → **Redirect URIs**

Should show:
```
✅ http://localhost:4200/
✅ https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/
```

---

### Check Code Configuration:

**environment.ts:**
```typescript
export const environment = {
  msalConfig: {
    auth: {
      clientId: '3503e363-86d6-4b02-807d-489886873632', ✅
      authority: 'https://login.microsoftonline.com/4d4eca3f-b031-47f1-8932-59112bf47e6b', ✅
      redirectUri: 'http://localhost:4200/', ✅
    }
  },
  apiScopes: {
    graph: ['User.Read'], ✅
    fabric: ['https://api.fabric.microsoft.com/.default'] ✅
  }
};
```

---

## ✅ Success Checklist

Complete these in order:

- [ ] **Step 1**: Open Azure Portal → App registrations
- [ ] **Step 2**: Find app: fabric-data-agent-service
- [ ] **Step 3**: Go to API permissions
- [ ] **Step 4**: Click "+ Add a permission"
- [ ] **Step 5**: Search for "Power BI Service"
- [ ] **Step 6**: Select Delegated permissions:
  - [ ] Tenant.Read.All
  - [ ] Tenant.ReadWrite.All
- [ ] **Step 7**: Click "Add permissions"
- [ ] **Step 8**: Click "Grant admin consent for [org]"
- [ ] **Step 9**: Verify all permissions show "Granted"
- [ ] **Step 10**: Clear browser cache (localStorage + sessionStorage)
- [ ] **Step 11**: Reload app
- [ ] **Step 12**: Click "Login"
- [ ] **Step 13**: Accept consent screen(s)
- [ ] **Step 14**: Verify login successful
- [ ] **Step 15**: Test query - should work without 403!

---

## 📊 Visual: Before vs After

### Before (Current - Broken):
```
Login Flow:
├── ✅ User clicks "Login"
├── ✅ Graph authentication (User.Read)
├── ✅ Graph token acquired
├── 🔄 Attempt to acquire Fabric token
└── ❌ 400 Error: AADSTS65001 (consent_required)
    └── ❌ No Fabric permissions configured
```

### After (Fixed):
```
Login Flow:
├── ✅ User clicks "Login"
├── ✅ Graph authentication (User.Read)
├── ✅ Graph token acquired
├── 🔄 Attempt to acquire Fabric token
├── ⚠️ Consent required → Popup opens
├── ✅ User accepts Fabric consent
├── ✅ Fabric token acquired
├── ✅ Token sent to backend
├── ✅ Session created
└── ✅ Login complete!
```

---

## 🎯 Summary

**Problem**: AADSTS65001 - Fabric API permissions not configured  
**Solution**: Add Power BI Service / Fabric API permissions in Azure Portal  
**Required Steps**:
1. Azure Portal → App registrations → Your app
2. API permissions → Add a permission
3. Power BI Service → Delegated permissions
4. Select: Tenant.Read.All, Tenant.ReadWrite.All
5. Grant admin consent
6. Clear cache
7. Login again

**Time to fix**: ~5 minutes  
**Result**: ✅ Fabric token acquired → ✅ Queries work!

---

**Next**: After adding permissions, clear cache and try login again! The consent screen will appear once, then everything will work. 🚀
