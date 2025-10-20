# ✅ Testing Guide: Specific Fabric Scopes Fix

## 🔧 Changes Made

### 1. Updated Environment Files

**Before:**
```typescript
fabric: ['https://api.fabric.microsoft.com/.default']
```

**After:**
```typescript
fabric: [
  'https://api.fabric.microsoft.com/Workspace.Read.All',
  'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
  'https://api.fabric.microsoft.com/Item.Read.All',
  'https://api.fabric.microsoft.com/Item.ReadWrite.All'
]
```

### 2. Added Token Debugging

The MSAL service now logs detailed token information:
- Token audience
- Token scopes
- Token roles
- Expiration time

---

## 🧪 Testing Steps

### Step 1: Configure Azure AD Permissions (CRITICAL!)

Before testing, you **MUST** add these permissions in Azure Portal:

1. Go to: https://portal.azure.com
2. **Azure Active Directory** → **App registrations**
3. Find: `fabric-data-agent-service` (Client ID: `3503e363-86d6-4b02-807d-489886873632`)
4. Click **API permissions**
5. Click **"+ Add a permission"**
6. Select **"APIs my organization uses"**
7. Search for: **"Microsoft Fabric"** or **"Power BI Service"**
8. Select **Delegated permissions**:
   - ✅ `Workspace.Read.All`
   - ✅ `Workspace.ReadWrite.All`
   - ✅ `Item.Read.All`
   - ✅ `Item.ReadWrite.All`
9. Click **"Add permissions"**
10. Click **"Grant admin consent for [Your Organization]"**
11. Click **"Yes"**
12. Wait for green checkmarks to appear

**Result:**
```
API / Permission name              Type        Status
──────────────────────────────────────────────────────
Microsoft Graph
  User.Read                        Delegated   ✅ Granted

Microsoft Fabric / Power BI Service
  Workspace.Read.All               Delegated   ✅ Granted
  Workspace.ReadWrite.All          Delegated   ✅ Granted
  Item.Read.All                    Delegated   ✅ Granted
  Item.ReadWrite.All               Delegated   ✅ Granted
```

---

### Step 2: Clear Browser Cache

**IMPORTANT!** Old tokens are cached and will cause issues.

```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or:
- Press `Ctrl+Shift+Delete`
- Select "All time"
- Check "Cookies and other site data"
- Check "Cached images and files"
- Click "Clear data"

---

### Step 3: Start Development Server

```bash
ng serve
```

Wait for:
```
✔ Browser application bundle generation complete.
✔ Built at: [timestamp]
```

---

### Step 4: Open Browser and Login

1. Navigate to: `http://localhost:4200`
2. Open Developer Tools (F12) → **Console** tab
3. Click **"Login"** button

---

### Step 5: Watch Console Output

#### Expected Flow - Silent Success:

```
🔑 Starting client-side login flow...
🌐 MSAL popup will open...
🔵 Step 1: Starting popup login with Graph authentication...
✅ Graph authentication successful!
👤 User: shahriar@insightinhealth.com
🔑 Step 2: Acquiring Fabric API token...
✅ Fabric token acquired silently
🎟️ Token audience: shahriar@insightinhealth.com
🔑 Token scopes requested: [
  "https://api.fabric.microsoft.com/Workspace.Read.All",
  "https://api.fabric.microsoft.com/Workspace.ReadWrite.All",
  "https://api.fabric.microsoft.com/Item.Read.All",
  "https://api.fabric.microsoft.com/Item.ReadWrite.All"
]
🔍 Token Details:
  📍 Audience (aud): https://api.fabric.microsoft.com
  🔑 Scopes (scp): Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All
  👤 Roles: N/A
  ⏰ Expires: [timestamp]
  🆔 App ID (appid): 3503e363-86d6-4b02-807d-489886873632
✅ Token audience is correct (Fabric API)
✅ Token has scopes: Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All
📤 Sending token to backend...
✅ Backend login successful!
```

#### Expected Flow - Consent Required (First Time):

```
🔑 Starting client-side login flow...
🌐 MSAL popup will open...
🔵 Step 1: Starting popup login with Graph authentication...
✅ Graph authentication successful!
👤 User: shahriar@insightinhealth.com
🔑 Step 2: Acquiring Fabric API token...
⚠️ Interaction required, using popup for Fabric token...
   [Another popup opens with Fabric consent screen]
   [Click "Accept"]
✅ Fabric token acquired via popup
🔑 Token scopes requested: [
  "https://api.fabric.microsoft.com/Workspace.Read.All",
  "https://api.fabric.microsoft.com/Workspace.ReadWrite.All",
  "https://api.fabric.microsoft.com/Item.Read.All",
  "https://api.fabric.microsoft.com/Item.ReadWrite.All"
]
🔍 Token Details:
  📍 Audience (aud): https://api.fabric.microsoft.com
  🔑 Scopes (scp): Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All
✅ Token audience is correct (Fabric API)
✅ Token has scopes: Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All
📤 Sending token to backend...
✅ Backend login successful!
```

---

### Step 6: Test Query

