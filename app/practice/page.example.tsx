'use client'

/**
 * EXAMPLE: Practice Page Implementation
 * 
 * This file demonstrates how to use AccessProvider and PaywallOverlay
 * to fix the paywall flicker issue. Replace your existing Practice page
 * with this pattern.
 */

import React, { useState, useEffect } from 'react'
import { AccessProvider, useAccess, FREE_LIMIT } from '@/contexts/AccessProvider'
import { PaywallOverlay } from '@/components/PaywallOverlay'

// Example Practice page component (wrap your actual component with AccessProvider)
function PracticePageContent() {
  const { paid, freeUsed, loading, incrementFreeUsed } = useAccess()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [questions] = useState<string[]>([
    'Question 1',
    'Question 2',
    // ... your questions
  ])

  // Compute isLocked based on requirements:
  // - access.paid === false
  // - AND access.freeUsed >= FREE_LIMIT (15)
  // - AND access.loading === false
  const isLocked = !paid && freeUsed >= FREE_LIMIT && !loading

  // Handle answer submission (increment freeUsed ONLY when answer is chosen)
  const handleAnswerSubmit = async (answer: string) => {
    if (isLocked) {
      return // Don't allow submission when locked
    }

    setSelectedAnswer(answer)
    
    // Increment freeUsed ONLY when answer is submitted (not on Next button)
    await incrementFreeUsed()
    
    // Move to next question after incrementing
    // The access state will update automatically
  }

  // Handle Next button (DO NOT increment freeUsed here)
  const handleNext = () => {
    if (isLocked) {
      return // Don't allow navigation when locked
    }
    
    setCurrentQuestionIndex(prev => prev + 1)
    setSelectedAnswer(null)
  }

  return (
    <div className="relative">
      {/* Render PaywallOverlay ONLY when isLocked is true */}
      {isLocked && <PaywallOverlay />}

      {/* Main content - block inputs when locked */}
      <div className={isLocked ? 'pointer-events-none opacity-50' : ''}>
        <h1>Practice Questions</h1>
        
        {questions[currentQuestionIndex] && (
          <div>
            <p>Question {currentQuestionIndex + 1}: {questions[currentQuestionIndex]}</p>
            
            {/* Answer options */}
            <div>
              <button
                onClick={() => handleAnswerSubmit('Option A')}
                disabled={isLocked}
              >
                Option A
              </button>
              <button
                onClick={() => handleAnswerSubmit('Option B')}
                disabled={isLocked}
              >
                Option B
              </button>
            </div>

            {/* Next button - does NOT increment freeUsed */}
            {selectedAnswer && (
              <button onClick={handleNext} disabled={isLocked}>
                Next Question
              </button>
            )}
          </div>
        )}

        {/* Show progress */}
        <p>
          Free questions used: {freeUsed} / {FREE_LIMIT}
        </p>
      </div>
    </div>
  )
}

// Export the page wrapped with AccessProvider
export default function PracticePage() {
  return (
    <AccessProvider>
      <PracticePageContent />
    </AccessProvider>
  )
}

