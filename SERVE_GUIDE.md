# 🚀 PCBxpress ERP - Local Development Guide

## ❌ The MIME Type Error

You're seeing this error because browsers can't properly serve static assets when opening HTML files directly with the `file://` protocol:

```
Refused to apply style from 'http://127.0.0.1:5500/assets/index-B-4hbJDj.css' because its MIME type ('text/html') is not a supported stylesheet MIME type
```

## ✅ Solutions

### Option 1: Use the Custom Node.js Server (Recommended)

We've created a simple Node.js server specifically for your project:

```bash
npm run serve:dist
```

This will:
- Start a local server on `http://localhost:8000`
- Properly serve all assets with correct MIME types
- Handle SPA routing correctly
- Automatically open your browser

### Option 2: Use Built-in Vite Preview

After building your project:

```bash
npm run build
npm run preview
```

This will serve your built files on `http://localhost:4173`

### Option 3: Use Python HTTP Server

```bash
npm run serve:python
# or
python -m http.server 8000
```

Then visit: `http://localhost:8000`

### Option 4: Use Node.js http-server

```bash
npm run serve:node
# or
npx http-server -p 8000
```

### Option 5: Use VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `dist/index.html`
3. Select "Open with Live Server"

### Option 6: Use the Interactive Guide

Open `serve-local.html` in your browser for an interactive guide with clickable buttons for all server options.

## 🔧 Why This Happens

When you open `index.html` directly with `file://`:
- The browser can't set proper HTTP headers
- CSS and JS files aren't served with correct MIME types
- Relative paths may not resolve correctly

When using a local server:
- Proper HTTP headers are set
- MIME types are correct
- All assets load properly
- SPA routing works correctly

## 📁 Project Structure

```
pcbxpgit/
├── dist/                    # Built files (what you serve)
│   ├── index.html          # Main HTML file
│   ├── assets/             # CSS, JS, and other assets
│   │   ├── index-krDXi8oG.js
│   │   ├── index-B-4hbJDj.css
│   │   └── ...
│   └── ...
├── serve-dist.js          # Custom Node.js server
├── serve-local.html       # Interactive guide
├── vite.config.js         # Updated with proper base path
└── package.json           # Added server scripts
```

## 🎯 Quick Start

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Serve the built files:**
   ```bash
   npm run serve:dist
   ```

3. **Open your browser:**
   Visit `http://localhost:8000`

That's it! Your application should now load without any MIME type errors.

## 🛠️ Troubleshooting

### If you still see errors:

1. **Clear your browser cache** - Old cached files might be causing issues
2. **Check the console** - Look for any remaining 404 errors
3. **Verify the dist folder** - Make sure all files were built correctly
4. **Try a different port** - Use `PORT=3000 npm run serve:dist` to change the port

### If assets are still not loading:

1. **Check file paths** - Ensure assets exist in the `dist/assets/` folder
2. **Verify server is running** - Check that your server is actually serving files
3. **Try a different server** - Use one of the alternative server options above

## 📞 Need Help?

If you're still experiencing issues, try:
1. Opening `serve-local.html` for interactive troubleshooting
2. Checking the browser developer tools console for specific errors
3. Verifying your build completed successfully with `npm run build`