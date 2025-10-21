# 🔍 AI MCQ Solver Extension - Debugging Guide

## 📋 How to Debug "Chrome APIs not available or context invalidated"

### **Step 1: Load the Extension**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder
4. Check for any errors in the extension details

### **Step 2: Open Developer Tools**
1. Open any webpage (e.g., `test-popup-prefill.html`)
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Look for the initial log: `🚀 AI MCQ Solver Content Script loaded`

### **Step 3: Check Initial Status**
Look for this log in the console:
```
🚀 AI MCQ Solver Content Script loaded
[Content Script Initial Load] Chrome API Debug: {
  chromeExists: true/false,
  chromeObject: [object Object],
  runtimeExists: true/false,
  runtimeId: "extension-id-here",
  sendMessageExists: true/false,
  lastError: null,
  contextInvalidated: false,
  isChromeExtension: true/false,
  userAgent: "Mozilla/5.0...",
  location: "https://example.com",
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

### **Step 4: Test Text Selection**
1. Select some text on the webpage
2. Look for these logs:
   - `🖱️ Text selected: [your selected text]`
   - `safeSendMessage called with: {action: "selectedText", text: "...", url: "..."}`

### **Step 5: Check Error Conditions**

#### **If you see: `❌ Chrome APIs not available - isChromeExtension is false`**
**Possible causes:**
- Extension not properly loaded
- Content script injection failed
- Chrome APIs not available on this page

**Debug info to check:**
```javascript
chromeExists: false  // ← Chrome object not available
runtimeExists: false // ← Runtime API not available
sendMessageExists: false // ← SendMessage function not available
```

#### **If you see: `❌ Context previously invalidated - contextInvalidated is true`**
**Possible causes:**
- Extension was reloaded while content script was running
- Previous message send failed
- Runtime context was lost

#### **If you see: `❌ Extension context invalidated, skipping message`**
**Possible causes:**
- `chrome.runtime.id` is undefined
- `chrome.runtime.lastError` exists
- Runtime context became invalid

### **Step 6: Check Background Script**
1. Go to `chrome://extensions/`
2. Click on your extension
3. Click "Inspect views: background page"
4. Look for these logs:
   - `AI MCQ Solver extension installed`
   - `📨 Background received message: {...}`

### **Step 7: Test Double-Click Context Menu**
1. Double-click on text (10+ characters)
2. Look for these logs:
   - `🖱️ Double-click detected on text: [text]`
   - `🖱️ Creating context menu for text: [text]`
   - `🖱️ Context menu clicked for text: [text]`

## 🎯 Common Issues and Solutions

### **Issue 1: `chromeExists: false`**
**Solution:**
- Reload the extension
- Check if extension is enabled
- Verify manifest.json is correct

### **Issue 2: `runtimeExists: false`**
**Solution:**
- Check extension permissions
- Verify manifest has required permissions
- Try on different website

### **Issue 3: `sendMessageExists: false`**
**Solution:**
- Check if background script is running
- Verify service worker is active
- Check for JavaScript errors

### **Issue 4: `contextInvalidated: true`**
**Solution:**
- Refresh the webpage
- Reload the extension
- Check for extension errors

## 📊 Log Patterns to Look For

### **✅ Successful Flow:**
```
🚀 AI MCQ Solver Content Script loaded
[Content Script Initial Load] Chrome API Debug: {chromeExists: true, runtimeExists: true, ...}
🖱️ Text selected: [text]
safeSendMessage called with: {action: "selectedText", ...}
✅ All checks passed, attempting to send message
📨 Background received message: {action: "selectedText", ...}
📝 Processing selectedText action
✅ Selected text stored successfully: [text]...
```

### **❌ Failed Flow:**
```
🚀 AI MCQ Solver Content Script loaded
[Content Script Initial Load] Chrome API Debug: {chromeExists: false, ...}
🖱️ Text selected: [text]
safeSendMessage called with: {action: "selectedText", ...}
❌ Chrome APIs not available - isChromeExtension is false
[safeSendMessage - Chrome APIs not available] Chrome API Debug: {...}
```

## 🔧 Quick Fixes

### **1. Reload Extension:**
- Go to `chrome://extensions/`
- Click reload button on your extension

### **2. Refresh Page:**
- Press `F5` or `Ctrl+R`

### **3. Check Permissions:**
- Go to `chrome://extensions/`
- Click on your extension
- Check "Site access" permissions

### **4. Test Different Website:**
- Try on `https://example.com`
- Try on `https://google.com`
- Try on local files

## 📝 What to Report

When reporting issues, include:
1. **Console logs** from the debugging output
2. **Extension status** (enabled/disabled, errors)
3. **Website URL** where you're testing
4. **Browser version** and OS
5. **Steps to reproduce** the issue

## 🎯 Expected Behavior

- ✅ Content script loads with `chromeExists: true`
- ✅ Text selection triggers `safeSendMessage`
- ✅ Background script receives and processes messages
- ✅ Double-click shows context menu
- ✅ Popup opens with pre-filled text
