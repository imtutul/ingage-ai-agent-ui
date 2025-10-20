# 🔍 Debug Query Error - Step by Step

## 📸 What I See in Your Screenshot

From the console logs, I can see:

✅ **Login succeeded:**
- Graph authentication successful
- User: shahriar@insightinhealth.com
- MSAL auth state changed: true

⚠️ **But there's an issue with Fabric token:**
- Step 2: Acquiring Fabric API token...
- ❌ POST to Microsoft login: **400 (Bad Request)**
- ⚠️ "Interaction required, using popup for Fabric token..."

---

## 🎯 Root Cause

The **400 Bad Request** when acquiring the Fabric token means:

### Issue: Fabric API Permissions Not Configured in Azure AD

Your app was registered in Azure AD, but the **Fabric API permissions** were never added!

**What's happening:**
1. ✅ Graph authentication works (User.Read permission exists)
2. ❌ Fabric token acquisition fails (no Fabric API permissions)
3. ⚠️ App tries to open another popup for consent
4. 🔄 You need to grant Fabric permissions

---

## ✅ Fix: Add Fabric API Permissions in Azure Portal

### Step 1: Open Azure Portal

1. Go to: https://portal.azure.com
2. Search for **"App registrations"**
3. Find your app: **fabric-data-agent-service**
   - Client ID: `3503e363-86d6-4b02-807d-489886873632`

---

### Step 2: Add API Permissions

1. Click on your app registration
2. Left sidebar → **"API permissions"**
3. Click **"+ Add a permission"**

---

### Step 3: Add Power BI Service / Fabric API

4. In the "Request API permissions" panel:
   - Click **"APIs my organization uses"**
   - Search for: **"Power BI Service"** or **"Fabric"**
   - You might see:
     - **Power BI Service**
     - **Microsoft Fabric**
     - Look for API with base URL: `https://api.fabric.microsoft.com`

5. Select the API

6. Choose **"Delegated permissions"**

7. Select these permissions:
   ```
   ✅ Tenant.Read.All      (View all content in tenant)
   ✅ Tenant.ReadWrite.All (Read and write all content in tenant)
   ```

8. Click **"Add permissions"**

---

### Step 4: Grant Admin Consent

9. Back in the "API permissions" page, you'll see:
   ```
   Power BI Service / Fabric API
   ✅ Tenant.Read.All
   ✅ Tenant.ReadWrite.All
   ⚠️ Admin consent required
   ```

10. Click **"Grant admin consent for [your organization]"**
11. Click **"Yes"** to confirm

---

### Step 5: Verify Configuration

After granting consent, you should see:

```
API / Permission name                        Type        Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Microsoft Graph
  User.Read                                  Delegated   ✅ Granted

Power BI Service / Fabric API
  Tenant.Read.All                            Delegated   ✅ Granted
  Tenant.ReadWrite.All                       Delegated   ✅ Granted
```

---

## 🧪 Alternative: Check if API is Available

If you **can't find "Power BI Service"** or **"Fabric API"** in the list:

### Option A: Add by Application ID

1. In "Request API permissions" → **"APIs my organization uses"**
2. Enter this Application ID: `00000009-0000-0000-c000-000000000000`
   - This is the standard Power BI Service App ID
3. Select delegated permissions

### Option B: Use Custom Scope

If the above doesn't work, try:

1. Click **"+ Add a permission"**
2. Click **"APIs my organization uses"**
3. Search for: **"Fabric"** or **"Analysis Services"**
4. Or manually configure the scope in your code:
   ```typescript
   fabric: ['https://analysis.windows.net/powerbi/api/.default']
   ```

---

## 🔧 After Adding Permissions

### Test Again:

1. **Clear your browser cache:**
   ```javascript
   // In browser console (F12):
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Click "Login" again**

3. **Expected flow:**
   ```
   Click Login
       ↓
   Popup opens (Graph consent)
       ↓
   Accept permissions
       ↓
   Another popup opens (Fabric consent) ← THIS IS NEW!
       ↓
   Accept permissions
       ↓
   ✅ Both tokens acquired
       ↓
   ✅ Login successful!
   ```

---

## 🎯 What You'll See in Console After Fix

**Before fix:**
```
✅ Graph authentication successful!
🔑 Step 2: Acquiring Fabric API token...
❌ 400 (Bad Request)
⚠️ Interaction required, using popup for Fabric token...
```

**After fix:**
```
✅ Graph authentication successful!
🔑 Step 2: Acquiring Fabric API token...
✅ Fabric token acquired silently
📤 Sending token to backend...
✅ Backend login successful!
🍪 Session cookie set
```

Or with popup:
```
✅ Graph authentication successful!
🔑 Step 2: Acquiring Fabric API token...
⚠️ Interaction required, using popup for Fabric token...
   [Fabric consent popup opens]
   [You accept]
✅ Fabric token acquired via popup
📤 Sending token to backend...
✅ Backend login successful!
```

---

## 📋 Quick Summary

**Problem**: Fabric API permissions not configured in Azure AD  
**Solution**: Add Power BI Service / Fabric API permissions  
**Required Permissions**:
- Tenant.Read.All
- Tenant.ReadWrite.All

**Then**: Grant admin consent

---

## 🚨 If Queries Still Fail After Login

If you successfully login but queries still fail with 403:

### Check Backend Logs

Your backend needs to:
1. ✅ Receive the Fabric token from frontend
2. ✅ Validate the token
3. ✅ Use the token to call Fabric API
4. ✅ Return data to frontend

### Check Backend Code

Make sure your backend `/auth/client-login` endpoint:
```python
@app.post("/auth/client-login")
async def client_login(request: Request, token: str = Body(...)):
    # Store the Fabric token
    # NOT the Graph token!
    
    # Verify token is for Fabric API
    # audience should be: https://api.fabric.microsoft.com
    
    # Create session with token
    # ...
```

And your `/query` endpoint:
```python
@app.post("/query")
async def query(request: Request, query: str = Body(...)):
    # Get token from session
    token = request.session.get("access_token")
    
    # Use token to call Fabric API
    headers = {"Authorization": f"Bearer {token}"}
    
    # Make Fabric API call
    # ...
```

---

## 🔍 Debug Commands

### Check current tokens in browser:

```javascript
// F12 Console
console.log('=== All Storage ===');

// Check localStorage
console.log('localStorage:', Object.keys(localStorage));

// Check MSAL cache
Object.keys(localStorage).forEach(key => {
  if (key.includes('msal')) {
    const val = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(val);
      console.log(key, ':', parsed);
    } catch {
      console.log(key, ':', val);
    }
  }
});

// Check session cookie
console.log('Cookies:', document.cookie);
```

---

## ✅ Success Checklist

- [ ] Azure Portal → App registrations → Your app
- [ ] API permissions → Add a permission
- [ ] Added Power BI Service / Fabric API
- [ ] Selected Tenant.Read.All and Tenant.ReadWrite.All
- [ ] Granted admin consent
- [ ] Cleared browser cache
- [ ] Logged in again
- [ ] Accepted both consent screens (Graph + Fabric)
- [ ] Console shows "Fabric token acquired"
- [ ] Can send queries successfully

---

**Next Steps**: Add the Fabric API permissions in Azure Portal, then try logging in again! 🚀
