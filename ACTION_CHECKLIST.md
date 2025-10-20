# ✅ Action Checklist: Fix 403 Token Scopes Error

## 🎯 Goal
Fix the "Token does not have required scopes" error (403) when querying Fabric API.

---

## 📋 Step-by-Step Checklist

### ✅ Phase 1: Code Changes (ALREADY DONE!)

- [x] Updated `environment.ts` with specific Fabric scopes
- [x] Updated `environment.prod.ts` with specific Fabric scopes
- [x] Added token debugging to `msal.service.ts`
- [x] No compilation errors

**Status: ✅ COMPLETE**

---

### 🔲 Phase 2: Azure Portal Configuration (YOU NEED TO DO THIS!)

#### Step 1: Open Azure Portal
- [ ] Navigate to: https://portal.azure.com
- [ ] Sign in with admin account

#### Step 2: Find Your App
- [ ] Search for "App registrations"
- [ ] Click on "App registrations"
- [ ] Find: `fabric-data-agent-service`
  - Client ID: `3503e363-86d6-4b02-807d-489886873632`
- [ ] Click on it

#### Step 3: Add API Permissions
- [ ] Click "API permissions" in left sidebar
- [ ] Click "+ Add a permission"
- [ ] Click "APIs my organization uses" tab
- [ ] Search for: "Power BI Service" or "Microsoft Fabric"

**Can't find it?** Try:
- [ ] Search for Application ID: `00000009-0000-0000-c000-000000000000`

#### Step 4: Select Permissions
- [ ] Click on the API (Power BI Service / Fabric)
- [ ] Click "Delegated permissions"
- [ ] Check these permissions:
  - [ ] `Workspace.Read.All`
  - [ ] `Workspace.ReadWrite.All`
  - [ ] `Item.Read.All`
  - [ ] `Item.ReadWrite.All`
- [ ] Click "Add permissions" button

#### Step 5: Grant Admin Consent
- [ ] Back in API permissions page
- [ ] Click "Grant admin consent for [Your Organization]"
- [ ] Click "Yes" in confirmation popup
- [ ] Wait for green checkmarks to appear

#### Step 6: Verify Permissions
- [ ] Confirm you see:
  ```
  Microsoft Graph
    User.Read (Delegated) - ✅ Granted
  
  Power BI Service / Microsoft Fabric
    Workspace.Read.All (Delegated) - ✅ Granted
    Workspace.ReadWrite.All (Delegated) - ✅ Granted
    Item.Read.All (Delegated) - ✅ Granted
    Item.ReadWrite.All (Delegated) - ✅ Granted
  ```

**Estimated time: 3-5 minutes**

**Status: 🔲 PENDING**

---

### 🔲 Phase 3: Clear Browser Cache (CRITICAL!)

#### Option A: Using Console (Recommended)
- [ ] Open your app: http://localhost:4200
- [ ] Press `F12` to open DevTools
- [ ] Go to Console tab
- [ ] Run these commands:
  ```javascript
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
  ```

#### Option B: Manual Clear
- [ ] Press `Ctrl+Shift+Delete`
- [ ] Select "All time"
- [ ] Check "Cookies and other site data"
- [ ] Check "Cached images and files"
- [ ] Click "Clear data"
- [ ] Reload app

**Why?** Old tokens are cached and will cause the same error!

**Status: 🔲 PENDING**

---

### 🔲 Phase 4: Test Login

#### Start Dev Server
- [ ] Run: `ng serve`
- [ ] Wait for: "✔ Browser application bundle generation complete"
- [ ] Navigate to: http://localhost:4200

#### Perform Login
- [ ] Open DevTools (F12) → Console tab
- [ ] Click "Login" button
- [ ] Popup should open

#### First Consent (Graph)
- [ ] Popup shows Microsoft sign-in
- [ ] Sign in with your account
- [ ] Accept Graph permissions (if prompted)
- [ ] Popup closes

#### Second Consent (Fabric) - EXPECTED!
- [ ] **NEW**: Another popup opens for Fabric permissions
- [ ] Shows permissions:
  - View all content in tenant
  - Read and write all content in tenant
  - etc.
- [ ] Click "Accept"
- [ ] Popup closes

**Note:** Second popup only appears once per user!

