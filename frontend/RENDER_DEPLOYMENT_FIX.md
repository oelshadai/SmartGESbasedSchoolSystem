# Render Deployment Fix Guide

## Issue
```
npm error path /opt/render/project/src/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## Root Cause
Render is looking for package.json in the wrong directory (`/src/` instead of root).

## Solutions

### Solution 1: Fix Render Dashboard Settings
1. Go to your Render dashboard
2. Select your frontend service
3. Go to Settings
4. Check these settings:
   - **Root Directory**: Should be empty or `.` (not `src`)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Solution 2: Update render.yaml (Already Done)
The render.yaml file has been updated with:
```yaml
services:
  - type: static
    name: school-report-frontend
    env: node
    rootDir: .
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: NODE_VERSION
        value: 18.17.0
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Solution 3: Manual Deploy Settings
If render.yaml doesn't work, manually set in Render dashboard:
- **Environment**: Node
- **Root Directory**: ` ` (empty) or `.`
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18.17.0

### Solution 4: Alternative Build Command
Try this build command if the above doesn't work:
```bash
cd $RENDER_GIT_COMMIT && npm ci && npm run build
```

## Verification Steps
1. Check that package.json exists in repository root
2. Verify build command works locally: `npm ci && npm run build`
3. Ensure dist folder is created after build
4. Check that index.html exists in dist folder

## Common Issues
- **Root Directory set to 'src'**: Should be empty or '.'
- **Wrong Build Command**: Should include npm install step
- **Wrong Publish Directory**: Should be 'dist' not 'build'
- **Node Version**: Use 18.17.0 for compatibility

## Test Locally
```bash
# Test the exact build process
npm ci
npm run build
ls -la dist/  # Should show built files including index.html
```

## If Still Failing
1. Check Render build logs for exact error
2. Verify repository structure matches expected layout
3. Try deploying from a fresh git commit
4. Contact Render support with build logs