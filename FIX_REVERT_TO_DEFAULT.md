# 🔧 CRITICAL FIX: Reverted to .default Scope

## ✅ What I Just Did

### Reverted both environment files to use `.default` scope:

**From:**
```typescript
fabric: [
  'https://analysis.windows.net/powerbi/api/App.Read.All',
  // ... 20 specific scopes
]
```

**Back to:**
```typescript
fabric: ['https://api.fabric.microsoft.com/.default']
```

---

## 🎯 Why This Fix Should Work

### The Problem We Had:

1. **Power BI Service API** audience: `https://analysis.windows.net/powerbi/api`
2. **Fabric AI Skill** expects audience: `https://api.fabric.microsoft.com`
3. Token audience mismatch → 403 error ❌

### The Solution:

Using `.default` with Fabric API URL:
- Frontend requests: `https://api.fabric.microsoft.com/.default`
- Azure AD grants: All permissions configured in Azure Portal for Fabric API
- Token audience: `https://api.fabric.microsoft.com` ✅
- Fabric AI Skill accepts the token ✅

---

## 🧪 Testing Steps (CRITICAL!)

### Step 1: Clear ALL Cache

**MUST DO THIS! Old tokens will cause same error!**

```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();

// Also clear IndexedDB (MSAL cache)
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    console.log('Deleting database:', db.name);
    indexedDB.deleteDatabase(db.name);
  });
});

// Reload
location.reload();
```

Or manually:
- Press `Ctrl+Shift+Delete`
- Select "All time"
- Check ALL boxes
- Click "Clear data"

---

### Step 2: Rebuild (Recommended)

```bash
ng serve
# or
ng build --configuration production
```

---

### Step 3: Login and Watch Console

1. Navigate to: `https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/`
2. Open DevTools (F12) → Console tab
3. Click "Login"

**Expected console output:**

```
✅ Graph authentication successful!
👤 User: shahriar@insightinhealth.com
🔑 Step 2: Acquiring Fabric API token...
✅ Fabric token acquired silently
🔑 Token scopes requested: ["https://api.fabric.microsoft.com/.default"]
🔍 Token Details:
  📍 Audience (aud): https://api.fabric.microsoft.com    ← CRITICAL: Must be Fabric!
  🔑 Scopes (scp): ...                                    ← Should have scopes
  ⏰ Expires: [future date]
✅ Token audience is correct (Fabric API)
✅ Token has scopes
📤 Sending token to backend...
✅ Backend login successful!
```

**CRITICAL CHECK:**
- ✅ Audience MUST be: `https://api.fabric.microsoft.com`
- ✅ NOT: `https://analysis.windows.net/powerbi/api`

---

### Step 4: Test Query

1. Type query: "total plan count"
2. Press Enter

**Expected response:**
```json
{
  "success": true,
  "response": "The total plan count is 42",
  "query": "total plan count"
}
```

**NOT the 403 error!**

---

## 🚨 If Still Getting 403

### Check 1: Verify Token Audience

Console should show:
```
📍 Audience (aud): https://api.fabric.microsoft.com
```

If you see:
```
📍 Audience (aud): https://analysis.windows.net/powerbi/api
```

**Then:** Old token is still cached! Clear cache again!

---

### Check 2: Verify Token Has Scopes

Console should show:
```
🔑 Scopes (scp): [some scopes]
```

or

```
👤 Roles: [some roles]
```

If both are empty:
```
🔑 Scopes (scp): N/A
👤 Roles: N/A
⚠️ Token has no scopes or roles!
```

**Then:** Azure AD permissions not configured correctly!

---

### Check 3: Backend Token

The issue might be in the **backend**, not the frontend!

**Verify backend is:**
1. Using the token from session correctly
2. Passing the token to Fabric API
3. Calling the correct Fabric API endpoint

**Add this to your backend for debugging:**