1. After successful login, you should see the chat interface
2. Type a query: **"total plan count"**
3. Press Enter or click Send

#### Expected Success Response:

```
📤 Sending query v3: total plan count...
✅ Query successful
📊 SQL: SELECT COUNT(*) FROM plans...
```

**Response in UI:**
```json
{
  "success": true,
  "response": "The total plan count is 42",
  "query": "total plan count"
}
```

#### If Still Getting 403:

```
❌ Query failed: 403
{
  "success": false,
  "error": "Token does not have required scopes"
}
```

**Action**: Check token details in console - verify scopes are present!

---

## 🔍 Debugging Token Issues

### Check Token Scopes Manually

After login, in browser console:

```javascript
// Get all localStorage keys
Object.keys(localStorage).forEach(key => {
  if (key.includes('msal') && key.includes('accesstoken')) {
    console.log(key);
    const token = JSON.parse(localStorage.getItem(key));
    console.log('Token:', token);
  }
});
```

### Decode Token Manually

```javascript
// Copy your access token from network tab or localStorage
const token = 'YOUR_TOKEN_HERE';

const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('Audience:', payload.aud);
console.log('Scopes:', payload.scp);
console.log('Roles:', payload.roles);
console.log('Expires:', new Date(payload.exp * 1000));
```

**What to verify:**
- ✅ `payload.aud` should be `https://api.fabric.microsoft.com`
- ✅ `payload.scp` should include: `Workspace.Read.All Workspace.ReadWrite.All Item.Read.All Item.ReadWrite.All`
- ✅ `payload.exp` should be in the future (not expired)

---

## 🚨 Common Issues and Fixes

### Issue 1: "Token does not have required scopes" (403)

**Cause**: Azure AD permissions not configured

**Fix**:
1. Go to Azure Portal
2. Add API permissions (see Step 1 above)
3. Grant admin consent
4. Clear browser cache
5. Login again

---

### Issue 2: Token has no scopes (`payload.scp` is undefined)

**Cause**: `.default` scope doesn't include specific scopes

**Fix**: Already done! We changed to specific scopes.

**Verify**: Check console for token details - should show scopes

---

### Issue 3: "AADSTS65001: consent_required"

**Cause**: Permissions not consented

**Expected**: A consent popup should appear automatically

**If popup doesn't appear**:
1. Check popup blocker
2. Allow popups for `login.microsoftonline.com`
3. Try login again

---

### Issue 4: "AADSTS650052: The app needs access to a service"

**Cause**: Fabric API not available in your tenant

**Fix**:
- Your organization needs to enable Fabric
- Or use Power BI Service API instead:

```typescript
// Try Power BI scopes instead
fabric: [
  'https://analysis.windows.net/powerbi/api/Dataset.Read.All',
  'https://analysis.windows.net/powerbi/api/Workspace.Read.All'
]
```

---

### Issue 5: Token audience is wrong

**Console shows:**
```
📍 Audience (aud): 00000003-0000-0000-c000-000000000000
⚠️ Token audience might be incorrect
```

**Cause**: Got Graph token instead of Fabric token

**Fix**: Check MSAL service - ensure `acquireFabricToken` is called

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Azure AD permissions added and granted
- [ ] Browser cache cleared
- [ ] Development server running
- [ ] Login successful (no errors)
- [ ] Console shows: "✅ Fabric token acquired"
- [ ] Console shows: "✅ Token audience is correct (Fabric API)"
- [ ] Console shows: "✅ Token has scopes: Workspace.Read.All..."
- [ ] Console shows: "✅ Backend login successful!"
- [ ] Query test: "total plan count"
- [ ] Response received (no 403 error)
- [ ] Response contains actual data

---

## 📊 Before vs After

### Before (❌ Not Working):
```
Request to Fabric API
Headers:
  Authorization: Bearer eyJ0eXAi... (token with no scopes)

Fabric API Response:
  403 Forbidden
  "Token does not have required scopes"
```

### After (✅ Working):
```
Request to Fabric API
Headers:
  Authorization: Bearer eyJ0eXAi... (token with Workspace.Read.All etc)

Fabric API Response:
  200 OK
  { "response": "The total plan count is 42" }
```

---

## 🎯 If Still Not Working

### Share This Information:

1. **Console output** (copy all logs from login attempt)

2. **Token details** (from token debugging):
   ```javascript
   // Run in console and share output:
   const token = localStorage.getItem('[your-msal-token-key]');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Audience:', payload.aud);
   console.log('Scopes:', payload.scp);
   console.log('Roles:', payload.roles);
   ```

3. **Azure AD permissions screenshot**:
   - Portal → App registrations → Your app → API permissions

4. **Error response** (if 403 still occurs):
   - Network tab → Failed request → Response

---

## 🚀 Next Steps After Success

1. **Test all queries** to ensure functionality
2. **Test in production** with production environment
3. **Monitor token expiration** (tokens expire after ~1 hour)
4. **Test token refresh** (automatic, but verify it works)

---

**Good luck! The fix should work now with specific scopes.** 🎉
