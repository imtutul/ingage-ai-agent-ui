# 🚨 Still Getting 403? Complete Troubleshooting Guide

## Current Situation

✅ Frontend code is correct (sends Fabric token)
✅ Scopes are set to `.default` for Fabric API
❌ Still getting 403 with "MLModel" resource type error

**This means the issue is likely one of these:**

---

## 🎯 Issue #1: Token Has Wrong Scopes (Most Likely!)

### Problem:
Even though token has correct audience (`api.fabric.microsoft.com`), it might not have the **specific scopes** that the Fabric AI Skill needs.

### Solution: Try Specific Fabric Scopes

Update your environment files to request specific Fabric scopes instead of `.default`:

```typescript
// environment.ts & environment.prod.ts
apiScopes: {
  graph: ['User.Read'],
  fabric: [
    // Try these Fabric-specific scopes:
    'https://api.fabric.microsoft.com/Item.Execute.All',
    'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
    'https://api.fabric.microsoft.com/Item.ReadWrite.All'
  ]
}
```

**These scopes specifically allow:**
- `Item.Execute.All` - Execute items (including AI Skills!)
- `Workspace.ReadWrite.All` - Access workspaces
- `Item.ReadWrite.All` - Read/write items

---

## 🎯 Issue #2: Azure AD Missing Fabric API Permissions

### Problem:
You added **Power BI Service** permissions, but the AI Skill needs **Microsoft Fabric** permissions!

### Check Azure Portal:

1. Go to Azure Portal → App registrations → Your app
2. API permissions
3. Look for **"Microsoft Fabric"** (not Power BI Service!)

### If You Only See Power BI Service:

**Add Microsoft Fabric API permissions:**

1. Click "+ Add a permission"
2. Search for: **"Microsoft Fabric"**
   - If not found, try Application ID: `00000009-0000-0000-c000-000000000000`
3. Select **Delegated permissions**:
   - ✅ `Item.Execute.All`
   - ✅ `Workspace.ReadWrite.All`
   - ✅ `Item.ReadWrite.All`
4. Click "Add permissions"
5. **Grant admin consent**

---

## 🎯 Issue #3: User Doesn't Have Access to AI Skill

### Problem:
The token is correct, but the **user doesn't have permission** to the specific AI Skill in Fabric.

### Check Fabric Workspace Permissions:

1. Go to: https://app.fabric.microsoft.com
2. Navigate to your workspace: `d09dbe6d-b3f5-4188-a375-482e01aa1213`
3. Find the AI Skill: `731c5acd-dbd7-4881-94f4-13ecf0d39c49`
4. Click on the AI Skill → Settings → **Manage permissions**
5. Verify user `shahriar@insightinhealth.com` has access

**Required role:** Admin or Member (not Viewer!)

### If User Not in List:

1. Click "Add people"
2. Enter: `shahriar@insightinhealth.com`
3. Select role: **Member** or **Admin**
4. Click "Add"
5. Wait 1-2 minutes for permissions to propagate

---

## 🎯 Issue #4: Backend Using Token Incorrectly

### Problem:
Frontend sends correct token, but backend doesn't pass it correctly to Fabric API.

### Check Backend Code:

Your backend should be calling the Fabric AI Skill like this:

```python
import requests

# Get token from session
access_token = request.session.get("access_token")

# Fabric AI Skill endpoint
FABRIC_SKILL_URL = "https://api.fabric.microsoft.com/v1/workspaces/{workspace_id}/items/{skill_id}/jobs/instances?jobType=RunSkill"

workspace_id = "d09dbe6d-b3f5-4188-a375-482e01aa1213"
skill_id = "731c5acd-dbd7-4881-94f4-13ecf0d39c49"

url = FABRIC_SKILL_URL.format(workspace_id=workspace_id, skill_id=skill_id)

headers = {
    "Authorization": f"Bearer {access_token}",  ← CRITICAL!
    "Content-Type": "application/json"
}

payload = {
    "executionData": {
        "input": query_text
    }
}

response = requests.post(url, headers=headers, json=payload)
```

**Common mistakes:**
- ❌ Not including `Authorization` header
- ❌ Using wrong token (Graph token instead of Fabric token)
- ❌ Token format wrong (should be `Bearer {token}`)
- ❌ Token expired

---

## 🧪 Comprehensive Test Plan

### Test 1: Verify Token in Browser Console

After login, run this in browser console (F12):

