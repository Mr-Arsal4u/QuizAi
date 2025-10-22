/**
 * Unified AI Service Layer
 * Chrome Extension: AI MCQ Solver
 * Supports 6 AI providers with automatic fallback
 */

// Load environment variables
import { config } from 'dotenv';
config();

// Response interfaces
export interface AIResponse {
  answer: string;
  explanation: string;
  source: string;
  timeTaken: number;
}

// Legacy interface for backward compatibility
export interface SolveResponse {
  answer: string;
  explanation: string;
  confidence: number;
}

// Environment variables loader
function getEnvVar(key: string): string {
  // Try Node.js environment first
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`VITE_${key}`] || '';
  }
  
  // Fallback to Vite environment (browser)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env?.[`VITE_${key}`] || '';
  }
  
  return '';
}

// API Keys from environment
const API_KEYS = {
  GROQ: getEnvVar('GROQ_API_KEY'),
  FREE_LLM_URL: getEnvVar('FREE_LLM_API_URL') || 'https://apifreellm.com/api/chat',
  OPENROUTER: getEnvVar('OPENROUTER_API_KEY'),
  GEMINI: getEnvVar('GEMINI_API_KEY'),
  HUGGINGFACE: getEnvVar('HUGGINGFACE_API_KEY'),
  OPENAI: getEnvVar('OPENAI_API_KEY')
};

// Timeout helper
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  );
  
  return Promise.race([promise, timeout]);
}

// Groq API
async function tryGroq(question: string): Promise<AIResponse | null> {
  if (!API_KEYS.GROQ) return null;
  
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.GROQ}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Provide clear, concise answers.' },
          { role: 'user', content: question }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    }), 10000);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) throw new Error('No content in response');
    
    return {
      answer: content.split('\n')[0] || content,
      explanation: content.split('\n').slice(1).join(' ').trim() || 'No additional explanation provided.',
      source: 'Groq',
      timeTaken: Date.now() - startTime
    };
  } catch (error) {
    console.warn('Groq failed:', error);
    return null;
  }
}

