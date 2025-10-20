# ✅ Updated: Power BI Service Scopes Configuration

## 🎉 Changes Applied

### Updated Files:
- ✅ `src/environments/environment.ts`
- ✅ `src/environments/environment.prod.ts`

### Scopes Updated:
Changed from 4 specific Fabric scopes to **ALL 20 Power BI Service scopes** that you added in Azure Portal.

---

## 📋 Complete List of Scopes Added

### Power BI Service API Base URL:
`https://analysis.windows.net/powerbi/api/`

### All 20 Delegated Permissions:

| # | Scope | Purpose |
|---|-------|---------|
| 1 | `App.Read.All` | Read all Power BI Apps |
| 2 | `Capacity.Read.All` | Read all capacity information |
| 3 | `Capacity.ReadWrite.All` | Read and write capacity settings |
| 4 | `Content.Create` | Create Power BI content |
| 5 | `Dashboard.Read.All` | Read all dashboards |
| 6 | `Dashboard.ReadWrite.All` | Read and write dashboards |
| 7 | `Dataflow.Read.All` | Read all dataflows |
| 8 | `Dataflow.ReadWrite.All` | Read and write dataflows |
| 9 | `Dataset.Read.All` | Read all datasets |
| 10 | `Dataset.ReadWrite.All` | Read and write datasets |
| 11 | `Gateway.Read.All` | Read all gateway information |
| 12 | `Gateway.ReadWrite.All` | Read and write gateway settings |
| 13 | `Report.Read.All` | Read all reports |
| 14 | `Report.ReadWrite.All` | Read and write reports |
| 15 | `StorageAccount.Read.All` | Read all storage account info |
| 16 | `StorageAccount.ReadWrite.All` | Read and write storage accounts |
| 17 | `Tenant.Read.All` | Read all tenant content |
| 18 | `Tenant.ReadWrite.All` | Read and write tenant content |
| 19 | `Workspace.Read.All` | Read all workspaces |
| 20 | `Workspace.ReadWrite.All` | Read and write workspaces |

---

## 🔍 Key Changes

### Before:
```typescript
fabric: [
  'https://api.fabric.microsoft.com/Workspace.Read.All',
  'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
  'https://api.fabric.microsoft.com/Item.Read.All',
  'https://api.fabric.microsoft.com/Item.ReadWrite.All'
]
```

**Issue**: Used `api.fabric.microsoft.com` which might not match your Azure AD permissions.

---

### After:
```typescript
fabric: [
  'https://analysis.windows.net/powerbi/api/App.Read.All',
  'https://analysis.windows.net/powerbi/api/Capacity.Read.All',
  'https://analysis.windows.net/powerbi/api/Capacity.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Content.Create',
  'https://analysis.windows.net/powerbi/api/Dashboard.Read.All',
  'https://analysis.windows.net/powerbi/api/Dashboard.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Dataflow.Read.All',
  'https://analysis.windows.net/powerbi/api/Dataflow.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Dataset.Read.All',
  'https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Gateway.Read.All',
  'https://analysis.windows.net/powerbi/api/Gateway.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Report.Read.All',
  'https://analysis.windows.net/powerbi/api/Report.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/StorageAccount.Read.All',
  'https://analysis.windows.net/powerbi/api/StorageAccount.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Tenant.Read.All',
  'https://analysis.windows.net/powerbi/api/Tenant.ReadWrite.All',
  'https://analysis.windows.net/powerbi/api/Workspace.Read.All',
  'https://analysis.windows.net/powerbi/api/Workspace.ReadWrite.All'
]
```

**Better**: Uses `analysis.windows.net/powerbi/api/` which is the standard Power BI Service API URL that matches your Azure AD "Power BI Service" permissions.

---

## 🧪 Testing Steps

### Step 1: Clear Browser Cache (CRITICAL!)

```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Why?** Old tokens with wrong scopes are cached!

---

### Step 2: Rebuild (Optional but Recommended)

```bash
ng build --configuration production
# or
ng serve
```

---

### Step 3: Test Login

1. Navigate to your app
2. Open DevTools (F12) → Console tab
3. Click "Login"
4. Watch for consent popup (might appear for new scopes)

---

### Step 4: Verify Token Scopes

**Expected console output:**

```
✅ Fabric token acquired
🔍 Token Details:
  📍 Audience (aud): https://analysis.windows.net/powerbi/api
  🔑 Scopes (scp): App.Read.All Capacity.Read.All Capacity.ReadWrite.All Content.Create Dashboard.Read.All Dashboard.ReadWrite.All Dataflow.Read.All Dataflow.ReadWrite.All Dataset.Read.All Dataset.ReadWrite.All Gateway.Read.All Gateway.ReadWrite.All Report.Read.All Report.ReadWrite.All StorageAccount.Read.All StorageAccount.ReadWrite.All Tenant.Read.All Tenant.ReadWrite.All Workspace.Read.All Workspace.ReadWrite.All
  ✅ Token has scopes
