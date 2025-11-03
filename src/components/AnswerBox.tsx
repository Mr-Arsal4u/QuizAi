import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle, Info, TrendingUp } from 'lucide-react'
import { AIResponse } from '@/lib/api'

interface AnswerBoxProps {
  response: AIResponse
  isLoading?: boolean
}

// Function to clean answer text by removing option prefixes
function cleanAnswerText(text: string): string {
  let cleaned = text.trim()
  
  // Remove patterns like "A)", "B)", "C)", "D)", "(A)", "(B)", etc. at the start
  cleaned = cleaned.replace(/^[A-E]\)\s*/i, '')
  cleaned = cleaned.replace(/^\([A-E]\)\s*/i, '')
  
  // Remove patterns like "Option A", "Option B", etc. at the start
  cleaned = cleaned.replace(/^option\s+[A-E]\s*:?\s*/i, '')
  
  // Remove "The Answer to question is **" prefix
  cleaned = cleaned.replace(/^the\s+answer\s+to\s+question\s+is\s+\*\*/i, '')
  cleaned = cleaned.replace(/\*\*/g, '')
  
  // NOTE: We keep "detail:" format intact as it's handled separately in formatAnswerWithHighlight
  // Don't remove detail/reason patterns here - let the formatting function handle them
  
  // Clean up any remaining extra whitespace
  cleaned = cleaned.trim()
  
  return cleaned
}

// Function to identify and format the most certain answer
function formatAnswerWithHighlight(text: string): React.ReactNode {
  const cleaned = cleanAnswerText(text)
  
  // If text is empty after cleaning, return original (shouldn't happen, but safety check)
  if (!cleaned) {
    return text
  }
  
  // Pattern 1 (PRIORITY): Format like "Paris detail: The official capital of France."
  // Show main keyword alone (underlined) and detail below (not underlined)
  const detailPattern = /^(.+?)\s+detail:\s*(.+)$/i
  if (detailPattern.test(cleaned)) {
    const match = cleaned.match(detailPattern)
    if (match) {
      const mainKeyword = match[1].trim()
      const detail = `detail: ${match[2].trim()}`
      return (
        <div className="flex flex-col space-y-1">
          <span className="underline decoration-2 decoration-primary text-lg font-bold">{mainKeyword}</span>
          <span className="text-sm font-normal opacity-75">{detail}</span>
        </div>
      )
    }
  }
  
  // Pattern 2: If the cleaned text looks like it starts with an answer option letter followed by content
  // e.g., "A: Paris" or "B Paris"
  const optionMatch = cleaned.match(/^([A-E])[:\s]+\s*(.+)$/i)
  if (optionMatch) {
    const answer = optionMatch[2].trim()
    return <span className="underline decoration-2 decoration-primary">{answer}</span>
  }
  
  // Pattern 3: If the text contains answer indicators like "is X", "answer is X", "correct answer is X"
  // Underline just the answer part
  const answerIsMatch = cleaned.match(/^(?:the\s+)?(?:correct\s+)?(?:answer\s+)?(?:is|are)\s+(.+)$/i)
  if (answerIsMatch) {
    const answerPart = answerIsMatch[1].trim()
    // Remove trailing punctuation that might not be part of the answer
    const cleanAnswer = answerPart.replace(/[.,;:]+$/, '')
    return <span className="underline decoration-2 decoration-primary">{cleanAnswer}</span>
  }
  
  // Pattern 4: If text contains quotes, underline the quoted part (often the answer)
  const quotedMatch = cleaned.match(/"([^"]+)"/)
  if (quotedMatch) {
    const quotedPart = quotedMatch[1]
    const beforeQuote = cleaned.substring(0, cleaned.indexOf('"'))
    const afterQuote = cleaned.substring(cleaned.indexOf('"') + quotedPart.length + 2)
    return (
      <>
        {beforeQuote}
        <span className="underline decoration-2 decoration-primary">"{quotedPart}"</span>
        {afterQuote}
      </>
    )
  }
  
  // Pattern 5: If the text is short (likely just the answer itself), underline the whole thing
  if (cleaned.length < 100) {
    return <span className="underline decoration-2 decoration-primary">{cleaned}</span>
  }
  
  // Pattern 6: For longer text, underline the first sentence or first meaningful phrase
  const firstSentenceMatch = cleaned.match(/^(.+?[.!?])\s*(.+)$/s)
  if (firstSentenceMatch) {
    const firstSentence = firstSentenceMatch[1].trim()
    const rest = firstSentenceMatch[2].trim()
    return (
      <>
        <span className="underline decoration-2 decoration-primary">{firstSentence}</span>
        {rest ? ` ${rest}` : ''}
      </>
    )
  }
  
  // Fallback: underline the first meaningful phrase (first 3-5 words or up to 60 chars)
  const words = cleaned.split(/\s+/)
  if (words.length <= 5) {
    // Short answer, underline everything
    return <span className="underline decoration-2 decoration-primary">{cleaned}</span>
  }
  
  // Underline first 60 characters or first 5 words, whichever is shorter
  const underlineLength = Math.min(60, words.slice(0, 5).join(' ').length)
  const underlinePart = cleaned.substring(0, underlineLength)
  const rest = cleaned.substring(underlineLength)
  
  return (
    <>
      <span className="underline decoration-2 decoration-primary">{underlinePart}</span>
      {rest}
    </>
  )
}

export const AnswerBox: React.FC<AnswerBoxProps> = ({ response, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span>Analyzing Question...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate confidence based on source and response time
  const confidence = response.source === 'none' || response.source === 'error' ? 0 :
                    response.timeTaken < 2000 ? 0.9 : 
                    response.timeTaken < 5000 ? 0.8 : 0.7;
  
  const confidenceColor = confidence > 0.8 ? 'text-green-600' : 
                         confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'

  // Check if answer already contains "detail:" format - if so, don't show the separate explanation section
  const answerHasDetail = /detail:\s*/i.test(response.answer)

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span>AI Solution</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Highlighted Answer */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Answer:</span>
          </div>
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <p className="text-lg font-bold text-primary leading-relaxed">
              {formatAnswerWithHighlight(response.answer)}
            </p>
          </div>
        </div>

        {/* Small muted explanation - only show if answer doesn't already have detail format */}
        {response.explanation && !answerHasDetail && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Details:</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {response.explanation}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Confidence Level:</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full bg-primary transition-all duration-500`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${confidenceColor}`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}