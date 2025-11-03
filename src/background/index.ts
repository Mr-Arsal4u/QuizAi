// Background service worker for Chrome extension
// Check if Chrome APIs are available
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    // Create context menu
    chrome.contextMenus.create({
      id: 'ask-quizai',
      title: 'Ask QuizzKar',
      contexts: ['selection'],
      documentUrlPatterns: ['<all_urls>']
    });
  });

  // Handle messages between content script and popup
  chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    // Check for context invalidation
    if (chrome.runtime.lastError) {
      sendResponse({ error: 'Extension context invalidated' });
      return;
    }
  
  if (request.action === 'selectedText') {
    // Store the selected text for the popup to retrieve
    try {
      chrome.storage.local.set({
        selectedText: request.text,
        selectedUrl: sender.tab?.url,
        timestamp: Date.now()
      }).then(() => {
        if (chrome.runtime.lastError) {
          return;
        }
      }).catch(() => {
        // Silently handle errors
      });
    } catch (error) {
      // Silently handle errors
    }
  }

  if (request.action === 'openPopupWithText') {
    // Store the selected text and open popup
    try {
      chrome.storage.local.set({
        selectedText: request.text,
        selectedUrl: sender.tab?.url,
        timestamp: Date.now()
      }).then(() => {
        if (chrome.runtime.lastError) {
          return;
        }
        
        // Open the popup
        chrome.action.openPopup().catch(() => {
          // Fallback: send message to popup if it's already open
          chrome.runtime.sendMessage({
            action: 'selectedText',
            text: request.text,
            url: sender.tab?.url
          }).catch(() => {
            // Silently handle errors
          });
        });
        
        // Send response to content script
        sendResponse({ success: true, text: request.text });
      }).catch((error) => {
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });
    } catch (error) {
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getSelectedText') {
    // Retrieve stored selected text
    chrome.storage.local.get(['selectedText', 'selectedUrl', 'timestamp']).then((result) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: 'Extension context invalidated' });
        return;
      }
      sendResponse({
        text: result.selectedText || '',
        url: result.selectedUrl || '',
        timestamp: result.timestamp || 0
      });
    }).catch(() => {
      sendResponse({ text: '', url: '', timestamp: 0 });
    });
    return true; // Keep message channel open for async response
  }
  
    sendResponse({ success: true });
  });

  // Handle storage changes for theme
  chrome.storage.onChanged.addListener(() => {
    // Theme change handled silently
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'ask-quizai' && info.selectionText) {
      // Store the selected text and open popup
      chrome.storage.local.set({
        selectedText: info.selectionText,
        selectedUrl: tab?.url,
        timestamp: Date.now()
      }).then(() => {
        // Open the popup
        chrome.action.openPopup().catch(() => {
          // Fallback: send message to popup if it's already open
          chrome.runtime.sendMessage({
            action: 'selectedText',
            text: info.selectionText,
            url: tab?.url
          }).catch(() => {
            // Silently handle errors
          });
        });
      }).catch(() => {
        // Silently handle errors
      });
    }
  });

  // Initialize default settings
  chrome.runtime.onStartup.addListener(async () => {
    const result = await chrome.storage.local.get(['theme']);
    if (!result.theme) {
      await chrome.storage.local.set({ theme: 'light' });
    }
  });
}
