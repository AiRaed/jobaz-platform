'use client'

export default function UkCareerBackground() {
  return (
    <div className="uk-career-bg pointer-events-none fixed inset-0" aria-hidden>
      <div className="uk-career-bg-base absolute inset-0 bg-[#070B14]" />
      <div className="uk-career-bg-wash absolute inset-0 bg-gradient-to-br from-[#0c1222] via-[#070B14] to-[#030508]" />
      <div
        className="uk-career-bg-glow absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(99,102,241,0.18), transparent 42%), radial-gradient(circle at 85% 75%, rgba(6,182,212,0.12), transparent 40%), radial-gradient(circle at 50% 50%, rgba(139,92,246,0.08), transparent 55%)',
        }}
      />
      <div
        className="uk-career-bg-grid absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="uk-career-bg-particles absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-violet-400/30 blur-sm animate-pulse"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${8 + ((i * 17) % 84)}%`,
              top: `${10 + ((i * 23) % 80)}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2.5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>
      <div className="uk-career-bg-blob absolute -top-32 -left-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse" />
      <div
        className="uk-career-bg-blob absolute bottom-[-8rem] right-[-5rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl animate-pulse"
        style={{ animationDelay: '1.5s' }}
      />
    </div>
  )
}
