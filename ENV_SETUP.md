# Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# 1. Groq API (Priority 1)
GROQ_API_KEY=your_groq_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# 2. FreeLLM API (Priority 2 - No key required)
FREE_LLM_API_URL=https://apifreellm.com/api/chat
VITE_FREE_LLM_API_URL=https://apifreellm.com/api/chat

# 3. OpenRouter API (Priority 3)
OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# 4. Gemini API (Priority 4)
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 5. HuggingFace API (Priority 5)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# 6. OpenAI API (Priority 6)
OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## API Key Sources:
- **Groq**: https://console.groq.com
- **OpenRouter**: https://openrouter.ai
- **Gemini**: https://makersuite.google.com/app/apikey
- **HuggingFace**: https://huggingface.co/settings/tokens
- **OpenAI**: https://platform.openai.com/api-keys
- **FreeLLM**: No key required


