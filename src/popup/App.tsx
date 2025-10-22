import React, { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Loader } from '../components/Loader'
import { AnswerBox } from '../components/AnswerBox'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent } from '../components/ui/card'
import { solveWithFallback, AIResponse } from '../lib/api'
import { Send, Copy, Check } from 'lucide-react'

const App: React.FC = () => {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contextInvalidated, setContextInvalidated] = useState(false)

  // Check if Chrome APIs are available
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  // Function to check if extension context is still valid
  const isContextValid = (): boolean => {
    if (contextInvalidated) {
      return false;
    }
    
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
        setContextInvalidated(true);
        return false;
      }
      // Check if there's a lastError
      if (chrome.runtime.lastError) {
        setContextInvalidated(true);
        return false;
      }
      return true;
    } catch (error) {
      setContextInvalidated(true);
      return false;
    }
  };

  // Function to safely use Chrome storage
  const safeStorageGet = (keys: string | string[], callback: (result: { [key: string]: any }) => void) => {
    if (!isChromeExtension || contextInvalidated || !isContextValid()) {
      console.log('Chrome storage not available or context invalidated');
      return;
    }
    
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.log('Extension context invalidated during storage get');
        setContextInvalidated(true);
        return;
      }
      callback(result);
    });
  };

  // Function to safely use Chrome storage set
  const safeStorageSet = (items: { [key: string]: any }, callback?: () => void) => {
    if (!isChromeExtension || contextInvalidated || !isContextValid()) {
      console.log('Chrome storage not available or context invalidated');
      return;
    }
    
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        console.log('Extension context invalidated during storage set');
        setContextInvalidated(true);
        return;
      }
      if (callback) callback();
    });
  };

  // Load theme from storage
  useEffect(() => {
    safeStorageGet(['theme'], (result) => {
      setIsDarkMode(result.theme === 'dark')
      document.documentElement.classList.toggle('dark', result.theme === 'dark')
    });
  }, [isChromeExtension])

  // Load selected text from storage when popup opens
  useEffect(() => {
    const loadSelectedText = () => {
      safeStorageGet(['selectedText', 'selectedUrl', 'timestamp'], (result) => {
        if (result.selectedText && result.timestamp) {
          // Only use text if it's recent (within last 30 seconds)
          const isRecent = Date.now() - result.timestamp < 30000
          if (isRecent) {
            setQuestion(result.selectedText)
          }
        }
      });
    };

    // Load immediately
    loadSelectedText();

    // Also try after a short delay in case storage is still being written
    const timeoutId = setTimeout(loadSelectedText, 100);

    return () => clearTimeout(timeoutId);
  }, [isChromeExtension])

  // Listen for messages from content script
  useEffect(() => {
    if (!isChromeExtension || !isContextValid()) return;
    
    const handleMessage = (message: any) => {
      if (chrome.runtime.lastError) {
        console.log('Extension context invalidated during message handling');
        return;
      }
      if (message.action === 'selectedText' && message.text) {
        setQuestion(message.text)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [isChromeExtension])

  // Listen for storage changes to handle text updates
  useEffect(() => {
    if (!isChromeExtension || !isContextValid()) return;

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
      if (namespace === 'local' && changes.selectedText) {
        const newText = changes.selectedText.newValue;
        const timestamp = changes.timestamp?.newValue;
        
        if (newText && timestamp) {
          // Only use text if it's recent (within last 30 seconds)
          const isRecent = Date.now() - timestamp < 30000;
          if (isRecent) {
            setQuestion(newText);
          }
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [isChromeExtension])

  const handleToggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled)
    document.documentElement.classList.toggle('dark', enabled)
    safeStorageSet({ theme: enabled ? 'dark' : 'light' })
  }

  const handleSolve = async () => {
    if (!question.trim()) return

    setIsLoading(true)
    setResponse(null)

    try {
      const result = await solveWithFallback(question)
      setResponse(result)
    } catch (error) {
      console.error('Error solving question:', error)
      setResponse({
        answer: 'Sorry, there was an error processing your question. Please try again.',
        explanation: 'The AI service is currently unavailable. Please check your connection and try again.',
        source: 'error',
        timeTaken: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (response) {
      const text = `Answer: ${response.answer}\n\nExplanation: ${response.explanation}`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClear = () => {
    setQuestion('')
    setResponse(null)
  }

  return (
    <div className="w-full min-h-[500px] bg-background">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={handleToggleDarkMode} />
      
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Question
                </label>
                <Textarea
                  placeholder="Paste your multiple choice question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSolve} 
                  disabled={!question.trim() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader size="sm" text="" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Solve with AI
                    </>
                  )}
                </Button>
                
                {response && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopy}
                    title="Copy answer"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              {question && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                  className="w-full"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="p-4">
              <Loader text="Analyzing your question..." />
            </CardContent>
          </Card>
        )}

        {response && !isLoading && (
          <AnswerBox response={response} />
        )}

        {!question && !response && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <div className="text-4xl">🧠</div>
                <h3 className="font-medium text-foreground">AI MCQ Solver</h3>
                <p className="text-sm text-muted-foreground">
                  {isChromeExtension 
                    ? "Select text on any webpage or paste your question above to get instant AI-powered solutions."
                    : "Paste your question above to get instant AI-powered solutions."
                  }
                </p>
                {!isChromeExtension && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Note: Text selection from webpages requires Chrome extension APIs
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
