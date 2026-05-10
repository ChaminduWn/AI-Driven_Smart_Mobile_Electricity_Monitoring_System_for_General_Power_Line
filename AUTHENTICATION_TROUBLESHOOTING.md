# Authentication & Token Flow Troubleshooting Guide

## Problem Summary
You were getting `401 Unauthorized` errors when trying to fetch bills after login. The errors indicated:
```
No 'Access-Control-Allow-Origin' header 
Failed to load resource: the server responded with a status of 401 (Unauthorized)
No refresh token — user must log in again
```

## Root Causes Identified & Fixed

### 1. **CORS Issue** ✅ FIXED
**Problem**: Backend wasn't allowing requests from `localhost:8082`

**Solution**: Added port 8082 to CORS allowed origins in `backend/member1-energy-analysis/src/main.py`:
```python
allow_origins=[
    ...
    "http://localhost:8082",      # ← ADDED
    "http://127.0.0.1:8082",      # ← ADDED
    ...
]
```

### 2. **Token Storage & Retrieval** ✅ ENHANCED
**Problem**: Could not debug if tokens were being stored properly

**Solution**: Enhanced logging in:
- `src/api/apiClient.js` - Request interceptor now logs token attachment with secure preview
- `src/contexts/AuthContext.js` - Login now logs token storage and state updates
- `src/screens/LoginScreen.js` - Added detailed login flow logging

### 3. **Error Reporting** ✅ ENHANCED
**Problem**: Could not see specific error details from backend

**Solution**: Enhanced error handling in:
- `src/screens/BillsScreen.js` - Now logs HTTP status codes and error messages
- `src/api/apiClient.js` - Response interceptor shows success/failure with timestamps
- `src/screens/LoginScreen.js` - Displays backend error details in console

### 4. **Backend Token Validation** ✅ ENHANCED
**Problem**: Could not debug if backend was rejecting valid tokens

**Solution**: Enhanced logging in `backend/member1-energy-analysis/src/api/routes/auth.py`:
```python
logger.info(f"✓ DEBUG: Found token in header (starts with {token[:20]}...)")
logger.info(f"✓ DEBUG: Decoded sub={user_id}, type={token_type}")
logger.info(f"✓ DEBUG: User {user.email} (id={user_id}) authenticated successfully")
```

---

## How to Debug Token Flow

### Step 1: Check Browser/Console Logs

After logging in, you should see logs like:

**Frontend (Mobile App)**:
```
🔐 Attempting login with email: user@example.com
✓ Login response received: {...}
Token extracted: {hasAccessToken: true, hasRefreshToken: true, hasUserData: true}
💾 Storing tokens and user data...
✓ Login successful!

✓ AuthContext.login called
   Storing accessToken: eyJhbGciOiJIUzI1NiIs...
   Storing refreshToken: eyJhbGciOiJIUzI1NiIs...
   ✓ Tokens stored successfully
   ✓ State updated
```

**Subsequent Requests**:
```
📤 [GET] /bills
   ✓ Token attached (eyJhbGciOiJIUzI1NiIs...)
✅ [200] GET /bills
   Retrieved 5 bills
```

### Step 2: Check Backend Logs