```python
import jwt
import json

@app.post("/query")
async def query(request: Request, query_text: str = Body(..., alias="query")):
    # Get token from session
    token = request.session.get("access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="No token in session")
    
    # DEBUG: Decode token
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        print("=" * 60)
        print("🔍 BACKEND TOKEN DEBUG")
        print("=" * 60)
        print(f"📍 Audience: {decoded.get('aud')}")
        print(f"🔑 Scopes: {decoded.get('scp')}")
        print(f"👤 Roles: {decoded.get('roles')}")
        print(f"🆔 App ID: {decoded.get('appid')}")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Error decoding token: {e}")
    
    # ... rest of your code
```

This will show you what token the backend is using!

---

## 🔍 Understanding .default Scope

### What Happens When You Use `.default`:

```
Frontend Request:
  scopes: ['https://api.fabric.microsoft.com/.default']
       ↓
Azure AD checks:
  "What permissions does this app have for api.fabric.microsoft.com?"
       ↓
Azure AD finds (in your app registration):
  - All the Power BI Service permissions you added
  - (Power BI Service and Fabric API are related)
       ↓
Azure AD creates token:
  {
    "aud": "https://api.fabric.microsoft.com",
    "scp": "all the permissions you configured",
    ...
  }
       ↓
Token sent to backend:
  ✅ Correct audience for Fabric AI Skill!
  ✅ All necessary scopes included!
```

---

## 📊 Comparison

| Approach | Token Audience | Works with AI Skill? | Why? |
|----------|----------------|---------------------|------|
| `.default` ✅ | `api.fabric.microsoft.com` | ✅ YES | Correct audience |
| Power BI specific ❌ | `analysis.windows.net/powerbi/api` | ❌ NO | Wrong audience |
| Fabric specific | `api.fabric.microsoft.com` | ✅ Maybe | Depends on exact scopes |

---

## 🎯 Expected Behavior After Fix

### Login Flow:
```
1. Click Login
2. Graph popup (if needed)
3. Fabric token acquired (silent or popup)
4. Token audience: api.fabric.microsoft.com ✅
5. Backend login success
6. Ready to query
```

### Query Flow:
```
1. Send query: "total plan count"
2. Frontend → Backend with session cookie
3. Backend → Gets token from session
4. Backend → Calls Fabric AI Skill with token
5. Fabric AI Skill → Validates token audience ✅
6. Fabric AI Skill → Checks token scopes ✅
7. Fabric AI Skill → Processes query
8. Response → "The total plan count is 42"
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows: `Audience (aud): https://api.fabric.microsoft.com`
2. ✅ Console shows: `Token has scopes` or `Token has roles`
3. ✅ Query returns: `{"success": true, "response": "The total plan count is 42"}`
4. ✅ NO 403 error
5. ✅ NO "Token does not have required scopes" message

---

## 🚨 If This Doesn't Work

### Then the issue is NOT in the frontend!

**Possible backend issues:**

1. **Backend using wrong token**
   - Maybe using Graph token instead of Fabric token?
   - Check: `request.session.get("access_token")`

2. **Backend calling wrong Fabric API endpoint**
   - Check: Is the URL correct?
   - Check: Is the AI Skill ID correct?

3. **AI Skill permissions**
   - The user needs access to the AI Skill in Fabric workspace
   - Check Fabric portal workspace permissions

4. **Token not passed correctly**
   - Check: `Authorization: Bearer {token}` header
   - Check: Token is not expired

---

## 🔧 Quick Checklist

- [ ] Reverted scopes to `.default` ✅ (Done by me)
- [ ] Clear browser cache completely
- [ ] Clear IndexedDB (MSAL cache)
- [ ] Rebuild/restart dev server
- [ ] Login again
- [ ] Check console for token audience
- [ ] Verify audience is `api.fabric.microsoft.com`
- [ ] Test query
- [ ] Check response (should be 200 OK with data)

---

## 📚 Files Updated

- ✅ `src/environments/environment.ts`
- ✅ `src/environments/environment.prod.ts`
- ✅ Both now use: `fabric: ['https://api.fabric.microsoft.com/.default']`

---

**Clear cache → Login → Check token audience → Test query!** 🚀

**If audience is correct but still 403 → The problem is in the backend!**