```

**Key points:**
- ✅ Audience should be: `https://analysis.windows.net/powerbi/api`
- ✅ Scopes should list all 20 permissions
- ✅ No errors about missing scopes

---

### Step 5: Test Query

```
Query: "total plan count"
Expected: 200 OK response with data
```

**Success indicators:**
- ✅ No 403 error
- ✅ Console shows: `✅ Query successful`
- ✅ Response contains actual data

---

## 🚨 Important Notes

### Note 1: API URL Difference

**Old (Fabric API):**
- `https://api.fabric.microsoft.com`
- Newer API, might not be fully available yet

**New (Power BI Service API):**
- `https://analysis.windows.net/powerbi/api`
- Established API, widely used
- Same underlying resources (Fabric = Power BI evolution)

---

### Note 2: Consent Popup

After this change, you might see a **new consent popup** because:
- Different API resource (`analysis.windows.net` vs `api.fabric.microsoft.com`)
- 20 scopes vs 4 scopes

**Expected flow:**
1. Login → Graph consent (if needed)
2. **NEW**: Power BI Service consent popup
3. Shows all 20 permissions
4. Click "Accept"
5. Done!

**This is normal and expected!**

---

### Note 3: Admin Consent

You already granted admin consent in Azure Portal, so:
- ✅ Individual users won't see consent popup
- ✅ Permissions are pre-approved for entire organization
- ✅ Only first login per user might show popup

---

## 🔍 Debugging: Verify Scopes in Token

### Method 1: Check Console (Automatic)

Our updated `msal.service.ts` already logs token details:

```
🔍 Token Details:
  📍 Audience (aud): ...
  🔑 Scopes (scp): ...
```

---

### Method 2: Manual Token Decode

```javascript
// In browser console (F12)
// After login, find your token in localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('msal') && key.includes('accesstoken')) {
    const tokenObj = JSON.parse(localStorage.getItem(key));
    console.log('Token Key:', key);
    console.log('Token Object:', tokenObj);
    
    if (tokenObj.secret) {
      const token = tokenObj.secret;
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('=== DECODED TOKEN ===');
      console.log('Audience:', payload.aud);
      console.log('Scopes:', payload.scp);
      console.log('Expires:', new Date(payload.exp * 1000));
    }
  }
});
```

**Expected output:**
```
Audience: https://analysis.windows.net/powerbi/api
Scopes: App.Read.All Capacity.Read.All ... (all 20 scopes)
```

---

## ✅ Success Checklist

- [x] Environment files updated with Power BI Service scopes
- [x] All 20 permissions match Azure Portal configuration
- [x] No compilation errors
- [ ] **Clear browser cache** ← YOU NEED TO DO THIS!
- [ ] **Test login**
- [ ] **Verify token scopes in console**
- [ ] **Test query - should return 200 OK**

---

## 🎯 What Changed and Why

| Aspect | Before | After | Why |
|--------|--------|-------|-----|
| **API URL** | `api.fabric.microsoft.com` | `analysis.windows.net/powerbi/api` | Match Azure Portal "Power BI Service" |
| **Scopes** | 4 scopes | 20 scopes | All permissions you added in portal |
| **Token Audience** | Fabric API | Power BI API | Standard, well-established API |

---

## 📊 Environment Configuration Summary

### Development (`environment.ts`):
```typescript
apiBaseUrl: 'https://ingage-ai-agent-api-c6f9htcfd3baa2b4.canadacentral-01.azurewebsites.net'
redirectUri: 'https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/'
fabric: [20 Power BI Service scopes]
```

### Production (`environment.prod.ts`):
```typescript
apiBaseUrl: 'https://ingage-ai-agent-api-c6f9htcfd3baa2b4.canadacentral-01.azurewebsites.net'
redirectUri: 'https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/'
fabric: [20 Power BI Service scopes]
```

**Both environments now use same configuration!**

---

## 🚀 Next Steps

1. **Clear cache** (CRITICAL!)
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Test login** - Accept any consent popups

3. **Verify token** - Check console for scopes

4. **Test query** - Should work without 403!

5. **Deploy to production** (if testing succeeds)

---

## 📚 Reference

- Azure Portal: All 20 Power BI Service permissions granted ✅
- Frontend: All 20 scopes configured ✅
- Token debugging: Built into `msal.service.ts` ✅

**Status: Ready to test!** 🎉

---

**The 403 "Token does not have required scopes" error should now be fixed!** 🚀
