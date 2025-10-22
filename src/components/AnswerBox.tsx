import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle, Info, TrendingUp } from 'lucide-react'
import { AIResponse } from '@/lib/api'

interface AnswerBoxProps {
  response: AIResponse
  isLoading?: boolean
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
              {response.answer}
            </p>
          </div>
        </div>

        {/* Small muted explanation */}
        {response.explanation && (
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