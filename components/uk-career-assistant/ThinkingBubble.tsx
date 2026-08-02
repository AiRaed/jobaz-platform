'use client'

import UkCareerThinkingState from './UkCareerThinkingState'

interface ThinkingBubbleProps {
  message: string
}

export default function ThinkingBubble({ message }: ThinkingBubbleProps) {
  return <UkCareerThinkingState message={message} />
}