// FreeLLM API
async function tryFreeLLM(question: string): Promise<AIResponse | null> {
  console.log('🚀 Trying FreeLLM...');
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(fetch(API_KEYS.FREE_LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: question
      })
    }), 10000);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`FreeLLM failed: HTTP ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Parse response - try multiple response shapes
    let content = '';
    if (data?.message) {
      content = data.message;
    } else if (data?.response) {
      content = data.response;
    } else if (data?.output) {
      content = data.output;
    }
    
    if (!content || typeof content !== 'string') {
      throw new Error('No valid content in response');
    }
    
    const timeTaken = Date.now() - startTime;
    
    console.log(`✅ FreeLLM responded in ${timeTaken}ms`);
    
    return {
      answer: content.trim(),
      explanation: 'No additional explanation provided.',
      source: 'FreeLLM',
      timeTaken
    };
  } catch (error) {
    console.warn('FreeLLM failed:', error);
    return null;
  }
}

// OpenRouter API
async function tryOpenRouter(question: string): Promise<AIResponse | null> {
  if (!API_KEYS.OPENROUTER) return null;
  
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.OPENROUTER}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://quizai-extension.com',
        'X-Title': 'QuizAI Extension'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Provide clear, concise answers.' },
          { role: 'user', content: question }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    }), 10000);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) throw new Error('No content in response');
    
    return {
      answer: content.split('\n')[0] || content,
      explanation: content.split('\n').slice(1).join(' ').trim() || 'No additional explanation provided.',
      source: 'OpenRouter',
      timeTaken: Date.now() - startTime
    };
  } catch (error) {
    console.warn('OpenRouter failed:', error);
    return null;
  }
}

// Gemini API
async function tryGemini(question: string): Promise<AIResponse | null> {
  if (!API_KEYS.GEMINI) return null;
  
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEYS.GEMINI}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful AI assistant. Provide clear, concise answers.\n\nUser: ${question}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    }), 10000);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) throw new Error('No content in response');
    
    return {
      answer: content.split('\n')[0] || content,
      explanation: content.split('\n').slice(1).join(' ').trim() || 'No additional explanation provided.',
      source: 'Gemini',
      timeTaken: Date.now() - startTime
    };
  } catch (error) {
    console.warn('Gemini failed:', error);
    return null;
  }
}

// Hugging Face API
async function tryHuggingFace(question: string): Promise<AIResponse | null> {
  if (!API_KEYS.HUGGINGFACE) return null;
  
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.HUGGINGFACE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: question,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          do_sample: true
        }
      })
    }), 10000);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text || data[0]?.text : data?.generated_text || data?.text;
    
    if (!content) throw new Error('No content in response');
    
    return {
      answer: content.split('\n')[0] || content,
      explanation: content.split('\n').slice(1).join(' ').trim() || 'No additional explanation provided.',
      source: 'HuggingFace',
      timeTaken: Date.now() - startTime
    };
  } catch (error) {
    console.warn('HuggingFace failed:', error);
    return null;
  }
}

// OpenAI API
async function tryOpenAI(question: string): Promise<AIResponse | null> {
  if (!API_KEYS.OPENAI) return null;
  
  const startTime = Date.now();
  
  try {
    const response = await withTimeout(fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.OPENAI}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Provide clear, concise answers.' },
          { role: 'user', content: question }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    }), 10000);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) throw new Error('No content in response');
    
    return {
      answer: content.split('\n')[0] || content,
      explanation: content.split('\n').slice(1).join(' ').trim() || 'No additional explanation provided.',
      source: 'OpenAI',
      timeTaken: Date.now() - startTime
    };
  } catch (error) {
    console.warn('OpenAI failed:', error);
    return null;
  }
}

/**
 * Main function to solve questions with automatic fallback
 * Tries providers in order: FreeLLM → GROQ → OpenRouter → Gemini → HuggingFace → OpenAI
 */
export async function solveWithFallback(question: string): Promise<AIResponse> {
  console.log('🧠 Starting AI fallback system...');
  console.log('📝 Question:', question);

  const providers = [
    tryFreeLLM,
    tryGroq,
    tryOpenRouter,
    tryGemini,
    tryHuggingFace,
    tryOpenAI
  ];

  for (const provider of providers) {
    try {
      console.log(`🚀 Trying ${provider.name}...`);
      const response = await provider(question);
      
      if (response?.answer) {
        console.log(`✅ ${response.source} responded successfully in ${response.timeTaken}ms`);
        return response;
      }
    } catch (error) {
      console.warn(`❌ ${provider.name} failed:`, error);
    }
  }

  // All providers failed
  console.error('💥 All AI providers failed');
  return {
    answer: "Sorry, I couldn't generate a response right now.",
    explanation: "All AI providers are currently unavailable.",
    source: "none",
    timeTaken: 0
  };
}

/**
 * Legacy compatibility function
 * @deprecated Use solveWithFallback instead
 */
export async function solveQuestion(question: string): Promise<SolveResponse> {
  const result = await solveWithFallback(question);
  return {
    answer: result.answer,
    explanation: result.explanation,
    confidence: result.source === 'none' ? 0 : 0.9
  };
}

/**
 * Get API provider status
 */
export function getAPIStatus() {
  return {
    Groq: { available: !!API_KEYS.GROQ, requiresKey: true },
    FreeLLM: { available: true, requiresKey: false },
    OpenRouter: { available: !!API_KEYS.OPENROUTER, requiresKey: true },
    Gemini: { available: !!API_KEYS.GEMINI, requiresKey: true },
    HuggingFace: { available: !!API_KEYS.HUGGINGFACE, requiresKey: true },
    OpenAI: { available: !!API_KEYS.OPENAI, requiresKey: true }
  };
}

// Export individual API functions for testing
export { tryGroq, tryFreeLLM, tryOpenRouter, tryGemini, tryHuggingFace, tryOpenAI };