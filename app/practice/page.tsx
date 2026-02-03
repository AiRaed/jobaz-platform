'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AccessProvider, useAccess } from '@/contexts/AccessProvider'
import { PaywallOverlay } from '@/components/PaywallOverlay'

const TRIAL_LIMIT = 15

// Practice page content component
function PracticePageContent() {
  const { paid, freeUsed, loading, incrementFreeUsed } = useAccess()
  const [showPaywall, setShowPaywall] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  
  // Example questions - replace with your actual questions
  const [questions] = useState<string[]>([
    'Question 1',
    'Question 2',
    // ... your questions
  ])

  // Single derived boolean - do NOT tie to loading state
  const isLocked = !paid && freeUsed >= TRIAL_LIMIT

  // Update showPaywall ONLY when isLocked becomes true (after question 15)
  // Reset showPaywall when no longer locked (paid or freeUsed < 15)
  useEffect(() => {
    // Only show paywall when locked AND not loading
    if (isLocked && !loading) {
      setShowPaywall(true)
    } 
    // Hide paywall when no longer locked (paid or under limit)
    else if (!isLocked && !loading) {
      setShowPaywall(false)
    }
    // Don't change showPaywall state while loading (prevents flicker)
  }, [isLocked, loading])

  // Handle answer selection - increment freeUsed and check if we should lock
  const handleAnswerSelect = useCallback(async (answer: string) => {
    // Block if already locked (after question 15)
    if (isLocked) {
      return
    }

    // Don't proceed if still loading access
    if (loading) {
      return
    }

    setSelectedAnswer(answer)
    
    // Call increment endpoint and get updated state
    const updatedState = await incrementFreeUsed()
    
    // Check if we should lock after incrementing (only after question 15)
    // The useEffect will handle setting showPaywall based on isLocked
    // DO NOT advance to next question if limit reached
    if (!updatedState.paid && updatedState.freeUsed >= TRIAL_LIMIT) {
      // Stay on current question - paywall will show via useEffect
      return
    }
    
    // Otherwise, allow progression (but don't auto-advance here)
    // The user will click Next to advance
  }, [isLocked, loading, incrementFreeUsed])

  // Handle Next button - DO NOT increment freeUsed here
  const handleNext = useCallback(() => {
    // Block if locked (after question 15)
    if (isLocked) {
      return
    }

    // Don't proceed if still loading
    if (loading) {
      return
    }

    // Advance to next question (local state only, no navigation, no router calls)
    setQuestionIndex(prev => prev + 1)
    setSelectedAnswer(null)
  }, [isLocked, loading])

  // Handle Previous button
  const handlePrevious = useCallback(() => {
    // Block if locked (after question 15)
    if (isLocked) {
      return
    }

    // Don't proceed if still loading
    if (loading) {
      return
    }

    // Go to previous question (local state only, no navigation)
    setQuestionIndex(prev => Math.max(0, prev - 1))
    setSelectedAnswer(null)
  }, [isLocked, loading])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block keyboard navigation when locked (after question 15)
      if (isLocked) {
        return
      }

      // Don't proceed if still loading
      if (loading) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (selectedAnswer) {
          handleNext()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLocked, loading, selectedAnswer, handleNext, handlePrevious])

  // Show paywall ONLY when:
  // 1. isLocked is true (freeUsed >= 15 AND not paid)
  // 2. showPaywall state is true (set by useEffect when isLocked becomes true)
  // 3. NOT loading (prevents flash during API calls)
  // This ensures paywall only shows AFTER question 15, never during trial period
  const shouldShowPaywall = isLocked && showPaywall && !loading

  // Don't render anything while loading (prevents paywall flash)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Render paywall overlay - only when shouldShowPaywall is true */}
      {/* Do NOT tie to loading state - only show when locked and not loading */}
      {/* This ensures it doesn't mount/unmount during transitions */}
      {shouldShowPaywall && <PaywallOverlay />}

      {/* Main content - block all interactions when paywall is shown */}
      <div 
        className={shouldShowPaywall ? 'pointer-events-none opacity-50' : ''}
        aria-hidden={shouldShowPaywall}
      >
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Practice Questions</h1>
          
          {questions[questionIndex] && (
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                <p className="text-lg font-medium mb-4">
                  Question {questionIndex + 1} of {questions.length}
                </p>
                <p className="text-base mb-6">{questions[questionIndex]}</p>
                
                {/* Answer options */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleAnswerSelect('Option A')}
                    disabled={shouldShowPaywall}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Option A
                  </button>
                  <button
                    onClick={() => handleAnswerSelect('Option B')}
                    disabled={shouldShowPaywall}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Option B
                  </button>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-4 justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={questionIndex === 0 || shouldShowPaywall}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={!selectedAnswer || shouldShowPaywall}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            Free questions used: {freeUsed} / {TRIAL_LIMIT}
          </div>
        </div>
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

