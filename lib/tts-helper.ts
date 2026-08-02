/**
 * Shared TTS helper for playing question audio using ElevenLabs via /api/tts
 * Includes in-memory caching to avoid repeated API calls for the same question text.
 */

// Module-level cache: maps question text -> audio URL
const questionAudioCache = new Map<string, string>()

// Module-level reference to current audio element to manage playback
let currentAudio: HTMLAudioElement | null = null
// Track if audio is currently playing to prevent duplicate playback
let isPlaying = false

/**
 * Play question audio using ElevenLabs TTS via /api/tts
 * 
 * @param text - The question text to convert to speech
 * @param mode - The mode identifier ('hard' for Hard Mode, 'simulation' for Interview Simulation)
 * @param onEnded - Optional callback when audio playback finishes
 * @param onError - Optional callback when audio playback fails
 * @returns Promise that resolves when audio starts playing (or rejects on error)
 */
export async function playQuestionWithTts(
  text: string,
  mode: 'hard' | 'simulation' | 'voice' = 'simulation',
  onEnded?: () => void,
  onError?: () => void
): Promise<void> {
  // Early return if no text or not in browser
  if (!text || typeof window === 'undefined') {
    if (onError) onError()
    return
  }

  // Guard: If already playing, stop and clean up first
  if (isPlaying || currentAudio) {
    stopQuestionAudio()
  }

  // Set playing flag immediately to prevent duplicate calls
  isPlaying = true

  try {
    // Check cache first
    let audioUrl = questionAudioCache.get(text)

    if (!audioUrl) {
      // Not in cache, fetch from API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          mode: mode === 'hard' ? 'hard-mode' : mode === 'voice' ? 'voice-training' : 'simulation',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[TTS] Failed to generate audio:', errorData)
        if (onError) onError()
        return
      }

      const data = await response.json()
      if (!data.url) {
        console.error('[TTS] No URL in response:', data)
        if (onError) onError()
        return
      }

      audioUrl = data.url
      // Store in cache if we have a valid URL
      if (audioUrl) {
        questionAudioCache.set(text, audioUrl)
      }
    }

    // Create and play audio element
    const audio = new Audio(audioUrl)
    currentAudio = audio

    // Set up event handlers - always create fresh handlers for each play
    // Remove any existing listeners first by clearing handlers
    audio.onended = null
    audio.onerror = null
    
    // Set up new event handlers
    audio.onended = () => {
      isPlaying = false
      currentAudio = null
      // Clear handlers to prevent stale callbacks
      audio.onended = null
      audio.onerror = null
      if (onEnded) onEnded()
    }

    audio.onerror = (error) => {
      console.error('[TTS] Error playing audio:', error)
      isPlaying = false
      currentAudio = null
      // Clear handlers to prevent stale callbacks
      audio.onended = null
      audio.onerror = null
      if (onError) onError()
    }

    // Play the audio
    await audio.play()
  } catch (error) {
    console.error('[TTS] Unexpected error:', error)
    isPlaying = false
    currentAudio = null
    if (onError) onError()
  }
}

/**
 * Stop any currently playing question audio
 */
export function stopQuestionAudio(): void {
  if (currentAudio) {
    // Pause and reset playback position
    currentAudio.pause()
    currentAudio.currentTime = 0
    // Clear event handlers to prevent stale callbacks
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.onplay = null
    // Clear src to fully reset audio element
    currentAudio.src = ''
    currentAudio.load() // Reload to clear any buffered data
    currentAudio = null
  }
  // Reset playing flag
  isPlaying = false
}

/**
 * Clear the audio cache (useful for testing or memory management)
 */
export function clearQuestionAudioCache(): void {
  questionAudioCache.clear()
}

const READY_PROMPT = "I'm ready whenever you are."
const THANK_YOU_PROMPT = 'Thank you.'

/**
 * Play question audio, then the ready prompt before recording starts.
 */
export async function playQuestionWithReadyPrompt(
  questionText: string,
  mode: 'hard' | 'simulation' | 'voice' = 'simulation',
  onReady?: () => void,
  onError?: () => void
): Promise<void> {
  await playQuestionWithTts(
    questionText,
    mode,
    () => {
      void playQuestionWithTts(READY_PROMPT, mode, onReady, onError)
    },
    onError
  )
}

/** Short acknowledgement after the candidate finishes answering. */
export async function playThankYou(
  mode: 'hard' | 'simulation' | 'voice' = 'simulation',
  onDone?: () => void
): Promise<void> {
  await playQuestionWithTts(THANK_YOU_PROMPT, mode, onDone, onDone)
}

