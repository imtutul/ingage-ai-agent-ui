# 🔍 Backend Token Debugging Script

## The Issue

Still getting 403 even with correct frontend scopes. This means **the backend might be using the wrong token**.

---

## 🔧 Add This Debug Code to Your Backend

### Step 1: Add Token Decoder Function

Add this to your `main.py` (or wherever your FastAPI routes are):

```python
import jwt
import json
from datetime import datetime

def debug_token(token: str, label: str = "TOKEN"):
    """
    Decode and print token details without verification.
    This helps identify what token is being used.
    """
    if not token:
        print(f"❌ {label}: No token provided!")
        return None
    
    try:
        # Decode without verification (just to inspect)
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        print("=" * 80)
        print(f"🔍 {label} DEBUG")
        print("=" * 80)
        print(f"📍 Audience (aud):     {decoded.get('aud')}")
        print(f"🔑 Scopes (scp):       {decoded.get('scp', 'N/A')}")
        print(f"👤 Roles (roles):      {decoded.get('roles', 'N/A')}")
        print(f"🆔 App ID (appid):     {decoded.get('appid', 'N/A')}")
        print(f"👤 User (upn):         {decoded.get('upn', decoded.get('preferred_username', 'N/A'))}")
        print(f"🏢 Tenant ID (tid):    {decoded.get('tid', 'N/A')}")
        print(f"⏰ Issued At (iat):    {datetime.fromtimestamp(decoded.get('iat', 0))}")
        print(f"⏰ Expires At (exp):   {datetime.fromtimestamp(decoded.get('exp', 0))}")
        print(f"⏰ Not Before (nbf):   {datetime.fromtimestamp(decoded.get('nbf', 0))}")
        print("=" * 80)
        
        # Check if token is expired
        exp = decoded.get('exp', 0)
        if exp and datetime.now().timestamp() > exp:
            print("⚠️  WARNING: Token is EXPIRED!")
        
        # Check audience
        aud = decoded.get('aud', '')
        if 'fabric' in aud or 'api.fabric.microsoft.com' in aud:
            print("✅ Token audience looks correct for Fabric API")
        elif 'powerbi' in aud or 'analysis.windows.net' in aud:
            print("✅ Token audience is for Power BI Service (should work with Fabric)")
        elif 'graph' in aud:
            print("❌ WARNING: This is a GRAPH token, not Fabric/Power BI!")
        else:
            print(f"⚠️  WARNING: Unknown audience: {aud}")
        
        # Check scopes
        scp = decoded.get('scp', '')
        roles = decoded.get('roles', [])
        if not scp and not roles:
            print("❌ WARNING: Token has NO scopes or roles!")
        else:
            print(f"✅ Token has permissions")
        
        print("=" * 80)
        print("\n")
        
        return decoded
        
    except jwt.DecodeError as e:
        print(f"❌ Error decoding {label}: {e}")
        print(f"Token preview: {token[:50]}...")
        return None
    except Exception as e:
        print(f"❌ Unexpected error decoding {label}: {e}")
        return None
```

---

### Step 2: Add Debug to Client Login Endpoint

Update your `/auth/client-login` endpoint:

```python
@app.post("/auth/client-login")
async def client_login(
    request: Request,
    token_data: dict = Body(...)
):
    """
    Client-side authentication: Receives Fabric token from frontend
    """
    try:
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token provided")
        
        # 🔍 DEBUG: Check what token we received from frontend
        print("\n" + "🔷" * 40)
        print("📥 RECEIVED TOKEN FROM FRONTEND")
        print("🔷" * 40)
        decoded = debug_token(access_token, "FRONTEND TOKEN")
        
        # Store token in session
        request.session["access_token"] = access_token
        request.session["authenticated"] = True
        
        # Get user info from token
        if decoded:
            request.session["user"] = {
                "email": decoded.get("upn") or decoded.get("preferred_username") or decoded.get("email"),
                "name": decoded.get("name", "User"),
                "tenant_id": decoded.get("tid")
            }
        
        print("✅ Token stored in session")
        print("🔷" * 40 + "\n")
        
        return {
            "success": True,
            "message": "Authentication successful",
            "user": request.session.get("user")
        }
        
    except Exception as e:
        print(f"❌ Client login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

### Step 3: Add Debug to Query Endpoint

Update your `/query` endpoint:

```python
@app.post("/query")
async def query(
    request: Request,
    query_data: dict = Body(...)
):
    """
    Execute query against Fabric AI Skill
    """
    try:
        # Check authentication
        if not request.session.get("authenticated"):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Get token from session
        access_token = request.session.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=401, detail="No access token in session")
        
        # 🔍 DEBUG: Check token before calling Fabric API
        print("\n" + "🟢" * 40)
        print("📤 TOKEN BEING SENT TO FABRIC API")
        print("🟢" * 40)
        decoded = debug_token(access_token, "FABRIC API TOKEN")
        
        query_text = query_data.get("query")
        print(f"📝 Query: {query_text}")
        print("🟢" * 40 + "\n")
        
        # Call Fabric AI Skill
        # ... your existing code to call Fabric API ...
        
        # Make the API call
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Your Fabric API call here
        # response = requests.post(FABRIC_API_URL, headers=headers, json=payload)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🧪 What to Look For

