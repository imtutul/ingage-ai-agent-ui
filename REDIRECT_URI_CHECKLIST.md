# ✅ Redirect URI Fix - Troubleshooting Checklist

## 🎯 Quick Verification

Before you go to Azure Portal, verify these:

### Your App Details:
```
✅ Client ID: 3503e363-86d6-4b02-807d-489886873632
✅ Tenant ID: 4d4eca3f-b031-47f1-8932-59112bf47e6b
✅ Local URL: http://localhost:4200
✅ Prod URL: https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
```

---

## 📝 Azure Portal Checklist

Go through this step by step:

### ☐ Step 1: Login to Azure
- [ ] Opened https://portal.azure.com
- [ ] Signed in successfully

### ☐ Step 2: Find App Registration
- [ ] Searched for: `3503e363-86d6-4b02-807d-489886873632`
- [ ] Found the app
- [ ] Clicked to open it

### ☐ Step 3: Open Authentication
- [ ] Clicked "Authentication" in left sidebar
- [ ] See "Platform configurations" section

### ☐ Step 4: Check Platform Type
- [ ] Platform is "Single-page application" (NOT "Web")
- [ ] If wrong type, delete and recreate as SPA

### ☐ Step 5: Add Redirect URIs
- [ ] Clicked "+ Add URI"
- [ ] Added: `http://localhost:4200`
- [ ] Added: `https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net`
- [ ] Both URIs are visible in the list

### ☐ Step 6: Save
- [ ] Scrolled to bottom
- [ ] Clicked "Save" button
- [ ] Saw success message

### ☐ Step 7: Wait
- [ ] Waited 1-2 minutes for propagation

### ☐ Step 8: Clear Cache
- [ ] Opened browser DevTools (F12)
- [ ] Opened Console tab
- [ ] Ran: `localStorage.clear()`
- [ ] Ran: `location.reload()`

### ☐ Step 9: Test
- [ ] Opened http://localhost:4200
- [ ] Clicked "Sign In with Microsoft"
- [ ] Popup opened successfully
- [ ] Authenticated successfully
- [ ] No more AADSTS500113 error

---

## 🔍 Common Issues

### Issue 1: Can't Find App in Azure Portal

**Try**:
1. Azure AD → App registrations
2. Click "All applications" tab (not just "Owned applications")
3. Search by Client ID: `3503e363-86d6-4b02-807d-489886873632`

### Issue 2: "Save" Button Grayed Out

**Solution**:
- Make sure you actually typed a URI
- Make sure URI format is valid (starts with http:// or https://)
- Try clicking elsewhere first, then "Save"

### Issue 3: URI Showing Wrong Platform

**If you see**:
```
Web
  Redirect URIs:
    http://localhost:4200
```

**This is WRONG!** Should be:
```
Single-page application
  Redirect URIs:
    http://localhost:4200
```

**Fix**:
1. Delete the Web platform redirect URI
2. Add it under "Single-page application" instead

### Issue 4: Still Getting Error After Adding

**Try**:
1. Wait 5 minutes (Azure can be slow)
2. Clear ALL browser data (not just cache)
3. Try incognito/private window
4. Verify URI matches EXACTLY (case-sensitive):
   - ✅ `http://localhost:4200`
   - ❌ `http://localhost:4200/`
   - ❌ `HTTP://localhost:4200`
   - ❌ `http://Localhost:4200`

---

## 🎯 Final Verification

After everything is done, you should see this in Azure AD:

```
App registration: [Your App Name]
  Client ID: 3503e363-86d6-4b02-807d-489886873632

Authentication:
  Platform configurations:
    
    📱 Single-page application
       Redirect URIs:
       • http://localhost:4200
       • https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
```

And this in your browser console:

```
🔐 FabricAuthService v3.0.0: Initialized (Client-Side Auth)
✅ MSAL initialized
🔑 Starting client-side login flow...
✅ MSAL cache cleared
🌐 MSAL popup will open...
🔑 Starting popup login...
✅ Login successful!
```

---

## 📞 Need Help?

### Error Code Reference:
- **AADSTS500113**: Redirect URI not registered → Add URI in Azure AD
- **AADSTS650052**: Incorrect platform type → Use "Single-page application"
- **AADSTS700016**: Client ID doesn't exist → Check Client ID is correct
- **AADSTS90002**: Tenant not found → Check Tenant ID is correct

### Microsoft Docs:
https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url

---

**Status**: Configuration Required  
**Time**: 2-3 minutes  
**Difficulty**: Easy  
**Next**: Add redirect URI in Azure Portal
