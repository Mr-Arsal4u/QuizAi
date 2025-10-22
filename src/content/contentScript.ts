// Content script for text selection detection
let selectedText = '';
let contextInvalidated = false; // Global flag to track context state

// Check if Chrome APIs are available and context is valid
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

// Debug function to log Chrome API status
function debugChromeAPIs(context: string) {
  console.log(`[${context}] Chrome API Debug:`, {
    chromeExists: typeof chrome !== 'undefined',
    chromeObject: chrome,
    runtimeExists: !!chrome?.runtime,
    runtimeId: chrome?.runtime?.id,
    sendMessageExists: !!chrome?.runtime?.sendMessage,
    lastError: chrome?.runtime?.lastError,
    contextInvalidated: contextInvalidated,
    isChromeExtension: isChromeExtension,
    userAgent: navigator.userAgent,
    location: window.location.href,
    timestamp: new Date().toISOString()
  });
}

// Initial logging when content script loads
console.log('🚀 QuizzKar Content Script loaded');
debugChromeAPIs('Content Script Initial Load');

// Function to check if extension context is still valid
function isContextValid(): boolean {
  if (contextInvalidated) {
    return false;
  }
  
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      contextInvalidated = true;
      return false;
    }
    // Check if there's a lastError
    if (chrome.runtime.lastError) {
      contextInvalidated = true;
      return false;
    }
    return true;
  } catch (error) {
    contextInvalidated = true;
    return false;
  }
}

// Function to safely send message with context validation
function safeSendMessage(message: any): void {
  console.log('safeSendMessage called with:', message);
  
  if (!isChromeExtension) {
    console.log('❌ Chrome APIs not available - isChromeExtension is false');
    debugChromeAPIs('safeSendMessage - Chrome APIs not available');
    return;
  }
  
  if (contextInvalidated) {
    console.log('❌ Context previously invalidated - contextInvalidated is true');
    debugChromeAPIs('safeSendMessage - Context invalidated');
    return;
  }
  
  if (!isContextValid()) {
    console.log('❌ Extension context invalidated, skipping message');
    debugChromeAPIs('safeSendMessage - Context validation failed');
    return;
  }
  
  console.log('✅ All checks passed, attempting to send message');
  chrome.runtime.sendMessage(message).catch((error) => {
    console.log('❌ Message send failed:', error);
    debugChromeAPIs('safeSendMessage - Message send failed');
    
    // If we get a context invalidated error, mark context as invalid
    if (error.message && error.message.includes('Extension context invalidated')) {
      contextInvalidated = true;
      console.log('❌ Extension context invalidated, disabling Chrome API calls');
    }
  });
}

// Listen for text selection
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    selectedText = selection.toString().trim();
    console.log('🖱️ Text selected:', selectedText);
    
    // Send selected text to background script with safe error handling
    safeSendMessage({
      action: 'selectedText',
      text: selectedText,
      url: window.location.href
    });
    
    // Store selected text for potential context menu
    console.log('📝 Text selected for potential MCQ analysis');
  }
});

// Listen for keyboard shortcuts (Ctrl/Cmd + A for select all)
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    console.log('⌨️ Ctrl+A detected');
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        selectedText = selection.toString().trim();
        console.log('⌨️ Text selected via Ctrl+A:', selectedText);
        
        // Send selected text with safe error handling
        safeSendMessage({
          action: 'selectedText',
          text: selectedText,
          url: window.location.href
        });
        
        // Store selected text for potential context menu
        console.log('📝 Text selected via Ctrl+A for potential MCQ analysis');
      }
    }, 100);
  }
});

// Listen for messages from popup
if (isChromeExtension) {
  chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    // Check context validity before processing
    if (!isContextValid()) {
      console.log('Extension context invalidated, ignoring message');
      return;
    }
    
    if (request.action === 'getCurrentSelection') {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      sendResponse({ text });
    }
  });
}

// Function to detect if selected text looks like an MCQ
function isMCQText(text: string): boolean {
  const trimmedText = text.trim().toLowerCase();
  
  // Check for common MCQ patterns
  const mcqPatterns = [
    /which of the following/i,
    /what is the correct/i,
    /choose the best/i,
    /select the/i,
    /a\)|b\)|c\)|d\)/i,
    /\(a\)|\(b\)|\(c\)|\(d\)/i,
    /option a|option b|option c|option d/i,
    /question \d+/i,
    /q\d+/i,
    /multiple choice/i,
    /mcq/i
  ];
  
  return mcqPatterns.some(pattern => pattern.test(trimmedText)) || 
         trimmedText.length > 50; // Also consider longer text selections
}

// Listen for right-click context menu
document.addEventListener('contextmenu', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const text = selection.toString().trim();
    console.log('🖱️ Right-click detected on selected text:', text);
    
    // Check if the selected text looks like an MCQ
    if (isMCQText(text)) {
      console.log('✅ Selected text appears to be MCQ content');
      // Store the text for the context menu handler
      selectedText = text;
    } else {
      console.log('❌ Selected text does not appear to be MCQ content');
    }
  }
});
