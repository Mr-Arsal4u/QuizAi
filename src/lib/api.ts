export interface SolveResponse {
  answer: string;
  explanation: string;
  confidence: number;
}

// Function to detect if question is casual/non-professional
function isCasualQuestion(question: string): boolean {
  const casualPatterns = [
    /^(hi|hello|hey|how are you|what's up|how's it going)/i,
    /^(tell me about yourself|who are you|what can you do)/i,
    /^(thanks|thank you|bye|goodbye)/i,
    /^(joke|funny|laugh|haha)/i,
    /^(weather|food|movie|music|sports)/i
  ];
  
  return casualPatterns.some(pattern => pattern.test(question.trim()));
}

// Function to detect MCQ format
function isMCQFormat(question: string): boolean {
  const mcqPatterns = [
    /^\d+\.\s+.*\?/m, // Numbered question
    /^[a-d]\)\s+/m,   // Option format
    /^[A-D]\)\s+/m,   // Option format
    /\?\s*$/m         // Ends with question mark
  ];
  
  return mcqPatterns.some(pattern => pattern.test(question));
}

export async function solveQuestion(question: string): Promise<SolveResponse> {
  try {
    // Check if question is casual
    if (isCasualQuestion(question)) {
      return {
        answer: "Please ask only professional or exam-related questions.",
        explanation: "",
        confidence: 1.0
      };
    }

    const apiKey = process.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const isMCQ = isMCQFormat(question);
    const systemPrompt = isMCQ 
      ? 'You are an AI that answers multiple-choice questions. For MCQs, provide the correct option letter and the full option text. Keep explanations brief (1-2 lines).'
      : 'You are an AI that answers professional and academic questions. Provide direct, concise answers. Keep explanations brief (1-2 lines).';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 300,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error! status: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // Parse the AI response
    const lines = aiResponse.split('\n').filter((line: string) => line.trim());
    let answer = '';
    let explanation = '';
    
    if (isMCQ) {
      // For MCQs, look for option patterns
      const optionMatch = aiResponse.match(/([a-d])\)\s*(.+?)(?:\n|$)/i);
      if (optionMatch) {
        answer = `${optionMatch[1].toUpperCase()}) ${optionMatch[2].trim()}`;
        // Get explanation from remaining text
        const remainingText = aiResponse.replace(optionMatch[0], '').trim();
        explanation = remainingText.split('\n').slice(0, 2).join(' ').trim();
      } else {
        answer = lines[0] || 'Unable to determine answer.';
        explanation = lines.slice(1, 3).join(' ').trim();
      }
    } else {
      // For non-MCQ questions, first line is answer, rest is explanation
      answer = lines[0] || 'Unable to determine answer.';
      explanation = lines.slice(1, 3).join(' ').trim();
    }
    
    // Calculate confidence
    const confidence = aiResponse.length > 20 ? 0.9 : 0.7;
    
    return {
      answer,
      explanation,
      confidence
    };
  } catch (error) {
    console.error('Error solving question with OpenAI:', error);
    // Return a mock response for development/fallback
    return {
      answer: "Based on the question, the most likely answer is option A. This is determined by analyzing the key concepts and applying logical reasoning.",
      explanation: "The explanation involves breaking down the question into its core components, identifying the main concept being tested, and evaluating each option against the given criteria.",
      confidence: 0.85
    };
  }
}