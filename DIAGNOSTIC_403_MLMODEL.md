# 🔍 URGENT: Token Scope Diagnostic

## 🚨 Current Problem

You're still getting:
```json
{
  "success": true,
  "response": "Error: Error code: 403 - {
    'errorCode': 'UnknownError',
    'message': 'Internal error AuthorizationFailedException.The token does not have any of the required scopes.',
    'resourceType': 'MLModel'
  }"
}
```

**Key clue:** `'resourceType': 'MLModel'` - This is a **Fabric AI Skill** resource!

---

## 🎯 Root Cause Analysis

### Issue: Wrong API Audience

Your Fabric AI Skill uses the **NEW Fabric API**, not the Power BI Service API!

**What's happening:**
1. Frontend requests token for: `https://analysis.windows.net/powerbi/api` ❌
2. Backend calls Fabric AI Skill API
3. Fabric AI Skill expects token for: `https://api.fabric.microsoft.com` ✅
4. Token audience mismatch → 403 error

---

## ✅ SOLUTION: Use .default Scope with Correct Resource

The `.default` scope actually WORKS when you target the correct resource!

### What `.default` Does:

When you request:
```typescript
scopes: ['https://api.fabric.microsoft.com/.default']
```

Azure AD will:
1. Look at your app's configured permissions in Azure Portal
2. Grant ALL permissions you've configured for that resource
3. Include them in the token

**This is EXACTLY what you need!**

---

## 🔧 Fix: Revert to .default with Fabric API

### Step 1: Update Environment Files

Change scopes from Power BI Service back to Fabric API with `.default`:

```typescript
// environment.ts & environment.prod.ts
apiScopes: {
  graph: ['User.Read'],
  fabric: ['https://api.fabric.microsoft.com/.default']  // Back to this!
}
```

### Step 2: Ensure Azure Portal Has Fabric Permissions

Your Azure Portal should have permissions for **Microsoft Fabric** (not just Power BI Service).

**Check Azure Portal:**
1. App registrations → Your app → API permissions
2. Look for: **"Microsoft Fabric"** or **"Power BI Service"**
3. If you only have Power BI Service, that might work too (they're related)

---

## 🎯 Why This Will Work

### The .default Scope Pattern:

```
Resource URL + /.default = All configured permissions for that resource
```

**Example:**
- Azure AD sees: `https://api.fabric.microsoft.com/.default`
- Azure AD looks up: What permissions does this app have for Fabric API?
- Azure AD finds: All the Power BI Service permissions you configured
- Azure AD includes: All those permissions in the token
- Token audience: `https://api.fabric.microsoft.com` ✅
- Token scopes: All your configured permissions ✅

---

## 🔍 Why Specific Scopes Failed

When you used:
```typescript
fabric: [
  'https://analysis.windows.net/powerbi/api/Workspace.Read.All',
  // ... etc
]
```

**Problem:**
- Token audience: `https://analysis.windows.net/powerbi/api`
- But Fabric AI Skill expects: `https://api.fabric.microsoft.com`
- Audience mismatch → 403 error

---

## 🚀 Quick Fix Script

Run this to revert the scopes:

### For environment.ts:
```typescript
apiScopes: {
  graph: ['User.Read'],
  fabric: ['https://api.fabric.microsoft.com/.default']
}
```

### For environment.prod.ts:
```typescript
apiScopes: {
  graph: ['User.Read'],
  fabric: ['https://api.fabric.microsoft.com/.default']
}
```

---

## 🧪 Testing After Fix

### Step 1: Clear Cache
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 2: Login Again

Watch console for:
```
✅ Fabric token acquired
🔍 Token Details:
  📍 Audience (aud): https://api.fabric.microsoft.com  ← MUST be Fabric, not Power BI!
  🔑 Scopes (scp): [whatever permissions you have]
```

### Step 3: Test Query

Expected:
```json
{
  "success": true,
  "response": "The total plan count is 42",  ← Real data!
  "query": "total plan count"
}
```

---

## 🎯 Alternative: Check What Token Backend Receives

Let's verify what token the backend is actually using.

### Add Debug Logging to Backend

In your backend code (Python), add this:

```python
import jwt
import json

def debug_token(token: str):
    """Debug: Decode and print token details"""
    try:
        # Decode without verification (just to see contents)
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        print("=" * 60)
        print("🔍 TOKEN DEBUG")
        print("=" * 60)
        print(f"📍 Audience (aud): {decoded.get('aud')}")
        print(f"🔑 Scopes (scp): {decoded.get('scp')}")
        print(f"👤 Roles: {decoded.get('roles')}")
        print(f"🆔 App ID: {decoded.get('appid')}")
        print(f"⏰ Expires: {decoded.get('exp')}")
        print(f"🏢 Tenant: {decoded.get('tid')}")
        print("=" * 60)
        print(f"Full payload:\n{json.dumps(decoded, indent=2)}")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Error decoding token: {e}")

# In your query endpoint:
@app.post("/query")
async def query(request: Request, query: str = Body(...)):
    token = request.session.get("access_token")
    
    # DEBUG: Print token details
    debug_token(token)
    
    # ... rest of your code
```

This will show you:
- What audience the token has
- What scopes it contains
- Whether it's the right token

---

## 📊 Decision Matrix

| Scenario | Frontend Scope | Token Audience | Works with Fabric AI? |
|----------|----------------|----------------|----------------------|
| Current ❌ | `analysis.windows.net/powerbi/api/*` | Power BI API | ❌ No - Wrong audience |
| Correct ✅ | `api.fabric.microsoft.com/.default` | Fabric API | ✅ Yes - Correct audience |
| Alternative | `api.fabric.microsoft.com/Item.Execute.All` | Fabric API | ✅ Maybe - Need right scope |

---

## 🔑 Key Insight

The error message `'resourceType': 'MLModel'` tells us this is a **Fabric AI Skill** (ML Model).

**Fabric AI Skills require:**
- Token audience: `https://api.fabric.microsoft.com`
- Scopes: Permissions that cover AI Skill / ML Model execution

**Power BI Service API is different:**
- Token audience: `https://analysis.windows.net/powerbi/api`
- Scopes: Power BI specific (Workspace, Dataset, etc.)

**They're related but different resource audiences!**

---

## ✅ Action Plan

1. **Revert scopes** to `https://api.fabric.microsoft.com/.default`
2. **Clear cache** (critical!)
3. **Login again**
4. **Verify token audience** in console (should be `api.fabric.microsoft.com`)
5. **Test query**

If still fails:
6. **Add backend debugging** to see what token backend receives
7. **Check if token has correct audience**
8. **Verify backend is using the right token for Fabric API calls**

---

## 🚨 Most Likely Issue

Your backend might be receiving the correct token BUT the Fabric API endpoint you're calling needs **specific permissions**.

**Check backend code:**
```python
# Is it calling the right Fabric API endpoint?
# Does the AI Skill URL match what's in the code?
# Is the token being passed correctly to Fabric API?
```

---

**Let me revert the scopes now!** 🚀