After adding this debugging, when you:
1. Login
2. Send query

You should see output like:

### Good Output (Working):
```
📥 RECEIVED TOKEN FROM FRONTEND
================================================================================
📍 Audience (aud):     https://api.fabric.microsoft.com
🔑 Scopes (scp):       Tenant.Read.All Tenant.ReadWrite.All Workspace.Read.All ...
👤 Roles (roles):      N/A
🆔 App ID (appid):     3503e363-86d6-4b02-807d-489886873632
⏰ Expires At (exp):   [future time]
✅ Token audience looks correct for Fabric API
✅ Token has permissions
================================================================================

📤 TOKEN BEING SENT TO FABRIC API
[Same token details]
```

### Bad Output (Wrong Token):
```
📥 RECEIVED TOKEN FROM FRONTEND
================================================================================
📍 Audience (aud):     00000003-0000-0000-c000-000000000000
❌ WARNING: This is a GRAPH token, not Fabric/Power BI!
❌ WARNING: Token has NO scopes or roles!
================================================================================
```

---

## 🎯 Possible Issues to Find

### Issue 1: Frontend Sends Graph Token Instead of Fabric Token

**Symptom:** Token audience is Microsoft Graph

**Fix:** Frontend `fabric-auth-v3-client.service.ts` is sending wrong token

---

### Issue 2: Backend Stores Wrong Token

**Symptom:** Token at login is correct, but token at query is different

**Fix:** Session management issue

---

### Issue 3: Token Has Wrong Audience

**Symptom:** Token audience is `analysis.windows.net/powerbi/api` but Fabric expects `api.fabric.microsoft.com`

**Fix:** Frontend scope configuration (but we already fixed this!)

---

### Issue 4: Token Has No Scopes

**Symptom:** `Scopes (scp): N/A` and `Roles (roles): N/A`

**Fix:** Azure AD permissions not granted properly

---

## 📋 Quick Debugging Checklist

After adding debug code:

1. [ ] Restart backend server
2. [ ] Clear frontend cache
3. [ ] Login again
4. [ ] Check backend console for "RECEIVED TOKEN FROM FRONTEND"
5. [ ] Note the audience and scopes
6. [ ] Send a query
7. [ ] Check backend console for "TOKEN BEING SENT TO FABRIC API"
8. [ ] Compare the two tokens (should be same!)
9. [ ] Share the output with me

---

## 🚀 Quick Deploy

```bash
# 1. Add the debug code to your backend main.py
# 2. Install jwt package if not already:
pip install pyjwt

# 3. Restart backend
# Stop current process (Ctrl+C)
python main.py
# or
uvicorn main:app --reload
```

---

## 📊 Expected vs Actual

### Expected Token (What Should Work):
```json
{
  "aud": "https://api.fabric.microsoft.com",
  "scp": "Tenant.Read.All Workspace.Read.All ...",
  "appid": "3503e363-86d6-4b02-807d-489886873632",
  "upn": "shahriar@insightinhealth.com"
}
```

### If You See This (Wrong Token):
```json
{
  "aud": "00000003-0000-0000-c000-000000000000",  ← Graph API
  "scp": "User.Read",
  "appid": "3503e363-86d6-4b02-807d-489886873632"
}
```

**This means frontend is sending Graph token instead of Fabric token!**

---

## 🔍 Next Steps Based on Output

### If Token Audience is Correct (`api.fabric.microsoft.com`):
→ Problem is with Fabric API permissions or AI Skill access
→ Check user has permission to AI Skill in Fabric workspace

### If Token Audience is Graph (`00000003-...`):
→ Frontend is sending wrong token
→ Check `fabric-auth-v3-client.service.ts` - sending Graph token instead of Fabric

### If Token Has No Scopes:
→ Azure AD permissions not configured
→ Re-check Azure Portal API permissions

### If Token is Expired:
→ Token refresh issue
→ Frontend needs to refresh token before sending

---

**Add the debug code, test, and share the console output!** 🚀
