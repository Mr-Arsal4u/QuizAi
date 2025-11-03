// Content script for text selection detection
let selectedText = '';
let contextInvalidated = false; // Global flag to track context state

// Check if Chrome APIs are available and context is valid
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;


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
  if (!isChromeExtension) {
    return;
  }
  
  if (contextInvalidated) {
    return;
  }
  
  if (!isContextValid()) {
    return;
  }
  
  chrome.runtime.sendMessage(message).catch((error) => {
    // If we get a context invalidated error, mark context as invalid
    if (error.message && error.message.includes('Extension context invalidated')) {
      contextInvalidated = true;
    }
  });
}

// Listen for text selection
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    selectedText = selection.toString().trim();
    
    // Send selected text to background script with safe error handling
    safeSendMessage({
      action: 'selectedText',
      text: selectedText,
      url: window.location.href
    });
  }
});

// Listen for keyboard shortcuts (Ctrl/Cmd + A for select all)
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        selectedText = selection.toString().trim();
        
        // Send selected text with safe error handling
        safeSendMessage({
          action: 'selectedText',
          text: selectedText,
          url: window.location.href
        });
      }
    }, 100);
  }
});

// Listen for messages from popup
if (isChromeExtension) {
  chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    // Check context validity before processing
    if (!isContextValid()) {
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
    
    // Check if the selected text looks like an MCQ
    if (isMCQText(text)) {
      // Store the text for the context menu handler
      selectedText = text;
    }
  }
});
