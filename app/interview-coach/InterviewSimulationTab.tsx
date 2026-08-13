'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mic, Square, Loader2, Clock } from 'lucide-react'
import { playQuestionWithTts, playThankYou, stopQuestionAudio } from '@/lib/tts-helper'
import InterviewAvatar from '@/components/interview-coach/InterviewAvatar'
import TranslatableText from '@/components/TranslatableText'
import InterviewBriefCard from '@/components/interview-coach/premium/InterviewBriefCard'
import InterviewFinalReport from '@/components/interview-coach/premium/InterviewFinalReport'
import InterviewNextActions, { buildSimulationNextActions } from '@/components/interview-coach/premium/InterviewNextActions'
import { PremiumCard, HorizontalProgressBar } from '@/components/interview-coach/premium/shared'
import { buildInterviewBrief } from '@/lib/interview-coach/briefConfig'
import { messageFromAiLimitPayload } from '@/lib/ai-usage/client'

type Status = 'idle' | 'countdown' | 'asking' | 'ready' | 'recording' | 'processing' | 'thankyou' | 'finished'

interface InterviewEvaluation {
  clarity: number
  confidence: number
  speed: number
  tone: number
  structure: number
  completeness: number
  examples: number
  overall: number
}

type InterviewEval = {
  overall: number
  clarity: number
  confidence: number
  speed: number
  tone: number
  structure: number
  completeness: number
  examples: number
}

// Helper function to normalize questions to string array
function normalizeQuestions(qs: any[]): string[] {
  if (!Array.isArray(qs)) return []

  return qs
    .map((q) => {
      if (typeof q === 'string') return q
      if (q && typeof q === 'object' && typeof q.question === 'string') return q.question
      return ''
    })
    .filter(Boolean)
}

interface InterviewSimulationTabProps {
  onScoreUpdate?: (score: number | null, finished: boolean) => void
  onCoachNotesUpdate?: (coachNotes: string[] | null) => void
  onRestart?: () => void
  coreQuestions?: string[]
  writingEvaluations?: { [questionIndex: number]: { savedAnswer?: string } }
  jobTitle?: string
  company?: string
  jobId?: string
}

