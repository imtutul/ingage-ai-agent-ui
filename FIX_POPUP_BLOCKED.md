# 🔧 Fix: popup_window_error - Popup Blocked

## 🚨 Error

```
❌ popup_window_error: Error opening popup window. 
This can happen if you are using IE or if popups are blocked in the browser.
```

## 🎯 Root Causes & Solutions

### Cause 1: Browser Popup Blocker ⚠️ (MOST LIKELY)

**Problem**: Your browser is blocking the authentication popup

**Solution A - Allow Popups (Quick Fix)**:

1. Look for the **popup blocked icon** in your browser's address bar
   - Chrome: Look for icon at right end of address bar
   - Edge: Look for icon at right end of address bar
   
2. Click the icon

3. Select **"Always allow popups from [your domain]"**

4. Refresh the page

5. Try "Sign In" again

**Solution B - Browser Settings**:

**Chrome/Edge**:
```
1. Click the three dots (⋮) → Settings
2. Search for "pop"
3. Click "Site Settings"
4. Click "Pop-ups and redirects"
5. Click "Add" under "Allowed to send pop-ups and use redirects"
6. Add: https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
7. Also add: https://login.microsoftonline.com
```

---

### Cause 2: Redirect URI Mismatch

**Problem**: Azure AD redirect URI doesn't match exactly

**What I Fixed**:

Added trailing slash to redirect URIs to ensure exact match:

```typescript
// ❌ Before (might not match):
redirectUri: 'https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net'

// ✅ After (with trailing slash):
redirectUri: 'https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/'
```

**Action Required**: 

Update your Azure AD app registration to include **both** URIs:

1. Go to Azure Portal
2. App registrations → Your app (3503e363-86d6-4b02-807d-489886873632)
3. Authentication
4. Single-page application → Redirect URIs
5. Add **BOTH**:
   ```
   https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
   https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/
   ```
6. Save

---

### Cause 3: HTTPS vs HTTP Mismatch

**Problem**: Mixed protocols

**Check**: Make sure you're accessing your site via HTTPS:
```
✅ https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
❌ http://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
```

---

### Cause 4: Browser Extensions Blocking Popups

**Problem**: Extensions like ad blockers block authentication popups

**Solution**:

1. Try in **Incognito/Private mode** (extensions disabled by default)
2. Or disable extensions temporarily:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Disable ad blockers, privacy extensions
4. Try login again

---

## 🔄 Alternative: Use Redirect Flow Instead of Popup

If popups keep getting blocked, we can switch to redirect-based auth:

### Update MSAL Service:

```typescript
// Instead of loginPopup(), use loginRedirect()
loginRedirect(): Observable<void> {
  console.log('🔑 Starting redirect login...');
  
  const loginRequest = {
    scopes: environment.apiScopes.graph,
    redirectUri: window.location.origin
  };

  return from(this.msalInstance.loginRedirect(loginRequest)).pipe(
    tap(() => console.log('🔄 Redirecting to Microsoft login...'))
  );
}

// Handle redirect response on page load
async handleRedirectPromise(): Promise<AuthenticationResult | null> {
  return await this.msalInstance.handleRedirectPromise();
}
```

**Pros**: No popup blocker issues  
**Cons**: Page redirects away and back

---

## 🧪 Troubleshooting Steps

### Step 1: Check Popup Blocker

**Test if popups are blocked**:

```javascript
// In browser console (F12):
const popup = window.open('', '_blank');
if (!popup || popup.closed || typeof popup.closed == 'undefined') {
    console.log('❌ Popups are BLOCKED');
} else {
    console.log('✅ Popups are ALLOWED');
    popup.close();
}
```

### Step 2: Check Console for Exact Error

Look for:
```
BrowserAuthError: popup_window_error
```

### Step 3: Check Network Tab

1. Open DevTools → Network
2. Click "Sign In"
3. Look for requests to `login.microsoftonline.com`
4. Check if they're being blocked

### Step 4: Verify Azure AD Configuration

**In Azure Portal**:

```
App registration
    ↓
Authentication
    ↓
Platform configurations → Single-page application
    ↓
Redirect URIs should include:
    ✅ https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net
    ✅ https://ingage-agent-ui-aqcxg2hhdxa2gcfr.canadacentral-01.azurewebsites.net/
```

---

## 📋 Quick Fix Checklist

1. **Allow Popups**:
   - [ ] Clicked popup blocker icon in address bar
   - [ ] Selected "Always allow popups"
   - [ ] Refreshed page

2. **Check Azure AD**:
   - [ ] Redirect URI matches exactly (including trailing slash)
   - [ ] Both versions added (with and without slash)
   - [ ] Platform is "Single-page application"

3. **Clear Cache**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

4. **Try Different Browser**:
   - [ ] Tested in Chrome
   - [ ] Tested in Edge
   - [ ] Tested in Incognito/Private mode

5. **Disable Extensions**:
   - [ ] Disabled ad blockers
   - [ ] Disabled privacy extensions
   - [ ] Tested again

---

## 🎯 Expected Behavior After Fix

### Before:
```
Click "Sign In"
    ↓
❌ Popup blocked
❌ Error: popup_window_error
```

### After:
```
Click "Sign In"
    ↓
✅ Popup opens
    ↓
Microsoft login page loads
    ↓
User authenticates
    ↓
Popup closes
    ↓
✅ Login successful
```

---

## 🚀 Rebuild and Deploy

After fixing the trailing slash, rebuild:

```bash
ng build --configuration production
```

Then deploy to Azure.

---

## 📊 Changes Made

| File | Change | Reason |
|------|--------|--------|
| environment.ts | Added trailing `/` to redirectUri | Exact match with Azure AD |
| environment.prod.ts | Added trailing `/` to redirectUri | Exact match with Azure AD |

---

## 💡 Pro Tips

### Tip 1: Test Locally First

Switch to local environment:
```typescript
// In environment.ts, temporarily:
redirectUri: 'http://localhost:4200'
```

Test locally to isolate if it's a production-specific issue.

### Tip 2: User Communication

Add a helper message in your UI:

```html
<div class="popup-blocked-notice" *ngIf="popupBlocked">
  ⚠️ Popup blocked! Please allow popups for this site and try again.
  <button (click)="showPopupHelp()">How to allow popups</button>
</div>
```

### Tip 3: Detect Popup Blocker

```typescript
async checkPopupBlocker(): Promise<boolean> {
  const popup = window.open('', '_blank', 'width=1,height=1');
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return true; // Blocked
  }
  popup.close();
  return false; // Not blocked
}
```

---

**Status**: ✅ Trailing slash added to redirect URIs  
**Next**: Allow popups in browser + update Azure AD config  
**Testing**: Try login after allowing popups
