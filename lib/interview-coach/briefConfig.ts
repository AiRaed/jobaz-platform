export type InterviewBriefConfig = {
  company: string
  jobTitle: string
  interviewType: string
  questionCount: number
  estimatedDurationMinutes: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  interviewerName: string
  evaluationSkills: string[]
}

export type InterviewSource = 'tailor-cv' | 'job-finder' | 'general'

export function buildInterviewBrief(
  jobTitle: string,
  company: string,
  questionCount: number
): InterviewBriefConfig {
  const mins = Math.max(8, Math.round(questionCount * 1.5))
  return {
    company: company || 'General Practice',
    jobTitle: jobTitle || 'Interview Practice',
    interviewType: 'Behavioural & Role-Specific',
    questionCount,
    estimatedDurationMinutes: mins,
    difficulty: questionCount >= 8 ? 'Medium' : 'Easy',
    interviewerName: 'JAZ',
    evaluationSkills: ['Communication', 'Confidence', 'Teamwork', 'Problem Solving'],
  }
}

export function detectInterviewSource(
  fromParam: string | null,
  jobId: string | null
): InterviewSource {
  if (fromParam === 'cv' || fromParam === 'tailor' || fromParam === 'cv-builder') {
    return 'tailor-cv'
  }
  if (jobId || fromParam === 'job-finder' || fromParam === 'jobs') {
    return 'job-finder'
  }
  return 'general'
}

export function interviewSourceLabel(source: InterviewSource): string {
  switch (source) {
    case 'tailor-cv':
      return 'This interview was generated from your tailored CV.'
    case 'job-finder':
      return 'Questions are based on this job description.'
    default:
      return 'General Interview Practice.'
  }
}

export function computeInterviewReadiness(progress: {
  writing: number
  voice: number
  hard: number
  full: number
}): number {
  return Math.round(
    progress.writing * 0.25 +
      progress.voice * 0.25 +
      progress.hard * 0.25 +
      progress.full * 0.25
  )
}
