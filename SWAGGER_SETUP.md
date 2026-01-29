# Swagger Setup Guide

## ✅ Configuration Complete

The Swagger documentation is now properly configured with:

1. ✅ Bearer Auth (JWT) support
2. ✅ Companies API tag
3. ✅ All endpoints documented

## Access Swagger UI

After starting the server, access Swagger at:

**URL**: `http://localhost:5000/api`

## Steps to See Companies API

1. **Start the server**:

   ```bash
   pnpm start:dev
   ```

2. **Open Swagger UI**:
   - Navigate to: `http://localhost:5000/api`
   - You should see two tags:
     - `auth` - Authentication endpoints
     - `Companies` - Company management endpoints

3. **Test the API**:
   - Click on `Companies` tag to expand
   - Click on `POST /companies` to see the endpoint
   - Click "Try it out"
   - Add your JWT token using the "Authorize" button (lock icon at top)
   - Fill in the request body
   - Click "Execute"

## Authorization Setup

1. Click the **lock icon** 🔒 at the top right of Swagger UI
2. Enter your JWT token in the format: `Bearer YOUR_TOKEN` or just `YOUR_TOKEN`
3. Click "Authorize"
4. Click "Close"

Now all protected endpoints will include the token automatically.

## Troubleshooting

### API Not Showing in Swagger?

1. **Restart the server**:

   ```bash
   # Stop the server (Ctrl+C)
   pnpm start:dev
   ```

2. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache

3. **Check console for errors**:
   - Look for any build/startup errors
   - Verify all modules are imported correctly

4. **Verify Swagger path**:
   - Default: `http://localhost:5000/api`
   - Check `main.ts` for custom path

### Still Not Working?

Check:

- ✅ `CompaniesModule` is imported in `AppModule`
- ✅ Server is running on correct port
- ✅ No TypeScript compilation errors
- ✅ Swagger UI loads (even if empty)

## Expected Swagger UI Structure

```
AIMS ERP API
├── auth
│   ├── POST /auth/signup
│   ├── POST /auth/verify-email
│   ├── POST /auth/login
│   ├── POST /auth/resend-otp
│   ├── POST /auth/forgot-password
│   └── POST /auth/reset-password
└── Companies
    └── POST /companies  ← Should appear here!
```

## Quick Test

1. Start server: `pnpm start:dev`
2. Open: `http://localhost:5000/api`
3. Look for "Companies" tag
4. Expand to see `POST /companies`

If you still don't see it, check the server logs for any errors!
