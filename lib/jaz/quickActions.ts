import type { JazPageId } from './pageRegistry'

export type JazQuickAction = {
  id: string
  label: string
  prompt: string
  intent: 'ask' | 'guide' | 'translate'
  href?: string
}

const BY_PAGE: Partial<Record<JazPageId, JazQuickAction[]>> = {
  landing: [
    {
      id: 'explain-jobaz',
      label: 'Explain JobAZ',
      prompt: 'What is JobAZ and how does it help me get a job in the UK?',
      intent: 'ask',
    },
    {
      id: 'start-assessment',
      label: 'Start assessment',
      prompt: 'How do I start the free career assessment?',
      intent: 'guide',
      href: '/uk-career-assistant',
    },
    {
      id: 'explain-jobs',
      label: 'Explain jobs',
      prompt: 'How does JobAZ job search work without signing up?',
      intent: 'ask',
    },
    {
      id: 'explain-courses',
      label: 'Explain courses',
      prompt: 'How do professional courses fit into my career plan?',
      intent: 'ask',
    },
    {
      id: 'translate-page',
      label: 'Translate page',
      prompt: 'Translate this page for me.',
      intent: 'translate',
    },
  ],
  dashboard: [
    {
      id: 'explain-plan',
      label: 'Explain my plan',
      prompt: 'Explain my current career plan and what I should focus on next.',
      intent: 'guide',
    },
    {
      id: 'next-step',
      label: 'What should I do next?',
      prompt: 'What is the single most important next step in my career plan?',
      intent: 'guide',
    },
    {
      id: 'readiness',
      label: 'Readiness score',
      prompt: 'Explain my career readiness score and what is missing.',
      intent: 'ask',
    },
  ],
  'career-engine': [
    {
      id: 'explain-plan',
      label: 'Explain my plan',
      prompt: 'Explain my career plan recommendations and why they were chosen.',
      intent: 'guide',
    },
    {
      id: 'why-recommended',
      label: 'Why recommended?',
      prompt: 'Why was this step recommended for me?',
      intent: 'ask',
    },
    {
      id: 'next-step',
      label: 'What should I do next?',
      prompt: 'What should I do next in my career plan?',
      intent: 'guide',
    },
    {
      id: 'missing-quals',
      label: 'Missing qualifications',
      prompt: 'What qualifications am I missing for my target role in the UK?',
      intent: 'ask',
    },
  ],
  'uk-career-assistant': [
    {
      id: 'explain-plan',
      label: 'Explain my plan',
      prompt: 'Explain my career plan and readiness based on my answers so far.',
      intent: 'guide',
    },
    {
      id: 'why-recommended',
      label: 'Why recommended?',
      prompt: 'Why was this course or action recommended for me?',
      intent: 'ask',
    },
    {
      id: 'progression',
      label: 'Career progression',
      prompt: 'Explain my long-term career progression path in the UK.',
      intent: 'ask',
    },
  ],
  'job-finder': [
    {
      id: 'why-match',
      label: 'Why this match?',
      prompt: 'Explain why these jobs match my profile.',
      intent: 'ask',
    },
    {
      id: 'improve-cv',
      label: 'Improve my CV',
      prompt: 'What CV improvements would help me match better jobs?',
      intent: 'guide',
      href: '/cv-builder-v2',
    },
    {
      id: 'better-jobs',
      label: 'Find better jobs',
      prompt: 'How can I find jobs that better match my career plan?',
      intent: 'guide',
    },
  ],
  'job-details': [
    {
      id: 'why-match',
      label: 'Why this match?',
      prompt: 'Explain why this job matches my profile and career plan.',
      intent: 'ask',
    },
    {
      id: 'salary',
      label: 'Explain salary',
      prompt: 'Explain the salary range and whether this is realistic for this role in the UK.',
      intent: 'ask',
    },
    {
      id: 'skills',
      label: 'Required skills',
      prompt: 'Explain the required skills and which ones I still need to develop.',
      intent: 'ask',
    },
    {
      id: 'improve-cv',
      label: 'Improve my CV',
      prompt: 'Suggest CV improvements for this specific job.',
      intent: 'guide',
    },
    {
      id: 'prepare-interview',
      label: 'Prepare interview',
      prompt: 'Help me prepare for an interview for this role.',
      intent: 'guide',
      href: '/interview-coach',
    },
  ],
  course: [
    {
      id: 'why-course',
      label: 'Why this course?',
      prompt: 'Explain why this course is recommended for my career plan.',
      intent: 'ask',
    },
    {
      id: 'career-impact',
      label: 'Career impact',
      prompt: 'How will completing this course affect my career and readiness score?',
      intent: 'ask',
    },
    {
      id: 'roadmap-fit',
      label: 'Roadmap fit',
      prompt: 'Where does this course fit in my overall career roadmap?',
      intent: 'ask',
    },
  ],
  'career-hub': [
    {
      id: 'why-course',
      label: 'Why recommended?',
      prompt: 'Explain why these courses are recommended for my path.',
      intent: 'ask',
    },
    {
      id: 'next-step',
      label: 'What should I do next?',
      prompt: 'Which course should I take first in my plan?',
      intent: 'guide',
    },
  ],
  'cv-builder': [
    {
      id: 'guide-section',
      label: 'Guide this section',
      prompt: 'Guide me through the CV section I am on right now.',
      intent: 'guide',
    },
    {
      id: 'why-matters',
      label: 'Why this matters',
      prompt: 'Explain why this CV section matters to UK recruiters.',
      intent: 'ask',
    },
    {
      id: 'improve-cv',
      label: 'Improve my CV',
      prompt: 'What should I improve in my CV right now?',
      intent: 'guide',
    },
  ],
  'cover-letter': [
    {
      id: 'guide-letter',
      label: 'Guide my letter',
      prompt: 'Guide me through improving my cover letter step by step.',
      intent: 'guide',
    },
    {
      id: 'why-matters',
      label: 'Why this matters',
      prompt: 'Explain why each part of a cover letter matters to UK employers.',
      intent: 'ask',
    },
  ],
  'interview-coach': [
    {
      id: 'coach-me',
      label: 'Coach me',
      prompt: 'Coach me before I start practising — what should I focus on?',
      intent: 'guide',
    },
    {
      id: 'explain-question',
      label: 'Explain question',
      prompt: 'Explain this interview question and how to structure my answer.',
      intent: 'ask',
    },
    {
      id: 'prepare',
      label: 'Prepare for interview',
      prompt: 'Help me prepare for my upcoming interview.',
      intent: 'guide',
    },
  ],
}

const DEFAULT_ACTIONS: JazQuickAction[] = [
  {
    id: 'next-step',
    label: 'What should I do next?',
    prompt: 'What should I do next in my UK career journey?',
    intent: 'guide',
  },
  {
    id: 'translate-page',
    label: 'Translate page',
    prompt: 'Help me translate content on this page.',
    intent: 'translate',
  },
  {
    id: 'simpler',
    label: 'Explain simply',
    prompt: 'Explain this in simpler language.',
    intent: 'ask',
  },
]

export function getQuickActionsForPage(pageId: JazPageId): JazQuickAction[] {
  return BY_PAGE[pageId] ?? DEFAULT_ACTIONS
}
