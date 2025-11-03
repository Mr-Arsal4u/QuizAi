// Content script for text selection detection
let selectedText = '';
let contextInvalidated = false; // Global flag to track context state

// Check if Chrome APIs are available and context is valid
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

// Check if current domain contains "vulms" keyword
function isVulmsDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes('vulms');
}

// Only proceed if on a vulms domain - wrap everything in this check
(function initExtension() {
  if (!isVulmsDomain()) {
    // Exit early if not a vulms domain - extension will not run
    return;
  }

// ============================================
// Forcefully enable right-click context menu
// ============================================

(function enableRightClick() {
  // 1. Override preventDefault on Event prototype to allow contextmenu events
  const originalPreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function(this: Event) {
    // Allow contextmenu events to proceed - don't prevent them
    if (this.type === 'contextmenu') {
      return;
    }
    return originalPreventDefault.call(this);
  };

  // 2. Also override stopImmediatePropagation for contextmenu events
  const originalStopImmediatePropagation = Event.prototype.stopImmediatePropagation;
  Event.prototype.stopImmediatePropagation = function(this: Event) {
    // Allow contextmenu events to propagate normally
    if (this.type === 'contextmenu') {
      return;
    }
    return originalStopImmediatePropagation.call(this);
  };

  // 3. Intercept contextmenu events early to ensure they're not blocked
  // Capture phase listener runs before page's handlers
  document.addEventListener('contextmenu', (_e: MouseEvent) => {
    // Ensure the event can reach the browser's default handler
    // The preventDefault override above handles blocking
  }, true);
  
  window.addEventListener('contextmenu', (_e: MouseEvent) => {
    // Ensure window-level handlers don't block
  }, true);

  // 4. Remove oncontextmenu attributes from elements
  function removeOnContextMenuAttributes() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element: Element) => {
      if (element.hasAttribute('oncontextmenu')) {
        element.removeAttribute('oncontextmenu');
      }
    });
  }

  // 5. Override oncontextmenu properties on document and window
  Object.defineProperty(document, 'oncontextmenu', {
    get: () => null,
    set: () => {},
    configurable: true
  });

  Object.defineProperty(window, 'oncontextmenu', {
    get: () => null,
    set: () => {},
    configurable: true
  });

  // 6. Override common functions that disable right-click
  const disableFunctions = [
    'disableContextMenu',
    'disableRightClick',
    'blockContextMenu',
    'preventContextMenu'
  ];

  disableFunctions.forEach((funcName) => {
    try {
      (window as any)[funcName] = () => {};
      (document as any)[funcName] = () => {};
    } catch (e) {
      // Silently handle errors
    }
  });

  // 7. Remove inline oncontextmenu handlers
  function removeInlineHandlers() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script: HTMLScriptElement) => {
      if (script.textContent) {
        // Replace common patterns that disable context menu
        script.textContent = script.textContent
          .replace(/oncontextmenu\s*=\s*["']?return\s+false["']?/gi, '')
          .replace(/oncontextmenu\s*=\s*["']?event\.preventDefault\(\)["']?/gi, '')
          .replace(/\.oncontextmenu\s*=\s*function[^;]*/gi, '')
          .replace(/\.oncontextmenu\s*=\s*\(\)\s*=>\s*\{[^}]*\}/gi, '');
      }
    });
  }

  // 8. Use MutationObserver to watch for dynamically added blocking code
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Remove oncontextmenu attribute from newly added elements
          if (element.hasAttribute('oncontextmenu')) {
            element.removeAttribute('oncontextmenu');
          }
          
          // Check all descendants
          const descendants = element.querySelectorAll('*');
          descendants.forEach((descendant: Element) => {
            if (descendant.hasAttribute('oncontextmenu')) {
              descendant.removeAttribute('oncontextmenu');
            }
          });
        }
      });
    });
    
    // Re-remove handlers periodically
    removeOnContextMenuAttributes();
  });

  // Initialize: remove existing attributes and start observing
  removeOnContextMenuAttributes();
  removeInlineHandlers();

  // Start observing DOM changes
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['oncontextmenu']
  });

  // Also handle elements added before DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      removeOnContextMenuAttributes();
      removeInlineHandlers();
    });
  } else {
    removeOnContextMenuAttributes();
    removeInlineHandlers();
  }

  // Periodically check and remove blocking attributes (for dynamic content)
  setInterval(() => {
    removeOnContextMenuAttributes();
  }, 1000);
})();


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

