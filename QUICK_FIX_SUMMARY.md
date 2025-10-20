# 🚀 Quick Fix Summary: 403 Scopes Error

## ✅ What Was Changed

### 1. Frontend Code (✅ DONE)
```typescript
// environment.ts & environment.prod.ts
fabric: [
  'https://api.fabric.microsoft.com/Workspace.Read.All',
  'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
  'https://api.fabric.microsoft.com/Item.Read.All',
  'https://api.fabric.microsoft.com/Item.ReadWrite.All'
]
```

### 2. Token Debugging (✅ DONE)
- Added `logTokenDetails()` method
- Now logs token audience, scopes, roles, expiration

---

## ⚠️ What YOU Need to Do

### Step 1: Azure Portal (CRITICAL!)

You **MUST** add these permissions in Azure AD:

1. Go to: https://portal.azure.com
2. **App registrations** → `fabric-data-agent-service`
3. **API permissions** → **"+ Add a permission"**
4. Search: **"Power BI Service"** or **"Microsoft Fabric"**
5. Add **Delegated permissions**:
   - ✅ Workspace.Read.All
   - ✅ Workspace.ReadWrite.All
   - ✅ Item.Read.All
   - ✅ Item.ReadWrite.All
6. **"Grant admin consent for [org]"** → Click **"Yes"**

**Time: 2-3 minutes**

---

### Step 2: Clear Cache

```javascript
// Browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### Step 3: Test

1. Login
2. Watch console for token details
3. Try query: "total plan count"
4. ✅ Should work!

---

## 🔍 How to Verify It Worked

### In Console After Login:

**Look for:**
```
✅ Fabric token acquired
🔍 Token Details:
  📍 Audience (aud): https://api.fabric.microsoft.com
  🔑 Scopes (scp): Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All
✅ Token audience is correct (Fabric API)
✅ Token has scopes: ...
```

**If you see this, you're good!** ✅

---

## 🚨 If Still Getting 403

### Check 1: Azure AD Permissions

Portal → App registrations → Your app → API permissions

Should show:
```
✅ Microsoft Fabric / Power BI Service
   ├── Workspace.Read.All (Granted)
   ├── Workspace.ReadWrite.All (Granted)
   ├── Item.Read.All (Granted)
   └── Item.ReadWrite.All (Granted)
```

### Check 2: Token Scopes

Console should show:
```
🔑 Scopes (scp): Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All
```

If scopes are missing or wrong → Azure AD permissions not configured correctly!

### Check 3: Cache

Make sure you cleared cache:
```javascript
localStorage.clear();
sessionStorage.clear();
```

---

## 📋 Files Changed

1. ✅ `src/environments/environment.ts` - Updated fabric scopes
2. ✅ `src/environments/environment.prod.ts` - Updated fabric scopes
3. ✅ `src/app/services/msal.service.ts` - Added token debugging

---

## 🎯 Bottom Line

**Code changes:** ✅ Done  
**What you need to do:** Azure Portal permissions (2 minutes)  
**Expected result:** 403 error goes away, queries work! 🎉

---

## 📚 Reference Documents

- `TESTING_GUIDE_SPECIFIC_SCOPES.md` - Detailed testing steps
- `FIX_AADSTS65001_CONSENT_REQUIRED.md` - Azure Portal guide (you created)

---

**Ready to test?** Add Azure AD permissions → Clear cache → Login → Test! 🚀