```javascript
// Get all MSAL tokens
Object.keys(localStorage).forEach(key => {
  if (key.includes('msal') && key.includes('accesstoken')) {
    console.log('Found token:', key);
    const tokenData = JSON.parse(localStorage.getItem(key));
    
    if (tokenData.secret) {
      const token = tokenData.secret;
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('=== TOKEN PAYLOAD ===');
      console.log('Audience:', payload.aud);
      console.log('Scopes:', payload.scp);
      console.log('Roles:', payload.roles);
      console.log('App ID:', payload.appid);
      console.log('Expiration:', new Date(payload.exp * 1000));
    }
  }
});
```

**What to check:**
- ✅ Audience should be: `https://api.fabric.microsoft.com`
- ✅ Scopes should exist (not null)
- ✅ Expiration should be in the future

---

### Test 2: Check Backend Receives Correct Token

Add this to your backend `/auth/client-login`:

```python
import jwt

@app.post("/auth/client-login")
async def client_login(request: Request, token_data: dict = Body(...)):
    access_token = token_data.get("access_token")
    
    # Decode token (no verification, just to see contents)
    decoded = jwt.decode(access_token, options={"verify_signature": False})
    
    print("=" * 60)
    print("TOKEN RECEIVED FROM FRONTEND:")
    print(f"Audience: {decoded.get('aud')}")
    print(f"Scopes: {decoded.get('scp')}")
    print(f"Roles: {decoded.get('roles')}")
    print("=" * 60)
    
    # ... rest of code
```

**Expected output:**
```
TOKEN RECEIVED FROM FRONTEND:
Audience: https://api.fabric.microsoft.com
Scopes: Item.Execute.All Workspace.ReadWrite.All ...
```

---

### Test 3: Check Token Sent to Fabric API

Add this to your backend `/query`:

```python
@app.post("/query")
async def query(request: Request, query_data: dict = Body(...)):
    access_token = request.session.get("access_token")
    
    # Decode token
    decoded = jwt.decode(access_token, options={"verify_signature": False})
    
    print("=" * 60)
    print("TOKEN BEING SENT TO FABRIC API:")
    print(f"Audience: {decoded.get('aud')}")
    print(f"Scopes: {decoded.get('scp')}")
    print(f"Expired: {datetime.now().timestamp() > decoded.get('exp', 0)}")
    print("=" * 60)
    
    # Make Fabric API call
    headers = {"Authorization": f"Bearer {access_token}"}
    # ... rest of code
```

---

## 📋 Action Checklist

Try these in order:

### Option 1: Add Specific Fabric Scopes (RECOMMENDED)

- [ ] Update `environment.ts`:
  ```typescript
  fabric: [
    'https://api.fabric.microsoft.com/Item.Execute.All',
    'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',
    'https://api.fabric.microsoft.com/Item.ReadWrite.All'
  ]
  ```
- [ ] Update `environment.prod.ts` (same)
- [ ] Clear cache
- [ ] Login
- [ ] Test query

---

### Option 2: Add Fabric API Permissions in Azure

- [ ] Azure Portal → App registrations
- [ ] API permissions → Add permission
- [ ] Search: "Microsoft Fabric"
- [ ] Add: `Item.Execute.All`, `Workspace.ReadWrite.All`, `Item.ReadWrite.All`
- [ ] Grant admin consent
- [ ] Clear cache
- [ ] Login
- [ ] Test query

---

### Option 3: Check User Fabric Permissions

- [ ] Go to https://app.fabric.microsoft.com
- [ ] Open workspace
- [ ] Find AI Skill
- [ ] Check user has Member/Admin access
- [ ] Test query

---

### Option 4: Debug Backend

- [ ] Add token debugging to backend
- [ ] Check token audience in backend logs
- [ ] Check token scopes in backend logs
- [ ] Verify token passed to Fabric API correctly

---

## 🎯 Most Likely Solution

Based on the error `'resourceType': 'MLModel'`, the AI Skill needs **`Item.Execute.All`** scope!

**Try this now:**

1. Update both environment files:
   ```typescript
   fabric: ['https://api.fabric.microsoft.com/Item.Execute.All']
   ```

2. Add this permission in Azure Portal:
   - Microsoft Fabric → Item.Execute.All (Delegated)
   - Grant admin consent

3. Clear cache
4. Login
5. Test

**This single scope might be all you need!**

---

## 🔍 If Still Failing After All This

Then the issue is:
1. **AI Skill configuration** in Fabric
2. **Workspace permissions** (user doesn't have access)
3. **Backend code** (not calling Fabric API correctly)

Share:
- Backend console logs with token debug output
- Fabric workspace URL
- AI Skill URL
- User email

I'll help debug further!

---

**Start with Option 1 (Item.Execute.All scope) - it's the most likely fix!** 🚀
