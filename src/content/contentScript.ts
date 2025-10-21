// Content script for text selection detection
let selectedText = '';
let contextMenu: HTMLElement | null = null;
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
console.log('🚀 AI MCQ Solver Content Script loaded');
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
    
    // Add visual indicator
    addSelectionIndicator();
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
        
        // Add visual indicator
        addSelectionIndicator();
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

// Add visual indicator for selected text
function addSelectionIndicator() {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    // Remove existing indicators
    document.querySelectorAll('.ai-mcq-selection-indicator').forEach(el => el.remove());
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.className = 'ai-mcq-selection-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: ${rect.top - 40}px;
      left: ${rect.left}px;
      background: #2563eb;
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    indicator.textContent = 'AI MCQ Solver';
    
    document.body.appendChild(indicator);
    
    // Remove indicator after 2 seconds
    setTimeout(() => {
      indicator.remove();
    }, 2000);
  }
}

// Create context menu for double-click
function createContextMenu(x: number, y: number, text: string) {
  // Remove existing context menu
  if (contextMenu) {
    contextMenu.remove();
  }

  contextMenu = document.createElement('div');
  contextMenu.className = 'ai-mcq-context-menu';
  contextMenu.style.cssText = `
    position: fixed;
    top: ${y}px;
    left: ${x}px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    padding: 8px 0;
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const menuItem = document.createElement('div');
  menuItem.style.cssText = `
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.2s;
  `;
  
  menuItem.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
    </svg>
    Solve with AI MCQ Solver
  `;

  menuItem.addEventListener('mouseenter', () => {
    menuItem.style.backgroundColor = '#f3f4f6';
  });

  menuItem.addEventListener('mouseleave', () => {
    menuItem.style.backgroundColor = 'transparent';
  });

  menuItem.addEventListener('click', () => {
    console.log('🖱️ Context menu clicked for text:', text);
    // Send message to background to open popup with selected text
    safeSendMessage({
      action: 'openPopupWithText',
      text: text,
      url: window.location.href
    });
    contextMenu?.remove();
    contextMenu = null;
  });

  contextMenu.appendChild(menuItem);
  document.body.appendChild(contextMenu);

  // Remove context menu when clicking outside
  const removeMenu = (e: MouseEvent) => {
    if (!contextMenu?.contains(e.target as Node)) {
      contextMenu?.remove();
      contextMenu = null;
      document.removeEventListener('click', removeMenu);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', removeMenu);
  }, 100);
}

// Add double-click detection
document.addEventListener('dblclick', (event) => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const text = selection.toString().trim();
    console.log('🖱️ Double-click detected on text:', text);
    if (text.length > 10) { // Only show for meaningful text
      console.log('🖱️ Creating context menu for text:', text);
      createContextMenu(event.clientX, event.clientY, text);
    } else {
      console.log('🖱️ Text too short for context menu:', text.length, 'characters');
    }
  }
});
