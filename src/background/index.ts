// Background service worker for Chrome extension
// Check if Chrome APIs are available
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('AI MCQ Solver extension installed');
  });

  // Handle messages between content script and popup
  chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log('📨 Background received message:', {
      action: request.action,
      text: request.text?.substring(0, 50) + (request.text?.length > 50 ? '...' : ''),
      url: request.url,
      senderTab: sender.tab?.id,
      timestamp: new Date().toISOString()
    });
    
    // Check for context invalidation
    if (chrome.runtime.lastError) {
      console.log('❌ Background: Extension context invalidated');
      sendResponse({ error: 'Extension context invalidated' });
      return;
    }
  
  if (request.action === 'selectedText') {
    console.log('📝 Processing selectedText action');
    // Store the selected text for the popup to retrieve
    try {
      chrome.storage.local.set({
        selectedText: request.text,
        selectedUrl: sender.tab?.url,
        timestamp: Date.now()
      }).then(() => {
        if (chrome.runtime.lastError) {
          console.log('❌ Background: Extension context invalidated during storage');
          return;
        }
        console.log('✅ Selected text stored successfully:', request.text.substring(0, 50) + '...');
      }).catch((error) => {
        console.error('❌ Error storing selected text:', error);
      });
    } catch (error) {
      console.error('❌ Error in selectedText handler:', error);
    }
  }

  if (request.action === 'openPopupWithText') {
    console.log('🚀 Processing openPopupWithText action');
    // Store the selected text and open popup
    try {
      chrome.storage.local.set({
        selectedText: request.text,
        selectedUrl: sender.tab?.url,
        timestamp: Date.now()
      }).then(() => {
        if (chrome.runtime.lastError) {
          console.log('❌ Background: Extension context invalidated during storage');
          return;
        }
        console.log('✅ Selected text stored for popup:', request.text.substring(0, 50) + '...');
        
        // Open the popup
        console.log('🎯 Attempting to open popup');
        chrome.action.openPopup().catch((error) => {
          console.log('❌ Could not open popup automatically:', error);
          // Fallback: send message to popup if it's already open
          console.log('🔄 Trying fallback message to popup');
          chrome.runtime.sendMessage({
            action: 'selectedText',
            text: request.text,
            url: sender.tab?.url
          }).catch(() => {
            console.log('❌ Popup not available for message');
          });
        });
        
        // Send response to content script
        sendResponse({ success: true, text: request.text });
      }).catch((error) => {
        console.error('❌ Error storing selected text for popup:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });
    } catch (error) {
      console.error('❌ Error in openPopupWithText handler:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getSelectedText') {
    // Retrieve stored selected text
    chrome.storage.local.get(['selectedText', 'selectedUrl', 'timestamp']).then((result) => {
      if (chrome.runtime.lastError) {
        console.log('Background: Extension context invalidated during retrieval');
        sendResponse({ error: 'Extension context invalidated' });
        return;
      }
      sendResponse({
        text: result.selectedText || '',
        url: result.selectedUrl || '',
        timestamp: result.timestamp || 0
      });
    }).catch((error) => {
      console.error('Error retrieving selected text:', error);
      sendResponse({ text: '', url: '', timestamp: 0 });
    });
    return true; // Keep message channel open for async response
  }
  
    sendResponse({ success: true });
  });

  // Handle storage changes for theme
  chrome.storage.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
    if (namespace === 'local' && changes.theme) {
      console.log('Theme changed to:', changes.theme.newValue);
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