// ============================================
// Floating QuizKar Button on Text Selection
// ============================================

(function createFloatingButton() {
  let buttonElement: HTMLElement | null = null;
  let hideTimeout: number | null = null;

  // Create the floating button element
  function createButton(): HTMLElement {
    if (buttonElement && document.body.contains(buttonElement)) {
      return buttonElement;
    }

    const button = document.createElement('div');
    button.id = 'quizkar-floating-button';
    button.innerHTML = 'QuizKar';
    button.style.cssText = `
      position: absolute;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      user-select: none;
      pointer-events: auto;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      white-space: nowrap;
      opacity: 0;
      transform: scale(0.9);
    `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Click handler
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      
      if (text) {
        // Send message to open popup with selected text
        safeSendMessage({
          action: 'openPopupWithText',
          text: text,
          url: window.location.href
        });
        
        // Hide button after click
        hideButton();
      }
    });

    document.body.appendChild(button);
    buttonElement = button;
    return button;
  }

  // Show button at selection position
  function showButton(_event: MouseEvent) {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) {
      hideButton();
      return;
    }

    const button = createButton();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position button near the selection (above or below based on available space)
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    const buttonHeight = 36; // Approximate button height
    const spacing = 8;
    
    // Try to position above selection, fallback to below if not enough space
    let top = rect.top + scrollY - buttonHeight - spacing;
    if (top < scrollY) {
      // Not enough space above, position below
      top = rect.bottom + scrollY + spacing;
    }
    
    const left = rect.left + scrollX + (rect.width / 2) - 40; // Center button on selection

    // Ensure button stays within viewport
    const viewportWidth = window.innerWidth;
    const finalLeft = Math.max(10, Math.min(left, viewportWidth - 90));

    button.style.left = `${finalLeft}px`;
    button.style.top = `${top}px`;
    button.style.display = 'block';

    // Animate in
    requestAnimationFrame(() => {
      button.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    });

    // Clear any existing hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  // Hide button
  function hideButton() {
    if (!buttonElement) return;

    buttonElement.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    buttonElement.style.opacity = '0';
    buttonElement.style.transform = 'scale(0.9)';

    hideTimeout = window.setTimeout(() => {
      if (buttonElement && buttonElement.style.opacity === '0') {
        buttonElement.style.display = 'none';
      }
    }, 150);
  }

  // Handle text selection (mouse release)
  document.addEventListener('mouseup', (e: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      selectedText = selection.toString().trim();
      
      // Send selected text to background script with safe error handling
      safeSendMessage({
        action: 'selectedText',
        text: selectedText,
        url: window.location.href
      });

      // Show floating button
      setTimeout(() => {
        showButton(e);
      }, 50); // Small delay to ensure selection is complete
    } else {
      // No selection, hide button
      hideButton();
    }
  });

  // Hide button when clicking elsewhere
  document.addEventListener('mousedown', (e: MouseEvent) => {
    if (buttonElement && !buttonElement.contains(e.target as Node)) {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        hideButton();
      }
    }
  });

  // Hide button on scroll
  let scrollTimeout: number | null = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = window.setTimeout(() => {
      hideButton();
    }, 150);
  }, true);

  // Hide button when selection is cleared
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) {
      hideButton();
    }
  });

  // Initialize button on page load (create it but keep it hidden)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const btn = createButton();
      btn.style.display = 'none';
    });
  } else {
    const btn = createButton();
    btn.style.display = 'none';
  }
})();

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

        // Show floating button for keyboard selection
        // Access the button show function from the closure
        setTimeout(() => {
          const button = document.getElementById('quizkar-floating-button') as HTMLElement;
          if (button) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
              const scrollY = window.pageYOffset || document.documentElement.scrollTop;
              
              const buttonHeight = 36;
              const spacing = 8;
              let top = rect.top + scrollY - buttonHeight - spacing;
              if (top < scrollY) {
                top = rect.bottom + scrollY + spacing;
              }
              
              const left = rect.left + scrollX + (rect.width / 2) - 40;
              const viewportWidth = window.innerWidth;
              const finalLeft = Math.max(10, Math.min(left, viewportWidth - 90));

              button.style.left = `${finalLeft}px`;
              button.style.top = `${top}px`;
              button.style.display = 'block';
              
              requestAnimationFrame(() => {
                button.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                button.style.opacity = '1';
                button.style.transform = 'scale(1)';
              });
            }
          }
        }, 150);
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

})(); // Close initExtension - all code above only runs on vulms domains