#### Verify Console Output
- [ ] Console shows: `✅ Graph authentication successful!`
- [ ] Console shows: `✅ Fabric token acquired`
- [ ] Console shows: `🔍 Token Details:`
- [ ] Console shows: `📍 Audience: https://api.fabric.microsoft.com`
- [ ] Console shows: `🔑 Scopes: Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All`
- [ ] Console shows: `✅ Token audience is correct (Fabric API)`
- [ ] Console shows: `✅ Token has scopes`
- [ ] Console shows: `✅ Backend login successful!`

**Status: 🔲 PENDING**

---

### 🔲 Phase 5: Test Query

#### Send Test Query
- [ ] After successful login, you see chat interface
- [ ] Type query: "total plan count"
- [ ] Press Enter or click Send
- [ ] Watch console and Network tab

#### Verify Success
- [ ] Console shows: `📤 Sending query v3: total plan count...`
- [ ] Console shows: `✅ Query successful`
- [ ] **No 403 error!**
- [ ] Response received in UI
- [ ] Response contains actual data (not error message)

#### Example Success Response
```json
{
  "success": true,
  "response": "The total plan count is 42",
  "query": "total plan count"
}
```

**Status: 🔲 PENDING**

---

## 🚨 Troubleshooting

### If Azure AD Permissions Not Working

**Problem**: Can't find "Power BI Service" or "Microsoft Fabric"

**Solution 1**: Use Application ID
```
In "Request API permissions":
1. APIs my organization uses
2. Enter: 00000009-0000-0000-c000-000000000000
3. Press Enter
4. Select it
5. Add permissions
```

**Solution 2**: Try alternative scope
```typescript
// In environment.ts, try:
fabric: ['https://analysis.windows.net/powerbi/api/.default']
```

**Solution 3**: Contact your Azure AD admin
- You might need Global Administrator role
- Fabric API might not be enabled in your tenant

---

### If Still Getting 403 Error

**Check 1**: Verify token scopes in console
```
🔍 Token Details:
  🔑 Scopes (scp): ???
```

**Expected**: Should show all 4 scopes  
**If empty**: Azure AD permissions not configured correctly

**Check 2**: Verify token audience
```
📍 Audience (aud): ???
```

**Expected**: `https://api.fabric.microsoft.com`  
**If different**: Wrong token being used

**Check 3**: Clear cache again
```javascript
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});
location.reload();
```

---

### If Popup Doesn't Appear

**Problem**: Popup blocked

**Solution**:
1. Check browser address bar for popup blocker icon
2. Click "Always allow popups from login.microsoftonline.com"
3. Try login again

---

### If Token Has No Scopes

**Console shows**:
```
⚠️ Token has no scopes or roles!
```

**Cause**: Azure AD permissions not added or not consented

**Fix**:
1. Verify permissions in Azure Portal (Phase 2)
2. Grant admin consent
3. Clear cache
4. Login again

---

## 📊 Status Dashboard

| Phase | Task | Status | Time |
|-------|------|--------|------|
| 1 | Code Changes | ✅ Done | - |
| 2 | Azure AD Permissions | 🔲 Pending | 3-5 min |
| 3 | Clear Cache | 🔲 Pending | 30 sec |
| 4 | Test Login | 🔲 Pending | 2 min |
| 5 | Test Query | 🔲 Pending | 1 min |

**Total estimated time: ~10 minutes**

---

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ Login completes without errors
2. ✅ Console shows token with scopes
3. ✅ Query returns 200 OK (not 403)
4. ✅ Response contains actual data
5. ✅ No "Token does not have required scopes" error

---

## 📚 Reference Documents

Created for you:
- `QUICK_FIX_SUMMARY.md` - Quick reference
- `TESTING_GUIDE_SPECIFIC_SCOPES.md` - Detailed testing guide
- `VISUAL_FIX_GUIDE.md` - Visual diagrams
- `FIX_AADSTS65001_CONSENT_REQUIRED.md` - Azure AD consent guide

---

## 🚀 Ready to Go!

**Next action:** Complete Phase 2 (Azure Portal configuration)

**Time needed:** 5 minutes

**Result:** 403 error will be fixed! 🎉

---

**Need help?** Check the troubleshooting section or reference documents above.