Start backend with:
```bash
cd backend/member1-energy-analysis
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

You should see logs like:
```
✓ DEBUG: Found token in header (starts with eyJhbGciOiJIUzI1NiIs...)
🔐 DEBUG: Validating token: eyJhbGciOiJIUzI1NiIs...
✓ DEBUG: Decoded sub=1, type=access
✓ DEBUG: User user@example.com (id=1) authenticated successfully
```

---

## Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters email/password in LoginScreen                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. authAPI.login() posts to /auth/login                     │
│    Backend validates credentials and returns:               │
│    { access_token, refresh_token, user }                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LoginScreen extracts tokens and calls login()            │
│    Logs: ✓ Login response received...                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. AuthContext.login() stores in AsyncStorage               │
│    Logs: 💾 Storing tokens and user data...                 │
│    Sets: isAuthenticated = true                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User navigates to Bills screen                           │
│    BillsScreen calls billsAPI.getAll()                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. apiClient request interceptor:                           │
│    - Reads accessToken from AsyncStorage                    │
│    - Adds Authorization: Bearer {token}                     │
│    - Logs: 📤 [GET] /bills                                  │
│    - Logs: ✓ Token attached (eyJhbGci...)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend receives request with Authorization header       │
│    get_user_from_token() decodes JWT                        │
│    Logs: ✓ DEBUG: Found token in header...                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────┴──────────────┐
        │                             │
    ✓ Valid               ✗ Invalid (401)
        │                             │
        ▼                             ▼
    ┌─────────┐              ┌────────────────┐
    │ Return  │              │ 1. Check logs  │
    │ Bills   │              │ 2. Refresh    │
    │ Data    │              │    token      │
    └─────────┘              │ 3. If fails,  │
                             │    re-login   │
                             └────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: "No 'Access-Control-Allow-Origin' header"
**Cause**: Backend not configured for frontend port

**Check**: 
```
Backend main.py line ~60-80 has allow_origins list
Verify "http://localhost:8082" is present
```

**Fix**: Restart backend after updating CORS

---

### Issue 2: "No refresh token — user must log in again"
**Cause**: refresh_token not being saved in AsyncStorage

**Check console logs for**:
```
Token extracted: {hasAccessToken: true, hasRefreshToken: true, ...}
💾 Storing tokens and user data...
✓ Tokens stored successfully
```

**If missing**: 
1. Check login response includes `refresh_token`
2. Verify AsyncStorage.multiSet() succeeded
3. Check backend login endpoint returns both tokens

---

### Issue 3: 401 on subsequent requests after successful login
**Cause**: Token expired or not being sent

**Check console logs for**:
```
✓ Token attached (eyJhbGciOiJIUzI1NiIs...)
```

**If missing**:
1. Token not in AsyncStorage (lost or never stored)
2. Request interceptor not running
3. AsyncStorage.getItem() failing

**Fix**:
```javascript
// Add this debug check in apiClient.js
const token = await AsyncStorage.getItem('accessToken');
console.log('Token from storage:', token ? 'FOUND' : 'NOT FOUND');
```

---

### Issue 4: Backend returns 401 despite token in header
**Cause**: User not found in database or is inactive

**Check backend logs for**:
```
❌ DEBUG: User not found with id=1
❌ DEBUG: User 1 is not active
```

**Fix**:
1. Verify user exists in database: `SELECT * FROM users WHERE id=1;`
2. Check `is_active` is `true`
3. Query database after registration to verify user was created

---

## Testing Checklist

- [ ] CORS error gone (no "blocked by CORS policy")
- [ ] Login succeeds and shows success message
- [ ] Console shows: `✓ Login successful!`
- [ ] Console shows: `✓ Tokens stored successfully`
- [ ] Bills screen loads without 401 error
- [ ] Console shows: `✓ Bills fetched successfully`
- [ ] Backend logs show: `✓ DEBUG: User ... authenticated successfully`
- [ ] Can upload a bill successfully
- [ ] All subsequent API calls work (analysis, recommendations, etc.)

---

## Next Steps if Still Failing

1. **Get More Detailed Logs**:
   ```bash
   # Mobile app
   Run app and check console output
   Look for all lines starting with ❌ 📥 📤 ✓

   # Backend
   Check terminal where uvicorn is running
   Look for all lines starting with ❌ ✓ 🔐
   ```

2. **Database Check**:
   ```sql
   -- Verify user exists and is active
   SELECT id, email, is_active, created_at FROM users 
   WHERE email = 'your@email.com';

   -- Should return 1 row with is_active = true
   ```

3. **Manual Token Test**:
   ```bash
   # After getting a token from login, test manually
   curl -X GET http://localhost:8000/api/v1/bills \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   
   # Should return 200 with bills data
   # If 401, token is invalid
   ```

4. **Reset Everything**:
   - Clear AsyncStorage: Delete app or use dev tools
   - Clear browser cache
   - Restart backend server
   - Try login again from scratch

---

## Key Files Modified

| File | Changes |
|------|---------|
| `backend/member1-energy-analysis/src/main.py` | Added localhost:8082 to CORS origins |
| `mobile-apps/member1-mobile/EnergyAnalysisApp/src/api/apiClient.js` | Enhanced logging in interceptors |
| `mobile-apps/member1-mobile/EnergyAnalysisApp/src/contexts/AuthContext.js` | Added token storage logging |
| `mobile-apps/member1-mobile/EnergyAnalysisApp/src/screens/LoginScreen.js` | Added login flow logging |
| `mobile-apps/member1-mobile/EnergyAnalysisApp/src/screens/BillsScreen.js` | Enhanced error reporting |
| `backend/member1-energy-analysis/src/api/routes/auth.py` | Enhanced auth validation logging |

