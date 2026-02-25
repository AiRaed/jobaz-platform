export default function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 ml-2">
      <span className="w-2 h-2 bg-purple-300/90 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
      <span className="w-2 h-2 bg-purple-300/90 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
      <span className="w-2 h-2 bg-purple-300/90 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
    </div>
  )
}