export default function InterviewSimulationTab({
  onScoreUpdate,
  onCoachNotesUpdate,
  onRestart,
  coreQuestions = [],
  writingEvaluations = {},
  jobTitle: jobTitleProp = '',
  company: companyProp = '',
  jobId = '',
}: InterviewSimulationTabProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false) // Start as false since we use coreQuestions immediately
  const [status, setStatus] = useState<Status>('idle')
  const [countdown, setCountdown] = useState(3)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [spokenAnswers, setSpokenAnswers] = useState<string[]>([])
  const [writtenAnswers, setWrittenAnswers] = useState<string[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [interviewEvaluation, setInterviewEvaluation] = useState<InterviewEvaluation | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [coachNotes, setCoachNotes] = useState<string[] | null>(null)
  const [interviewEval, setInterviewEval] = useState<InterviewEval | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Keep ref in sync with state to avoid stale closures in callbacks
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentIndexRef = useRef<number>(0) // Track current index for use in callbacks to avoid stale closures
  const audioRef = useRef<HTMLAudioElement | null>(null) // Track current audio element for proper cleanup
  const audioObjectUrlRef = useRef<string | null>(null) // Track object URL for cleanup
  const isPlayingQuestionRef = useRef<boolean>(false) // Track if we're in asking/playing phase

  // Helper function to load saved written answers from writingEvaluations prop
  const loadWrittenAnswers = (questionCount: number) => {
    try {
      const savedAnswers: string[] = Array(questionCount).fill('')
      
      // Extract saved answers from writingEvaluations prop (same method as Hard Mode)
      for (let i = 0; i < questionCount; i++) {
        const evaluation = writingEvaluations[i]
        if (evaluation?.savedAnswer) {
          savedAnswers[i] = evaluation.savedAnswer
        }
      }
      
      setWrittenAnswers(savedAnswers)
    } catch (error) {
      console.error('Error loading written answers:', error)
      setWrittenAnswers(Array(questionCount).fill(''))
    }
  }

  // Primary: Use coreQuestions from Writing Training (shared source of truth)
  // Secondary: Optional API call for enrichment (non-blocking)
  useEffect(() => {
    // Use coreQuestions as primary source (same as Hard Mode and Voice Training)
    if (coreQuestions.length > 0) {
      const normalized = normalizeQuestions(coreQuestions)
      if (normalized.length > 0) {
        console.log('[Interview Simulation] Using coreQuestions from Writing Training:', normalized.length, 'questions')
        setQuestions(normalized)
        setSpokenAnswers(Array(normalized.length).fill(''))
        loadWrittenAnswers(normalized.length)
        setIsLoadingQuestions(false)
      }
    } else {
      // No questions available - will show "Go to Writing Training" state
      console.log('[Interview Simulation] No coreQuestions available - user needs to complete Writing Training')
      setQuestions([])
      setSpokenAnswers([])
      setWrittenAnswers([])
      setIsLoadingQuestions(false)
    }

    // Optional: Try to enrich questions from API (non-blocking, doesn't affect UI)
    // This is only for enrichment if API has better questions, but we don't wait for it
    const jobTitle = searchParams.get('title') || ''
    const company = searchParams.get('company') || ''
    
    if (jobTitle && coreQuestions.length > 0) {
      // Only make API call if we already have questions (for potential enrichment)
      // This is non-blocking - we don't wait for it or show loading state
      fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: jobTitle,
          jobTitle: jobTitle,
          company: company,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            const normalized = normalizeQuestions(data.questions)
            if (normalized.length > 0) {
              console.log('[Interview Simulation] API enrichment available:', normalized.length, 'questions (not used, coreQuestions is primary)')
              // We don't update questions here - coreQuestions is the source of truth
            }
          }
        })
        .catch(error => {
          // Silently fail - API is optional
          console.log('[Interview Simulation] Optional API call failed (non-blocking):', error.message)
        })
    }
  }, [coreQuestions, writingEvaluations, searchParams])

  // Reset audio when question index changes (but not on initial mount)
  // IMPORTANT: Never run this effect while phase is 'asking' or while audio is playing
  const prevIndexRef = useRef<number | null>(null)
  useEffect(() => {
    // Gate: Never run while asking or playing - only reset on actual question change
    if (status === 'asking' || isPlayingQuestionRef.current) {
      return
    }
    // Only reset if this is a real question change (not initial mount)
    if (prevIndexRef.current !== null && prevIndexRef.current !== currentIndex) {
      // Reset audio when moving to a new question
      // This ensures clean state for each question
      resetAudio()
    }
    prevIndexRef.current = currentIndex
  }, [currentIndex, status])

  // Countdown effect
  useEffect(() => {
    if (status !== 'countdown') return

    if (countdown === 0) {
      // Countdown finished, start first question
      setCurrentIndex(0)
      currentIndexRef.current = 0 // Ensure ref is in sync
      speakQuestionAndRecord(0)
      return
    }

    countdownIntervalRef.current = setTimeout(() => {
      setCountdown((c) => c - 1)
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current)
      }
    }
  }, [status, countdown])

  // Reset audio on question change
  const resetAudio = () => {
    // Use the tts-helper function to properly stop and clean up audio
    stopQuestionAudio()
    // Also clear local refs if they exist
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current)
      audioObjectUrlRef.current = null
    }
    // Reset playing flag
    isPlayingQuestionRef.current = false
  }

  // Comprehensive reset function for simulation state
  // Resets ALL state/refs/timers to ensure clean state for restart and new questions
  // Note: Does NOT reset currentIndex - that should be handled separately
  const resetSimulationState = () => {
    // Stop and reset question audio state
    stopQuestionAudio()
    resetAudio()
    
    // Clear all pending timers/intervals
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    
    // Stop and null MediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
        // Remove handlers
        mediaRecorderRef.current.ondataavailable = null
        mediaRecorderRef.current.onstop = null
      } catch (e) {
        // Ignore errors if already stopped
      }
      mediaRecorderRef.current = null
    }
    
    // Clear audio capture stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    
    // Clear audio chunks
    audioChunksRef.current = []
    
    // Cancel speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    // Reset all phase tracking refs and flags
    prevIndexRef.current = null
    isPlayingQuestionRef.current = false
    // Note: currentIndexRef is NOT reset here - it's updated separately when needed
    
    // Reset transcription state
    setCurrentTranscript('')
    
    // CRITICAL: Reset status to 'idle' to clear any stale state from previous question
    // This prevents Q2-Q8 from jumping to listening/recording during question playback
    // Status will be set to 'asking' BEFORE playing audio in speakQuestionAndRecord()
    setStatus('idle')
  }

  // Speak question using TTS and then start recording
  // CRITICAL: This function MUST set status='asking' BEFORE audio plays
  // The ONLY transition from asking -> recording should be via audio.onended
  const speakQuestionAndRecord = async (index: number) => {
    // Guard: Prevent duplicate calls - if already playing, return early
    if (isPlayingQuestionRef.current || status === 'asking') {
      console.log('[Interview Simulation] Already playing question, skipping duplicate call')
      return
    }

    // CRITICAL: Reset ALL state/refs/timers before starting each question
    // This ensures clean state for Q1-Q8 (prevents Q2-Q8 from jumping to listening/recording)
    resetSimulationState()
    
    // Update current index ref
    currentIndexRef.current = index

    // questions is string[], so no .text property needed
    const q = questions[index]
    if (!q) {
      // no question text – go straight to recording
      setStatus('recording')
      startRecording()
      return
    }

    // CRITICAL: Set status to 'asking' IMMEDIATELY before playing audio
    // This ensures the asking animation shows from the start for ALL questions
    // Listening can ONLY become true after question audio ended (via audio.onended)
    setStatus('asking')
    isPlayingQuestionRef.current = true

    try {
      await playQuestionWithTts(
        q,
        'simulation',
        () => {
          setStatus('ready')
          void playQuestionWithTts(
            "I'm ready whenever you are.",
            'simulation',
            () => {
              isPlayingQuestionRef.current = false
              setStatus('recording')
              startRecording()
            },
            () => {
              isPlayingQuestionRef.current = false
              setStatus('recording')
              startRecording()
            }
          )
        },
        () => {
          isPlayingQuestionRef.current = false
          setStatus('recording')
          startRecording()
        }
      )
    } catch (error) {
      console.error('Error playing question audio:', error)
      // On error, still transition to recording
      isPlayingQuestionRef.current = false
      setStatus('recording')
      startRecording()
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      setStatus('recording')
      setCurrentTranscript('')
      audioChunksRef.current = []

      // Capture the current index at the time of recording to avoid stale closures
      const recordingIndex = currentIndexRef.current

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // Pass the captured index to avoid stale closure issues
        await transcribeAudio(audioBlob, recordingIndex)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()

      // Auto-stop after 60 seconds
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
      }
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording()
      }, 60000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to access microphone. Please check your permissions.')
      setStatus('idle')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  // Transcribe audio
  // Accept index parameter to avoid stale closure issues
  const transcribeAudio = async (blob: Blob, index: number) => {
    try {
      setStatus('processing')

      const formData = new FormData()
      formData.append('audio', blob, 'answer.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(messageFromAiLimitPayload(errBody, response.status) || 'Transcription failed')
      }

      const data = await response.json()
      const transcript: string = data.transcript || ''

      setCurrentTranscript(transcript)

      // Save answer using the passed index (not stale currentIndex from closure)
      setSpokenAnswers((prev) => {
        const copy = [...prev]
        copy[index] = transcript
        return copy
      })

      // Thank you, then next question
      setStatus('thankyou')
      void playThankYou('simulation', () => {
        goToNextQuestion()
      })
    } catch (error) {
      console.error('Error transcribing audio:', error)
      setStatus('idle')
      alert('Failed to transcribe audio. Please try again.')
    }
  }

  // Go to next question
  // Use functional state updates to avoid stale closure issues
  const goToNextQuestion = () => {
    // CRITICAL: Reset ALL state/refs/timers before starting new question
    // This ensures clean state for Q2-Q8 (not just Q1)
    resetSimulationState()
    
    setCurrentIndex((prevIndex) => {
      // Use functional update to get the latest currentIndex value
      const questionsLength = questions.length // Capture questions.length to check if it's available
      if (prevIndex < questionsLength - 1) {
        const next = prevIndex + 1
        currentIndexRef.current = next // Update ref immediately
        
        // Play the question audio after a short delay to ensure cleanup completes
        // speakQuestionAndRecord will set status to 'asking' and isPlayingQuestionRef
        // No need to set them here to avoid duplicate state updates
        setTimeout(() => {
          speakQuestionAndRecord(next)
        }, 50)
        return next
      } else {
        // All questions completed - schedule finishSimulation after state update
        setTimeout(() => {
          finishSimulation()
        }, 0)
        return prevIndex
      }
    })
  }

  // Evaluate interview - sends all answers to API for scoring
  const evaluateInterview = async (answers: string[]) => {
    try {
      setIsEvaluating(true)
      const response = await fetch('/api/interview/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        throw new Error('Evaluation failed')
      }

      const data = await response.json()
      if (data.ok) {
        const evalData: InterviewEval = {
          clarity: data.clarity,
          confidence: data.confidence,
          speed: data.speed,
          tone: data.tone,
          structure: data.structure,
          completeness: data.completeness,
          examples: data.examples,
          overall: data.overall,
        }
        
        // Update both evaluation states
        setInterviewEvaluation({
          clarity: data.clarity,
          confidence: data.confidence,
          speed: data.speed,
          tone: data.tone,
          structure: data.structure,
          completeness: data.completeness,
          examples: data.examples,
          overall: data.overall,
        })
        setInterviewEval(evalData)
      }
    } catch (error) {
      console.error('Error evaluating interview:', error)
      // On error, keep the local evaluation that was already set
    } finally {
      setIsEvaluating(false)
    }
  }


  // Finish simulation and calculate score
  const finishSimulation = async () => {
    setStatus('finished')
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }

    // Calculate score based on average word count
    const wordCounts = spokenAnswers.map((ans) => {
      const words = ans.trim().split(/\s+/).filter((w) => w.length > 0)
      return words.length
    })

    const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length || 0
    const rawScore = Math.min(10, avgWords / 3)
    const finalScore = parseFloat(rawScore.toFixed(1))
    setScore(finalScore)

    // Generate simple text feedback based on score and answers
    const feedbackLines: string[] = []
    
    if (finalScore < 5) {
      // Low score feedback
      feedbackLines.push('Work on improving the clarity of your answers')
      feedbackLines.push('Add more specific examples to support your points')
      feedbackLines.push('Try to provide more detailed responses')
      feedbackLines.push('Focus on structuring your answers better')
    } else if (finalScore < 8) {
      // Medium score feedback
      feedbackLines.push('Your answers show good structure')
      feedbackLines.push('Consider adding more concrete examples')
      feedbackLines.push('Work on expanding your responses with more detail')
      feedbackLines.push('Practice maintaining a confident delivery')
    } else {
      // High score feedback
      feedbackLines.push('Excellent structure in your answers')
      feedbackLines.push('You demonstrated confident delivery')
      feedbackLines.push('Your responses were clear and well-organized')
      feedbackLines.push('Great use of examples to support your points')
    }
    
    setCoachNotes(feedbackLines)
    
    // Notify parent component of coach notes update
    if (onCoachNotesUpdate) {
      onCoachNotesUpdate(feedbackLines)
    }

    // Notify parent component of score update
    if (onScoreUpdate) {
      onScoreUpdate(finalScore, true)
    }

    // Set interviewEval immediately after setting the provisional score
    // All categories use the same provisional score for now
    setInterviewEval({
      overall: finalScore,
      clarity: finalScore,
      confidence: finalScore,
      speed: finalScore,
      tone: finalScore,
      structure: finalScore,
      completeness: finalScore,
      examples: finalScore,
    })

    // Call API evaluations if all 8 questions are answered
    // This will update interviewEval with API results when they arrive
    const allAnswersPresent = spokenAnswers.length === questions.length && 
                              spokenAnswers.every((ans) => ans && ans.trim().length > 0)
    
    if (allAnswersPresent && questions.length === 8) {
      // Call both evaluations - they will update the states when complete
      await evaluateInterview(spokenAnswers)
    }
  }

  // Start interview
  const handleStartInterview = () => {
    if (questions.length === 0) {
      alert('Questions are still loading. Please wait.')
      return
    }

    resetSimulationState()
    setElapsedSeconds(0)
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)

    setStatus('countdown')
    setCountdown(3)
    setCurrentIndex(0)
    currentIndexRef.current = 0 // Reset ref to match state
    setSpokenAnswers(Array(questions.length).fill(''))
    setCurrentTranscript('')
    setScore(null)
    setInterviewEvaluation(null)
    setCoachNotes(null)
    setInterviewEval(null)
    
    // Notify parent component that simulation is reset
    if (onScoreUpdate) {
      onScoreUpdate(null, false)
    }
    if (onCoachNotesUpdate) {
      onCoachNotesUpdate(null)
    }
    
    // Reload written answers when starting
    loadWrittenAnswers(questions.length)
  }

  // Restart simulation
  const restartSimulation = () => {
    resetSimulationState()
    setElapsedSeconds(0)
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }

    setStatus('countdown')
    setCountdown(3) // Reset countdown to initial value
    setCurrentIndex(0)
    currentIndexRef.current = 0 // Reset ref to match state
    setSpokenAnswers(Array(questions.length).fill(''))
    setCurrentTranscript('')
    setScore(null)
    setInterviewEvaluation(null)
    setCoachNotes(null)
    setInterviewEval(null)
    
    // Notify parent component that simulation is reset
    if (onScoreUpdate) {
      onScoreUpdate(null, false)
    }
    if (onCoachNotesUpdate) {
      onCoachNotesUpdate(null)
    }
    
    // Reload written answers when restarting
    if (questions.length > 0) {
      loadWrittenAnswers(questions.length)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
      resetAudio()
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current)
      }
    }
  }, [])

  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  const resolvedJobTitle = jobTitleProp || searchParams.get('title') || 'Interview Practice'
  const resolvedCompany = companyProp || searchParams.get('company') || 'General Practice'
  const brief = buildInterviewBrief(resolvedJobTitle, resolvedCompany, questions.length)

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  let avatarState: 'speaking' | 'listening' | 'idle' | 'thinking' = 'idle'
  let avatarStatus: string | undefined
  if (status === 'asking') {
    avatarState = 'speaking'
  } else if (status === 'ready') {
    avatarState = 'thinking'
    avatarStatus = "I'm ready whenever you are."
  } else if (status === 'recording') {
    avatarState = 'listening'
    avatarStatus = 'Listening…'
  } else if (status === 'processing' || status === 'thankyou') {
    avatarState = 'thinking'
    avatarStatus = status === 'thankyou' ? 'Thank you.' : 'Thinking…'
  } else if (status === 'countdown') {
    avatarState = 'idle'
    avatarStatus = 'Preparing next question…'
  }

  // Show loading state while questions are being loaded
  if (isLoadingQuestions) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-semibold mb-6">Interview Simulation</h2>
        <div className="w-full flex justify-center">
          <div className="bg-[#0D0D0D] rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center space-y-4 border border-gray-800">
            <Loader2 className="w-8 h-8 animate-spin text-[#9b5cff]" />
            <p className="text-gray-400 text-center">Loading questions…</p>
          </div>
        </div>
      </div>
    )
  }

  // Show "Go to Writing Training" state if no questions available
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-semibold mb-6">Interview Simulation</h2>
        <div className="w-full flex justify-center">
          <div className="bg-[#0D0D0D] rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center space-y-4 border border-gray-800">
            <p className="text-gray-400 text-center text-lg mb-2">
              Complete Writing Training first to unlock Interview Simulation.
            </p>
            <p className="text-gray-500 text-center text-sm">
              Save your written answers for all questions to access the full simulation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">
          Step 4 · Interview Simulation
        </p>
        <h2 className="text-xl font-semibold text-slate-100 mt-1">Full Voice Interview</h2>
      </div>

      <div className="w-full">
        <PremiumCard className="p-4 mb-4">
          <InterviewAvatar state={avatarState} statusLabel={avatarStatus} />
        </PremiumCard>

        {status === 'idle' && (
          <InterviewBriefCard brief={brief} onStart={handleStartInterview} />
        )}

        {status === 'countdown' && (
          <PremiumCard className="p-10 flex flex-col items-center justify-center min-h-[280px]">
            <div className="text-8xl font-bold text-violet-400 tabular-nums animate-pulse">{countdown}</div>
            <p className="text-lg text-slate-300 mt-4">Get ready…</p>
          </PremiumCard>
        )}

        {status !== 'idle' && status !== 'countdown' && status !== 'finished' && (
          <PremiumCard glow className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatElapsed(elapsedSeconds)}
              </span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <HorizontalProgressBar value={progressPercent} />

            <div className="rounded-lg border border-violet-500/20 bg-violet-950/15 px-4 py-3">
              <p className="text-sm text-violet-200/90 font-medium mb-1">
                Question {currentIndex + 1}
              </p>
              <p className="text-base text-slate-100 leading-relaxed">
                <TranslatableText text={questions[currentIndex]}>
                  {questions[currentIndex]}
                </TranslatableText>
              </p>
            </div>

            {status === 'ready' && (
              <p className="text-sm text-emerald-300 font-medium text-center animate-pulse">
                I&apos;m ready whenever you are.
              </p>
            )}

            <div className="text-sm text-slate-400">
              {status === 'asking' && (
                <span className="flex items-center gap-2 text-violet-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is reading the question…
                </span>
              )}
              {status === 'recording' && (
                <span className="flex items-center gap-2 text-emerald-400">
                  <Mic className="w-4 h-4 animate-pulse" />
                  Listening… answer in your own words.
                </span>
              )}
              {(status === 'processing' || status === 'thankyou') && (
                <span className="flex items-center gap-2 text-amber-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === 'thankyou' ? 'Thank you.' : 'Processing your answer…'}
                </span>
              )}
            </div>

            {(status === 'recording' || status === 'processing') && (
              <button
                onClick={stopRecording}
                disabled={status === 'processing'}
                data-jaz-action="ic_sim_stop"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-600/70 bg-slate-900/80 text-slate-200 hover:border-violet-400/50 disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                I&apos;m done
              </button>
            )}

            {currentTranscript && (
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Transcript</p>
                <p className="text-sm text-slate-300">{currentTranscript}</p>
              </div>
            )}
          </PremiumCard>
        )}

        {status === 'finished' && (
          <div className="space-y-4">
            <InterviewFinalReport
              scores={{
                overall: interviewEval?.overall ?? score ?? 0,
                readiness: Math.round(((interviewEval?.overall ?? score ?? 0) / 10) * 100),
                communication: interviewEval?.clarity ?? score ?? 0,
                confidence: interviewEval?.confidence ?? score ?? 0,
                professionalTone: interviewEval?.tone ?? score ?? 0,
                examples: interviewEval?.examples ?? score ?? 0,
                starMethod: interviewEval?.structure ?? score ?? 0,
                voiceQuality: interviewEval?.speed ?? score ?? 0,
                memory: interviewEval?.completeness ?? score ?? 0,
                employerImpression: interviewEval?.overall ?? score ?? 0,
              }}
            />

            <InterviewNextActions
              actions={buildSimulationNextActions({
                score: interviewEval?.overall ?? score ?? 0,
                jobId,
                onPracticeAgain: restartSimulation,
                onImproveAnswers: () => router.push('/interview-coach?tab=writing'),
              })}
            />

            <PremiumCard className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-200">Session Review</h3>
              {questions.map((question, idx) => (
                <div key={idx} className="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3 space-y-2">
                  <p className="text-xs font-medium text-violet-300">Q{idx + 1}</p>
                  <p className="text-xs text-slate-400">{question}</p>
                  <p className="text-xs text-slate-300">{spokenAnswers[idx] || 'No answer recorded.'}</p>
                </div>
              ))}
            </PremiumCard>

            <div className="flex gap-2">
              <button
                onClick={restartSimulation}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-600/70 bg-slate-900/80 text-slate-200 hover:border-violet-400/50"
              >
                Practice again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

