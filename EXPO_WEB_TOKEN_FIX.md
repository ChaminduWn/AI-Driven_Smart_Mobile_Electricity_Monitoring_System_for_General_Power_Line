# Expo Web Token Storage Fix

## Problem You Were Experiencing

In Expo web browser, tokens were **not persisting** after login:

```
⚠️  No token found in storage     ← Token lost!
401 (Unauthorized)               ← Every request fails
No refresh token — user must log in again
```

## What I Fixed

### 1. **Created Reliable Storage Manager** ✅
- **File**: `src/utils/storage.js`
- **What it does**: 
  - Stores tokens in BOTH AsyncStorage AND localStorage (web backup)
  - Falls back to localStorage if AsyncStorage fails
  - Verifies tokens were actually stored after writing
  - Provides detailed debug logging

### 2. **Updated All Token Storage Code** ✅
- **AuthContext.js**: Now uses reliable storage
- **apiClient.js**: Token retrieval uses reliable storage
- **Token refresh**: Stores new tokens reliably

### 3. **Added Storage Verification** ✅
After login, the app now verifies:
```javascript
✓ Storage verification: tokens confirmed in storage
```

If you see this, tokens are properly stored!

---

## How to Test the Fix

### Step 1: Log In Again
1. Refresh the browser (Cmd+R or Ctrl+R)
2. Go to login screen
3. Enter your credentials
4. Look for these logs in console:
```
🔐 Attempting login with email: user@example.com
✓ Login response received: {...}
💾 Storing tokens and user data...
   ✓ Stored all items in AsyncStorage and localStorage
   ✓ Storage verification: tokens confirmed in storage
✓ Login successful!
```

### Step 2: Check Console Logs
Open browser DevTools console (F12 or Cmd+Option+I):
- **All green ✓**: Success! Continue to Step 3
- **Orange ⚠️**: Token might have issues
- **Red ❌**: Storage is failing

### Step 3: Try Fetching Bills
1. Navigate to Bills screen
2. You should see:
```
📥 Fetching bills...
📤 [GET] /bills
   ✓ Token attached (eyJhbGciOiJIUzI1Ni...)
✅ [200] GET /bills
✓ Bills fetched successfully: [...]
```

### Step 4: Use Debug Storage Screen (Optional)
To verify storage is working:
1. Add this route to your navigation:
```javascript
import DebugStorageScreen from '../screens/DebugStorageScreen';
// Then add to your navigator:
<Stack.Screen name="DebugStorage" component={DebugStorageScreen} />
```
2. Navigate to Debug Storage screen
3. Click "📥 Dump Storage" button
4. Check console for what was found

---

## Troubleshooting

### Issue: Still getting "No token found in storage"

**Step 1: Check browser console for errors**
```
❌ Token refresh failed: [error message]
```

If you see this error, the problem is clear. Report this error message.

**Step 2: Check browser DevTools → Application → Local Storage**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage" → "http://localhost:8082"
4. Look for keys: `accessToken`, `refreshToken`, `user`

If these are present:
- ✅ Tokens ARE being stored in localStorage
- The issue might be async timing

If these are missing:
- ❌ Storage is completely failing
- Try clearing cache and logging in again

**Step 3: Check browser DevTools → Application → Storage → Indexed DB**
AsyncStorage in Expo web uses IndexedDB:
1. Open DevTools → "Application" tab
2. Find "expo-storage" in IndexedDB
3. Look for the same keys there

**Step 4: Hard refresh the app**
1. Close DevTools
2. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear cache when prompted
4. Try logging in again

### Issue: Token is stored but still getting 401

**Check 1: Is token being attached to requests?**
Look for this in console:
```
📤 [GET] /bills
   ✓ Token attached (eyJhbGciOi...)
```

If you see `⚠️ No token found in storage`:
- Token is in storage but retrieval failed
- AsyncStorage issue specific to this app session

**Solution**: 
1. Clear all storage (see Debug Storage Screen)
2. Log in again
3. Immediately try to fetch bills before page reload

**Check 2: Backend receiving token?**
Backend logs should show:
```
✓ DEBUG: Found token in header (starts with eyJhbGci...)
```

If missing, token is NOT reaching backend:
- Browser network tab: Check request headers
- Look for: `Authorization: Bearer eyJhbGc...`

### Issue: Page reloads and loses tokens

Normal Expo web behavior - app state is cleared on refresh.

**Solution**: Tokens are stored in localStorage, so they should persist.

**Check**:
1. After page reload, check console for:
```
🔐 AuthContext initializing - checking for existing tokens...
   Tokens found: {token: true, user: true}
   ✓ Restoring session from storage
```

If tokens are being found and restored, everything is working! They just need to be reattached on each request (which happens automatically).

---

## Key Files Modified

| File | What Changed |
|------|--------------|
| `src/utils/storage.js` | NEW: Reliable storage wrapper |
| `src/contexts/AuthContext.js` | Use storage instead of AsyncStorage |
| `src/api/apiClient.js` | Use storage for token retrieval |
| `src/screens/DebugStorageScreen.js` | NEW:Debug tool for storage |

---

## Browser Storage Locations (for manual checking)

**localStorage** (most reliable in Expo web):
- DevTools → Application → Local Storage → http://localhost:8082
- Keys: `accessToken`, `refreshToken`, `user`

**IndexedDB** (AsyncStorage backend):
- DevTools → Application → IndexedDB → expo-storage
- Same keys as localStorage

**Check localStorage manually**:
```javascript
// Open browser console and run:
Object.keys(localStorage).filter(k => k.includes('token'))
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
```

---

## Next Steps

1. **Restart your app** (hard refresh the browser)
2. **Log in fresh**
3. **Watch console for green ✓ logs**
4. **Try accessing Bills screen**
5. **If still failing**, check the troubleshooting section or run Debug Storage Screen

---

## When to Report Issues

If after trying all these steps you still have problems, provide:

1. **Browser console output** (screenshot or full logs)
2. **DevTools Local Storage contents** (keys present/absent)
3. **Backend logs** (any error messages)
4. **Exact error message** you see in the alert

This information helps pinpoint exactly where the storage is failing!

