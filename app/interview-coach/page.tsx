'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mic, Play, Square, Save, Edit, Send, Headphones, ChevronDown, ChevronUp, Loader2, EyeOff, CheckCircle2, X, Sparkles } from 'lucide-react'
import { getJobInfo, getJobContextForAPI } from '@/lib/job-store'
import InterviewSimulationTab from './InterviewSimulationTab'
import PublicToolLayout from '@/components/guest-tools/PublicToolLayout'
import { playQuestionWithTts, playQuestionWithReadyPrompt, stopQuestionAudio } from '@/lib/tts-helper'
import { cn } from '@/lib/utils'
import TranslatableText from '@/components/TranslatableText'
import { messageFromAiLimitPayload } from '@/lib/ai-usage/client'
import {
  InterviewJourneyProgress,
  InterviewSourceBanner,
  VoiceRecordingPanel,
  VoiceMetricsPanel,
  InterviewCoachNotesPanel,
  InterviewFinalReport,
} from '@/components/interview-coach/premium'
import {
  computeInterviewReadiness,
  detectInterviewSource,
} from '@/lib/interview-coach/briefConfig'
import { useToolGuestMode } from '@/lib/guest-tools/useToolGuestMode'
import { GUEST_LIMITS } from '@/lib/guest-tools/constants'
import {
  incrementGuestUsage,
  readGuestDraft,
  readGuestUsage,
  writeGuestDraft,
} from '@/lib/guest-tools/storage'

type TrainingLevel = 'writing' | 'voice' | 'hard' | 'memory' | 'interviewSimulation'

interface EvaluationData {
  overallScore: number
  perCategory: {
    Clarity: number
    Relevance: number
    Structure: number
    ProfessionalTone: number
    Conciseness: number
  }
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  improvedSampleAnswer: string
  shortTip: string
  // Legacy fields for backward compatibility
  score?: number
  improved_answer?: string
  rewrite_in_user_tone?: string
}

interface VoiceQuestion {
  id: string
  question: string
  answer: string
}

interface VoiceResult {
  transcript: string
  scores: {
    clarity: number
    confidence: number
    speed: number
    filler_words: number
    professional_tone: number
    structure: number
  }
  summary_feedback: string
  improvement_tips: string[]
}

interface HardModeResult {
  convertedText: string
  accuracy: number
  memoryRetention: number
  logic: number
  stability: number
  tone: number
  completeness: number
  examplesClarity: number
  structure: number
  summaryFeedback: string
  improvementTips: string[]
}

interface HardModeQuestion {
  question: string
  targetAnswer: string
}

interface SimulationQuestionResult {
  question: string
  transcript: string
  scores: {
    clarity: number
    confidence: number
    speed: number
    filler_words: number
    professional_tone: number
    structure: number
  }
  summaryFeedback: string
  improvementTips: string[]
}

// Level 3 - Memory Mode Types
interface MemoryQuestion {
  question: string
  idealAnswer?: string
}

interface MemoryAnswer {
  answer: string
}

interface MemoryEvaluationResult {
  memoryScore: number
  clarityScore: number
  confidenceScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  missedPoints: string[]
}

// Level 4 - Simulation Mode Types (TEXT VERSION)
interface SimulationEvaluationResult {
  overallScore: number
  communicationScore: number
  confidenceScore: number
  problemSolvingScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

// Default questions (fallback when no job context)
const defaultInterviewQuestions = [
  "Tell me about yourself and why you're interested in this position?",
  "Why should we hire you?",
  "What are your strengths?",
  "What is your biggest weakness?",
  "Tell me about a challenge you faced at work.",
  "Where do you see yourself in 5 years?",
  "Why do you want to work at our company?",
  "Describe a time you worked in a team.",
]

// Function to generate question-specific suggested answers
const getSuggestedAnswers = (
  questionText: string,
  jobTitle: string = '',
  jobCategory: string = '',
  companyName: string = ''
): string[] => {
  const question = questionText.toLowerCase()
  const jobContext = jobTitle || jobCategory || 'this role'
  const companyContext = companyName || 'the company'
  const fullJobContext = jobTitle && companyName 
    ? `${jobTitle} at ${companyName}` 
    : jobTitle || jobCategory || 'this position'

  // Helper to get job-specific skills based on category
  const getJobSkills = (category: string): { skill1: string; skill2: string; area: string } => {
    const skillsMap: { [key: string]: { skill1: string; skill2: string; area: string } } = {
      'Customer Service': { skill1: 'customer communication', skill2: 'problem-solving', area: 'client relations' },
      'Sales': { skill1: 'relationship building', skill2: 'persuasive communication', area: 'sales strategies' },
      'Hospitality': { skill1: 'guest relations', skill2: 'attention to detail', area: 'service excellence' },
      'IT Support': { skill1: 'technical troubleshooting', skill2: 'system administration', area: 'IT solutions' },
      'Admin': { skill1: 'organizational skills', skill2: 'administrative efficiency', area: 'office management' },
      'Management': { skill1: 'team leadership', skill2: 'strategic planning', area: 'team development' },
      'Retail': { skill1: 'customer engagement', skill2: 'inventory management', area: 'retail operations' },
      'Warehouse': { skill1: 'logistics coordination', skill2: 'safety protocols', area: 'supply chain' },
      'Healthcare': { skill1: 'patient care', skill2: 'medical protocols', area: 'healthcare delivery' },
      'Marketing': { skill1: 'campaign strategy', skill2: 'analytics', area: 'brand development' },
    }
    return skillsMap[category] || { skill1: 'relevant skills', skill2: 'professional expertise', area: 'the field' }
  }

  const skills = getJobSkills(jobCategory)

  // Detect question type and generate 3 distinct variants
  if (question.includes('tell me about yourself') || question.includes('introduce yourself')) {
    return [
      // Variant A: Concise + Direct
      `I'm a dedicated professional with experience in ${skills.area}. I'm passionate about ${skills.skill1} and excited about the opportunity to contribute to ${companyContext} as a ${jobContext}. My background has prepared me well for this role, and I'm confident I can make a positive impact.`,
      // Variant B: STAR Structured
      `I bring ${skills.skill1} and ${skills.skill2} to the ${jobContext} role. In my previous experience, I've successfully managed ${skills.area} projects that delivered measurable results. I'm particularly drawn to ${companyContext}'s mission and believe my combination of technical expertise and collaborative approach would be valuable to your team.`,
      // Variant C: Metrics/Results Focused
      `With a proven track record in ${skills.area}, I've consistently achieved results through my expertise in ${skills.skill1} and ${skills.skill2}. This ${jobContext} position at ${companyContext} aligns perfectly with my career goals and allows me to leverage my experience to drive success. I'm excited about the opportunity to contribute and grow with the organization.`,
    ]
  }

  if (question.includes('why should we hire you') || question.includes('why hire you')) {
    return [
      // Variant A: Concise + Direct
      `You should hire me because I bring a unique combination of ${skills.skill1} and ${skills.skill2} directly relevant to the ${jobContext} role. I'm results-driven, adaptable, and committed to exceeding expectations. My experience in ${skills.area} makes me an immediate asset to your team.`,
      // Variant B: STAR Structured
      `I'm the right fit for this ${jobContext} position because I've consistently delivered results in ${skills.area}. In my previous role, I successfully applied ${skills.skill1} to solve complex challenges, which directly translates to what you need. I'm also passionate about ${companyContext}'s goals and ready to contribute from day one.`,
      // Variant C: Metrics/Results Focused
      `My track record in ${skills.area} demonstrates my ability to deliver measurable outcomes. I excel in ${skills.skill1} and ${skills.skill2}, skills that are critical for success in this ${jobContext} role. I'm not just looking for a job—I'm seeking to make a meaningful impact at ${companyContext} and help achieve your strategic objectives.`,
    ]
  }

  if (question.includes('strengths') || question.includes('strength')) {
    return [
      // Variant A: Concise + Direct
      `My key strengths are ${skills.skill1} and ${skills.skill2}, which are essential for the ${jobContext} role. I'm also highly organized, a strong communicator, and thrive in fast-paced environments. These strengths have consistently helped me deliver results in ${skills.area}.`,
      // Variant B: STAR Structured
      `One of my greatest strengths is my ability to apply ${skills.skill1} effectively. For example, in my previous role, I used this skill to improve processes and achieve better outcomes. Additionally, my ${skills.skill2} expertise has been crucial in managing complex ${skills.area} projects. These strengths make me well-suited for this ${jobContext} position.`,
      // Variant C: Metrics/Results Focused
      `My strengths include ${skills.skill1} and ${skills.skill2}, which I've leveraged to achieve measurable success in ${skills.area}. I'm also detail-oriented, proactive, and excel at collaborating with cross-functional teams. These strengths align perfectly with what's needed for success in the ${jobContext} role at ${companyContext}.`,
    ]
  }

  if (question.includes('weakness') || question.includes('weak')) {
    return [
      // Variant A: Concise + Direct
      `My biggest weakness was perfectionism, which sometimes led me to spend too much time on details. I've learned to balance quality with efficiency by setting clear priorities and deadlines. This has improved my productivity while maintaining high standards, which is important for the ${jobContext} role.`,
      // Variant B: STAR Structured
      `I used to struggle with saying no to additional tasks, which sometimes spread me too thin. I've addressed this by improving my time management and communication skills. Now I proactively discuss priorities and set realistic expectations, ensuring I deliver quality work on time. This growth makes me better prepared for the ${jobContext} position.`,
      // Variant C: Metrics/Results Focused
      `Early in my career, I had difficulty delegating tasks because I wanted to ensure everything was done perfectly. I've since learned to trust my team and focus on strategic priorities. This change has increased my team's productivity by 30% and allowed me to take on more leadership responsibilities—skills that are valuable for the ${jobContext} role.`,
    ]
  }

  if (question.includes('challenge') || question.includes('difficult') || question.includes('problem')) {
    return [
      // Variant A: Concise + Direct
      `I faced a significant challenge when ${skills.area} processes needed urgent improvement. I analyzed the situation, identified root causes, and implemented a solution that streamlined operations. The result was improved efficiency and better outcomes. This experience taught me the importance of proactive problem-solving, which I'd bring to the ${jobContext} role.`,
      // Variant B: STAR Structured
      `Situation: We encountered a critical issue affecting ${skills.area}. Task: I was responsible for resolving it quickly. Action: I gathered data, consulted with the team, and developed a structured approach. I implemented the solution and monitored results. Result: We resolved the issue within the deadline and improved the process long-term. This demonstrates my problem-solving skills for the ${jobContext} position.`,
      // Variant C: Metrics/Results Focused
      `I tackled a major challenge in ${skills.area} that was impacting performance. By applying ${skills.skill1} and ${skills.skill2}, I developed and executed a solution that reduced processing time by 25% and increased team satisfaction. This experience showcases my ability to handle complex challenges—a skill essential for success in the ${jobContext} role at ${companyContext}.`,
    ]
  }

  if (question.includes('team') || question.includes('collaborat')) {
    return [
      // Variant A: Concise + Direct
      `I worked on a team project where we needed to improve ${skills.area} processes. I took the lead on communication, ensuring everyone understood their roles and deadlines. Through regular check-ins and collaborative problem-solving, we delivered the project on time and exceeded expectations. I thrive in team environments and would bring this collaborative approach to the ${jobContext} role.`,
      // Variant B: STAR Structured
      `Situation: Our team was tasked with a complex ${skills.area} initiative. Task: Coordinate efforts across multiple stakeholders. Action: I facilitated regular meetings, created a shared project plan, and ensured open communication. I also stepped in to help teammates when needed. Result: We completed the project ahead of schedule with high quality. This teamwork experience is directly relevant to the ${jobContext} position.`,
      // Variant C: Metrics/Results Focused
      `I collaborated with a cross-functional team to launch a ${skills.area} improvement initiative. By fostering open communication and leveraging each team member's strengths, we achieved a 20% improvement in key metrics. My ability to build consensus and drive team success makes me well-suited for the collaborative environment at ${companyContext} in the ${jobContext} role.`,
    ]
  }

  if (question.includes('pressure') || question.includes('stress') || question.includes('deadline') || question.includes('urgent')) {
    return [
      // Variant A: Concise + Direct
      `I handle pressure well by staying organized and maintaining clear priorities. When facing tight deadlines, I break tasks into manageable steps and focus on what's most critical. I also communicate proactively with stakeholders about timelines. This calm, methodical approach has helped me succeed in high-pressure situations, which is important for the ${jobContext} role.`,
      // Variant B: STAR Structured
      `Situation: I faced an urgent deadline for a critical ${skills.area} project. Task: Deliver quality results under significant time pressure. Action: I prioritized tasks, eliminated non-essential work, and worked efficiently while maintaining quality standards. I also kept stakeholders informed. Result: I met the deadline and delivered excellent work. This demonstrates my ability to perform under pressure in the ${jobContext} position.`,
      // Variant C: Metrics/Results Focused
      `I excel under pressure by using ${skills.skill1} to prioritize effectively. In a recent high-stakes situation, I managed multiple urgent tasks simultaneously, delivering all on time with 100% accuracy. My ability to remain calm and focused under pressure, combined with strong time management, makes me an asset for the fast-paced ${jobContext} role at ${companyContext}.`,
    ]
  }

  if (question.includes('achievement') || question.includes('proud') || question.includes('accomplish')) {
    return [
      // Variant A: Concise + Direct
      `One of my proudest achievements was leading a ${skills.area} initiative that significantly improved our processes. I took ownership of the project, coordinated with multiple stakeholders, and delivered results that exceeded expectations. This achievement demonstrates my ability to drive meaningful change, which I'd bring to the ${jobContext} role.`,
      // Variant B: STAR Structured
      `Situation: We needed to improve ${skills.area} performance. Task: Lead the improvement initiative. Action: I researched best practices, developed a comprehensive plan, and executed it with the team. I tracked progress and adjusted as needed. Result: We achieved measurable improvements in efficiency and quality. This achievement showcases my leadership and results-oriented approach for the ${jobContext} position.`,
      // Variant C: Metrics/Results Focused
      `My greatest achievement was transforming ${skills.area} operations, resulting in a 30% increase in efficiency and a 15% cost reduction. By applying ${skills.skill1} and ${skills.skill2}, I delivered measurable business impact. This achievement demonstrates my ability to drive results—a skill that would be valuable in the ${jobContext} role at ${companyContext}.`,
    ]
  }

  if (question.includes('why') && (question.includes('company') || question.includes('work here') || question.includes('want to work'))) {
    return [
      // Variant A: Concise + Direct
      `I want to work at ${companyContext} because I'm genuinely excited about your mission and values. The ${jobContext} role aligns perfectly with my career goals and allows me to leverage my experience in ${skills.area}. I'm particularly drawn to your innovative approach and the opportunity to make a meaningful impact.`,
      // Variant B: STAR Structured
      `I'm interested in ${companyContext} because of your reputation for excellence in ${skills.area}. The ${jobContext} position offers the perfect opportunity to apply my ${skills.skill1} and ${skills.skill2} skills while contributing to your strategic goals. I'm also excited about the growth opportunities and collaborative culture I've heard about.`,
      // Variant C: Metrics/Results Focused
      `I want to join ${companyContext} because your track record of success in ${skills.area} aligns with my professional values. The ${jobContext} role is an ideal match for my expertise in ${skills.skill1} and ${skills.skill2}, and I'm excited to contribute to your continued growth. I see this as a long-term partnership where I can grow while delivering measurable value.`,
    ]
  }

  if (question.includes('5 years') || question.includes('future') || question.includes('career goal')) {
    return [
      // Variant A: Concise + Direct
      `In 5 years, I see myself in a senior ${jobContext} role, having made significant contributions to ${companyContext}'s success. I plan to continue developing my ${skills.skill1} and ${skills.skill2} expertise while taking on more leadership responsibilities. I'm committed to growing with the organization and helping achieve long-term goals.`,
      // Variant B: STAR Structured
      `My 5-year plan includes advancing within ${companyContext} by deepening my expertise in ${skills.area} and expanding my leadership capabilities. I want to take on more strategic responsibilities while continuing to deliver results. I'm particularly interested in ${skills.skill1} development and see this ${jobContext} role as the perfect foundation for that growth.`,
      // Variant C: Metrics/Results Focused
      `In 5 years, I envision myself as a key contributor to ${companyContext}'s success, having advanced to a senior ${jobContext} position. I plan to leverage my ${skills.skill1} and ${skills.skill2} skills to drive measurable business impact while mentoring others. I'm committed to continuous learning and contributing to the organization's strategic objectives.`,
    ]
  }

  // Default fallback for any other question types
  return [
    // Variant A: Concise + Direct
    `Based on my experience in ${skills.area}, I would approach this by applying ${skills.skill1} and ${skills.skill2}. I'm confident that my background and skills make me well-suited to handle this effectively in the ${jobContext} role.`,
    // Variant B: STAR Structured
    `I would address this by drawing on my experience in ${skills.area}. I've successfully handled similar situations by using ${skills.skill1} and ${skills.skill2}, which have consistently delivered positive results. This approach would be valuable for the ${jobContext} position at ${companyContext}.`,
    // Variant C: Metrics/Results Focused
    `My experience in ${skills.area} has prepared me well for this. I've applied ${skills.skill1} and ${skills.skill2} to achieve measurable success in similar contexts. I'm excited to bring this expertise to the ${jobContext} role and contribute to ${companyContext}'s continued success.`,
  ]
}

// Function to generate job-specific questions
const generateJobSpecificQuestions = (jobTitle: string, company: string): string[] => {
  if (!jobTitle && !company) {
    return defaultInterviewQuestions
  }

  const jobContext = jobTitle ? (company ? `${jobTitle} role at ${company}` : jobTitle) : company
  const jobTitleOnly = jobTitle || 'this position'
  const companyOnly = company || 'our company'

  return [
    `Tell me about yourself and why you're interested in the ${jobTitleOnly}${company ? ` role at ${company}` : ''}?`,
    `Why should we hire you for the ${jobTitleOnly} position?`,
    `What are your strengths that make you a good fit for ${jobTitleOnly}?`,
    "What is your biggest weakness?",
    `Tell me about a challenge you faced at work that relates to ${jobTitleOnly} responsibilities.`,
    "Where do you see yourself in 5 years?",
    `Why do you want to work as a ${jobTitleOnly}${company ? ` at ${company}` : ''}?`,
    `Describe a time you worked in a team on a project relevant to ${jobTitleOnly}.`,
  ]
}

// Helper function to format voice training question with job context
const formatVoiceQuestionWithContext = (question: string, jobTitle: string, company: string): string => {
  if (!jobTitle && !company) {
    return question
  }
  
  // Customize "Tell me about yourself" questions
  if (question.toLowerCase().includes("tell me about yourself")) {
    if (jobTitle && company) {
      return `Tell me about yourself and why you're a good fit for the ${jobTitle} role at ${company}.`
    } else if (jobTitle) {
      return `Tell me about yourself and why you're a good fit for the ${jobTitle} role.`
    } else if (company) {
      return `Tell me about yourself and why you're a good fit for ${company}.`
    }
  }
  
  return question
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

export default function InterviewCoachPage() {
  const searchParams = useSearchParams()
  const jobTitleFromURL = searchParams.get('title') || ''
  const companyFromURL = searchParams.get('company') || ''
  const jobIdFromURL = searchParams.get('jobId') || ''
  const fromParam = searchParams.get('from')
  const interviewSource = detectInterviewSource(fromParam, jobIdFromURL)
  const guest = useToolGuestMode('interview')
  
  // Shared job context state - used across all modes
  const [jobContext, setJobContext] = useState({
    jobTitle: jobTitleFromURL || '',
    company: companyFromURL || '',
    manualJobTitle: '',
    selectedJobType: '',
  })
  
  // Track if we've set the interview_trained flag for this job
  const interviewTrainedFlagSet = useRef(false)
  
  // Set interview_trained flag when page loads with jobId or when user starts training
  useEffect(() => {
    if (typeof window === 'undefined' || !jobIdFromURL || interviewTrainedFlagSet.current) {
      return
    }
    
    // Set flag immediately when page loads with jobId
    localStorage.setItem(`jobaz_job_${jobIdFromURL}_interview_trained`, 'true')
    interviewTrainedFlagSet.current = true
    
    // Dispatch event for JAZ to detect state changes
    window.dispatchEvent(new Event('jobaz-job-state-changed'))
  }, [jobIdFromURL])

  // Helper function to get final job title based on priority
  const getFinalJobTitle = () => {
    return jobContext.jobTitle || jobContext.manualJobTitle || jobContext.selectedJobType || ''
  }

  // Helper function to get final company
  const getFinalCompany = () => {
    return jobContext.company || ''
  }

  // Helper function to generate jobId for audio file paths
  const getJobId = () => {
    const finalJobTitle = getFinalJobTitle()
    const finalCompany = getFinalCompany()
    // Create a consistent jobId from job context (sanitize for file paths)
    const jobId = `${finalJobTitle || 'default'}_${finalCompany || 'company'}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
    return jobId
  }

  // Canonical questions state - shared across all modes
  const [coreQuestions, setCoreQuestions] = useState<string[]>([])
  
  // Track job context to clear coreQuestions when it changes
  const jobContextKeyRef = useRef<string>('')
  // Ref to store scroll position before evaluation to prevent auto-scroll after evaluation completes
  const scrollPositionRef = useRef<number>(0)
  
  // Generate job context key for comparison
  const getJobContextKey = () => {
    const finalJobTitle = getFinalJobTitle()
    const finalCompany = getFinalCompany()
    return `${finalJobTitle}|||${finalCompany}`
  }

  // Clear coreQuestions when job context changes
  useEffect(() => {
    const currentKey = getJobContextKey()
    if (jobContextKeyRef.current && jobContextKeyRef.current !== currentKey) {
      setCoreQuestions([])
    }
    jobContextKeyRef.current = currentKey
  }, [jobContext.jobTitle, jobContext.company, jobContext.manualJobTitle, jobContext.selectedJobType])

  // Generate job-specific questions using jobContext (reactive to jobContext changes)
  // For Writing mode: use coreQuestions if available, otherwise use generated questions
  const interviewQuestions = useMemo(() => {
    if (coreQuestions.length > 0) {
      return normalizeQuestions(coreQuestions)
    }
    const finalJobTitle = jobContext.jobTitle || jobContext.manualJobTitle || jobContext.selectedJobType || ''
    const finalCompany = jobContext.company || ''
    return normalizeQuestions(generateJobSpecificQuestions(finalJobTitle, finalCompany))
  }, [jobContext.jobTitle, jobContext.company, jobContext.manualJobTitle, jobContext.selectedJobType, coreQuestions])
  
  const [activeTab, setActiveTab] = useState<TrainingLevel>('writing')
  
  // Writing Training State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showImprovedAnswer, setShowImprovedAnswer] = useState(false)
  const [savedWritingAnswers, setSavedWritingAnswers] = useState<string[]>([])
  const [writingCompleted, setWritingCompleted] = useState(false)
  const [hasEvaluatedCurrent, setHasEvaluatedCurrent] = useState(false)
  // Improved Sample Answer feature state (isolated to Writing Training UI only)
  const [improvedAnswer, setImprovedAnswer] = useState<string>('')
  const [whyBetter, setWhyBetter] = useState<string[]>([])
  const [isImproving, setIsImproving] = useState(false)
  // Accordion state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    categoryBreakdown: false,
    strengths: false,
    weaknesses: false,
    tips: false,
    improvedSample: false, // Closed by default
  })
  const [writingScores, setWritingScores] = useState<{ [questionIndex: number]: number }>({})
  const [writingCategoryScores, setWritingCategoryScores] = useState<{ [questionIndex: number]: EvaluationData['perCategory'] }>({})
  const [aiCoachNotes, setAiCoachNotes] = useState<Array<{ questionIndex: number; tip: string; weakness?: string; improvement?: string }>>([])
  const [voiceTrainingExplicitlyUnlocked, setVoiceTrainingExplicitlyUnlocked] = useState(false)
  // Job Setup collapse state
  const [jobSetupCollapsed, setJobSetupCollapsed] = useState(false)
  // New: Store full evaluations per question
  const [writingEvaluations, setWritingEvaluations] = useState<{ [questionIndex: number]: {
    score: number
    clarity: number
    relevance: number
    structure: number
    professionalTone: number
    examplesImpact: number
    strengths: string[]
    weaknesses: string[]
    tips: string[]
    improvedSample: string
    savedAnswer?: string // Store the user's saved written answer (optional, only set when saved)
  } }>({})
  
  // Auto-evaluation state: debounce timer and request ID guard
  const evaluationDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const evaluationRequestIdRef = useRef<number>(0)
  const isProgrammaticChangeRef = useRef<boolean>(false)
  
  // Progress State - Initialize with 0 for all levels
  const [progress, setProgress] = useState({
    writing: 0,
    voice: 0,
    hard: 0,
    memory: 0,
    full: 0,
  })

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Toast helper function
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!guest.authReady || !guest.isGuest) return
    const draft = readGuestDraft<{
      userAnswer?: string
      currentQuestionIndex?: number
      writingEvaluations?: typeof writingEvaluations
      savedWritingAnswers?: string[]
    }>('interview')
    if (!draft) return
    if (draft.userAnswer) setUserAnswer(draft.userAnswer)
    if (draft.currentQuestionIndex != null) setCurrentQuestionIndex(draft.currentQuestionIndex)
    if (draft.writingEvaluations) setWritingEvaluations(draft.writingEvaluations)
    if (draft.savedWritingAnswers) setSavedWritingAnswers(draft.savedWritingAnswers)
  }, [guest.authReady, guest.isGuest])

  // Update hasEvaluatedCurrent when question index changes
  // Check if there's an evaluation result for the current question
  useEffect(() => {
    // Check if there's an evaluation for this question
    const hasEvaluation = writingEvaluations[currentQuestionIndex]?.score !== undefined
    setHasEvaluatedCurrent(hasEvaluation)
    // Clear improved answer feature state when question changes
    setImprovedAnswer('')
    setWhyBetter([])
  }, [currentQuestionIndex, writingEvaluations])

  // Also set flag when user starts answering question 1 (safe fallback)
  useEffect(() => {
    if (typeof window === 'undefined' || !jobIdFromURL || interviewTrainedFlagSet.current) {
      return
    }
    
    // If user has started answering question 1, set the flag
    if (currentQuestionIndex === 0 && userAnswer.trim().length > 0 && activeTab === 'writing') {
      localStorage.setItem(`jobaz_job_${jobIdFromURL}_interview_trained`, 'true')
      interviewTrainedFlagSet.current = true
      window.dispatchEvent(new Event('jobaz-job-state-changed'))
    }
  }, [jobIdFromURL, currentQuestionIndex, userAnswer, activeTab])

  // Prevent automatic scrolling after evaluation completes
  useEffect(() => {
    if (hasEvaluatedCurrent && activeTab === 'writing') {
      // Restore scroll position after a brief delay to ensure DOM has updated
      // This prevents the browser from auto-scrolling to new content
      const restoreScroll = () => {
        if (scrollPositionRef.current !== undefined) {
          // Use scrollTo with x, y coordinates for instant scroll (no smooth behavior)
          window.scrollTo(0, scrollPositionRef.current)
        }
      }
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll)
      })
    }
  }, [hasEvaluatedCurrent, activeTab])

  // Voice Training State
  const [voiceQuestions, setVoiceQuestions] = useState<VoiceQuestion[]>([])
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null)
  const [voiceResultsHistory, setVoiceResultsHistory] = useState<VoiceResult[]>([])
  const [voiceTrainingCompleted, setVoiceTrainingCompleted] = useState(false)
  const [voiceIsSpeakingQuestion, setVoiceIsSpeakingQuestion] = useState(false)
  const [voiceReadyMessage, setVoiceReadyMessage] = useState<string | null>(null)
  const voiceTtsIndexRef = useRef<number>(-1)
  
  // Hard Mode State
  const [hardModeQuestions, setHardModeQuestions] = useState<HardModeQuestion[]>([])
  const [hardModeIndex, setHardModeIndex] = useState(0)
  const [hardModeIsRecording, setHardModeIsRecording] = useState(false)
  const [hardModeRecordingTime, setHardModeRecordingTime] = useState(0)
  const [hardModeAudioBlob, setHardModeAudioBlob] = useState<Blob | null>(null)
  const [hardModeResult, setHardModeResult] = useState<HardModeResult | null>(null)
  const [hardModeConvertedText, setHardModeConvertedText] = useState('')
  const [hardModeLoading, setHardModeLoading] = useState(false)
  const [hardModeCountdown, setHardModeCountdown] = useState<number | null>(null)
  const [hardModeIsLoadingQuestions, setHardModeIsLoadingQuestions] = useState(false)
  const [hardModeIsTranscribing, setHardModeIsTranscribing] = useState(false)
  const [hardModeResultsHistory, setHardModeResultsHistory] = useState<HardModeResult[]>([])
  const [hardModeShowCompletion, setHardModeShowCompletion] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Hard Mode refs (separate from Voice Training)
  const hardModeMediaRecorderRef = useRef<MediaRecorder | null>(null)
  const hardModeAudioChunksRef = useRef<Blob[]>([])
  const hardModeTimerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hardModeStreamRef = useRef<MediaStream | null>(null)
  const hardModeCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Level 3 - Memory Mode State
  const [isMemorySessionActive, setIsMemorySessionActive] = useState(false)
  const [currentMemoryQuestionIndex, setCurrentMemoryQuestionIndex] = useState(0)
  const [memoryQuestions, setMemoryQuestions] = useState<MemoryQuestion[]>([])
  const [memoryAnswers, setMemoryAnswers] = useState<MemoryAnswer[]>([])
  const [isMemorySessionFinished, setIsMemorySessionFinished] = useState(false)
  const [memoryEvaluationResult, setMemoryEvaluationResult] = useState<MemoryEvaluationResult | null>(null)
  const [isMemoryEvaluating, setIsMemoryEvaluating] = useState(false)
  const [isLoadingMemoryQuestions, setIsLoadingMemoryQuestions] = useState(false)
  const [currentMemoryAnswer, setCurrentMemoryAnswer] = useState('')

  // Simulation Mode State (VOICE-BASED FULL INTERVIEW)
  const [simulationQuestions, setSimulationQuestions] = useState<string[]>([])
  const [simulationCurrentIndex, setSimulationCurrentIndex] = useState(0)
  const [isSimulationActive, setIsSimulationActive] = useState(false)
  const [isSimulationFinished, setIsSimulationFinished] = useState(false)
  const [simulationCountdown, setSimulationCountdown] = useState<number | null>(null)
  const [simulationIsRecording, setSimulationIsRecording] = useState(false)
  const [simulationRecordingTime, setSimulationRecordingTime] = useState(0)
  const [simulationAudioBlob, setSimulationAudioBlob] = useState<Blob | null>(null)
  const [simulationSpokenAnswers, setSimulationSpokenAnswers] = useState<string[]>([]) // Transcribed answers
  const [simulationEvaluations, setSimulationEvaluations] = useState<HardModeResult[]>([]) // Evaluation for each question
  const [simulationIsTranscribing, setSimulationIsTranscribing] = useState(false)
  const [simulationIsEvaluating, setSimulationIsEvaluating] = useState(false)
  const [simulationCurrentSpokenAnswer, setSimulationCurrentSpokenAnswer] = useState<string>('')
  const [simulationAudioRef, setSimulationAudioRef] = useState<HTMLAudioElement | null>(null)
  const [simulationIsPlayingAudio, setSimulationIsPlayingAudio] = useState(false)
  const [simulationFinalScore, setSimulationFinalScore] = useState<number | null>(null)
  const [interviewSimulationScore, setInterviewSimulationScore] = useState<number | null>(null)
  const [interviewSimulationFinished, setInterviewSimulationFinished] = useState(false)
  const [interviewSimulationCoachNotes, setInterviewSimulationCoachNotes] = useState<string[] | null>(null)
  const [interviewSimulationRestartKey, setInterviewSimulationRestartKey] = useState(0)
  const mockInterviewSignalRef = useRef(false)
  const interviewStartedModesRef = useRef<Set<string>>(new Set())
  
  // Simulation refs
  const simulationMediaRecorderRef = useRef<MediaRecorder | null>(null)
  const simulationAudioChunksRef = useRef<Blob[]>([])
  const simulationTimerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const simulationStreamRef = useRef<MediaStream | null>(null)
  const simulationCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const simulationSilenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const simulationAudioElementRef = useRef<HTMLAudioElement | null>(null)

  const overallInterviewReadiness = useMemo(
    () => computeInterviewReadiness(progress),
    [progress]
  )

  useEffect(() => {
    if (activeTab !== 'voice' || voiceQuestions.length === 0 || voiceTrainingCompleted) return
    if (isRecording || audioBlob || voiceResult) return
    if (voiceTtsIndexRef.current === currentVoiceIndex) return

    const question = voiceQuestions[currentVoiceIndex]?.question
    if (!question) return

    voiceTtsIndexRef.current = currentVoiceIndex
    setVoiceReadyMessage(null)
    setVoiceIsSpeakingQuestion(true)

    void playQuestionWithReadyPrompt(
      formatVoiceQuestionWithContext(question, getFinalJobTitle(), getFinalCompany()),
      'voice',
      () => {
        setVoiceIsSpeakingQuestion(false)
        setVoiceReadyMessage("I'm ready whenever you are.")
      },
      () => {
        setVoiceIsSpeakingQuestion(false)
        setVoiceReadyMessage("I'm ready whenever you are.")
      }
    )

    return () => stopQuestionAudio()
  }, [
    activeTab,
    currentVoiceIndex,
    voiceQuestions,
    voiceTrainingCompleted,
    isRecording,
    audioBlob,
    voiceResult,
  ])

  // Calculate average writing score from evaluations
  const averageWritingScore = useMemo(() => {
    const evaluations = Object.values(writingEvaluations)
    if (evaluations.length === 0) return 0
    const sum = evaluations.reduce((acc, evaluation) => acc + evaluation.score, 0)
    return sum / evaluations.length
  }, [writingEvaluations])

  // Calculate category averages
  const categoryAverages = useMemo(() => {
    const categoryScores = Object.values(writingCategoryScores)
    if (categoryScores.length === 0) {
      return {
        Clarity: 0,
        Relevance: 0,
        Structure: 0,
        ProfessionalTone: 0,
        Conciseness: 0,
      }
    }
    
    const totals = categoryScores.reduce((acc, categories) => {
      return {
        Clarity: acc.Clarity + categories.Clarity,
        Relevance: acc.Relevance + categories.Relevance,
        Structure: acc.Structure + categories.Structure,
        ProfessionalTone: acc.ProfessionalTone + categories.ProfessionalTone,
        Conciseness: acc.Conciseness + categories.Conciseness,
      }
    }, { Clarity: 0, Relevance: 0, Structure: 0, ProfessionalTone: 0, Conciseness: 0 })
    
    const count = categoryScores.length
    return {
      Clarity: totals.Clarity / count,
      Relevance: totals.Relevance / count,
      Structure: totals.Structure / count,
      ProfessionalTone: totals.ProfessionalTone / count,
      Conciseness: totals.Conciseness / count,
    }
  }, [writingCategoryScores])
  
  // Helper function to format category names for display
  const formatCategoryName = (category: string): string => {
    const nameMap: Record<string, string> = {
      Clarity: 'Clarity',
      Relevance: 'Relevance',
      Structure: 'Structure',
      ProfessionalTone: 'Professional Tone',
      Conciseness: 'Conciseness',
    }
    return nameMap[category] || category
  }
  
  // Find best and weakest categories
  const bestCategory = useMemo(() => {
    const entries = Object.entries(categoryAverages) as [keyof typeof categoryAverages, number][]
    if (entries.length === 0) return null
    return entries.reduce((best, [key, value]) => value > best[1] ? [key, value] : best, entries[0])[0]
  }, [categoryAverages])
  
  const weakestCategory = useMemo(() => {
    const entries = Object.entries(categoryAverages) as [keyof typeof categoryAverages, number][]
    if (entries.length === 0) return null
    return entries.reduce((weakest, [key, value]) => value < weakest[1] ? [key, value] : weakest, entries[0])[0]
  }, [categoryAverages])
  
  // Voice readiness logic - removed score requirement, only Writing Training completion needed

  // Check if writing training is complete (all questions evaluated and overall summary is shown)
  const isWritingTrainingComplete = useMemo(() => {
    return Object.keys(writingEvaluations).length === interviewQuestions.length && interviewQuestions.length > 0
  }, [writingEvaluations, interviewQuestions.length])

  // Shared helper function for voice evaluation
  async function evaluateVoiceAnswer(options: {
    audioBlob: Blob
    question: string
    referenceAnswer?: string
  }): Promise<{
    transcript: string
    scores: {
      clarity: number
      confidence: number
      speed: number
      filler_words: number
      professional_tone: number
      structure: number
    }
    summary_feedback: string
    improvement_tips: string[]
  }> {
    const formData = new FormData()
    formData.append('audio', options.audioBlob, 'recording.webm')
    formData.append('question', options.question)
    formData.append('reference_answer', options.referenceAnswer || '[No reference answer available]')

    const response = await fetch('/api/interview/voice-train', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = 'Voice evaluation failed.'
      try {
        const errorData = await response.json()
        if (errorData.error === 'OPENAI_ERROR') {
          errorMessage = 'Voice evaluation failed. Please check your connection and try again.'
        } else if (errorData.error === 'AI_PARSE_ERROR') {
          errorMessage = 'Failed to parse AI response. Please try again.'
        } else if (errorData.error === 'AI_LIMIT_REACHED' || errorData.message) {
          errorMessage = messageFromAiLimitPayload(errorData, response.status) || errorData.message
        }
      } catch (e) {
        // If we can't parse the error, use default message
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.ok) {
      let errorMessage = 'Voice evaluation failed.'
      if (data.error === 'OPENAI_ERROR') {
        errorMessage = 'Voice evaluation failed. Please check your connection and try again.'
      } else if (data.error === 'AI_PARSE_ERROR') {
        errorMessage = 'Failed to parse AI response. Please try again.'
      } else if (data.message) {
        errorMessage = data.message
      }
      throw new Error(errorMessage)
    }

    // Validate the response has all required fields
    if (!data.transcript || !data.scores || !data.summary_feedback || !data.improvement_tips) {
      throw new Error('Invalid response from voice evaluation service.')
    }

    return {
      transcript: data.transcript,
      scores: data.scores,
      summary_feedback: data.summary_feedback,
      improvement_tips: data.improvement_tips,
    }
  }

  // Handle suggested answer selection
  const handleSuggestedAnswerClick = (index: number) => {
    setSelectedAnswer(index)
    const currentQuestion = typeof interviewQuestions[currentQuestionIndex] === 'string' 
      ? interviewQuestions[currentQuestionIndex] 
      : String(interviewQuestions[currentQuestionIndex] || '')
    const suggestedAnswers = getSuggestedAnswers(
      currentQuestion,
      getFinalJobTitle(),
      jobContext.selectedJobType,
      getFinalCompany()
    )
    // Mark as programmatic change to skip debounced auto-evaluation
    isProgrammaticChangeRef.current = true
    setUserAnswer(suggestedAnswers[index])
    setHasEvaluatedCurrent(false)
    // Reset flag after a short delay
    setTimeout(() => {
      isProgrammaticChangeRef.current = false
    }, 100)
  }

  // Handle evaluation
  const handleEvaluate = async (answerToEvaluate?: string, requestId?: number) => {
    const answer = answerToEvaluate ?? userAnswer
    if (!answer.trim()) {
      alert('Please write an answer before evaluating.')
      return
    }

    // Generate request ID if not provided (for manual calls)
    const currentRequestId = requestId ?? ++evaluationRequestIdRef.current

    // Save current scroll position to prevent auto-scroll after evaluation completes
    scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop

    // Reset evaluation state at the start of any evaluation
    setHasEvaluatedCurrent(false)
    setIsEvaluating(true)
    try {
      const currentQuestion = interviewQuestions[currentQuestionIndex]
      const questionText = typeof currentQuestion === 'string' ? currentQuestion : String(currentQuestion || '')
      const finalJobTitle = getFinalJobTitle()
      const finalCompany = getFinalCompany()

      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAnswer: answer,
          jobTitle: finalJobTitle,
          company: finalCompany,
          question: questionText,
        }),
      })

      const data = await response.json()
      const limitMsg = messageFromAiLimitPayload(data, response.status)
      if (limitMsg) throw new Error(limitMsg)
      
      // Check if this result is stale (newer evaluation request exists)
      if (currentRequestId !== evaluationRequestIdRef.current) {
        // Ignore stale result - but still reset evaluation state
        setIsEvaluating(false)
        return
      }
      
      if (data.ok) {
        // Save full evaluation in new format (only if not already exists, unless re-evaluating)
        const newEvaluation = {
          score: data.score || data.overallScore || 7,
          clarity: data.clarity || data.perCategory?.Clarity || 7,
          relevance: data.relevance || data.perCategory?.Relevance || 7,
          structure: data.structure || data.perCategory?.Structure || 7,
          professionalTone: data.professionalTone || data.perCategory?.ProfessionalTone || 7,
          examplesImpact: data.examplesImpact || data.perCategory?.Conciseness || 7,
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          tips: Array.isArray(data.tips) ? data.tips : (Array.isArray(data.improvements) ? data.improvements : []),
          improvedSample: data.improvedSample || data.improvedSampleAnswer || data.improved_answer || '',
        }
        
        // Save evaluation for this question (overwrite only if re-evaluating)
        // Preserve existing savedAnswer if it exists
        setWritingEvaluations(prev => ({
          ...prev,
          [currentQuestionIndex]: {
            ...newEvaluation,
            savedAnswer: prev[currentQuestionIndex]?.savedAnswer, // Preserve existing saved answer if any
          },
        }))

        // Legacy EvaluationData for backward compatibility
        const evaluation: EvaluationData = {
          overallScore: newEvaluation.score,
          perCategory: {
            Clarity: newEvaluation.clarity,
            Relevance: newEvaluation.relevance,
            Structure: newEvaluation.structure,
            ProfessionalTone: newEvaluation.professionalTone,
            Conciseness: newEvaluation.examplesImpact,
          },
          strengths: newEvaluation.strengths,
          weaknesses: newEvaluation.weaknesses,
          improvements: newEvaluation.tips,
          improvedSampleAnswer: newEvaluation.improvedSample,
          shortTip: newEvaluation.tips.length > 0 ? newEvaluation.tips[0] : 'Focus on clarity and providing specific examples.',
          // Legacy fields
          score: newEvaluation.score,
          improved_answer: newEvaluation.improvedSample,
          rewrite_in_user_tone: '',
        }
        
        setEvaluationData(evaluation)

        // Store score for this question
        setWritingScores(prev => ({
          ...prev,
          [currentQuestionIndex]: newEvaluation.score,
        }))
        
        // Store per-category scores for this question
        setWritingCategoryScores(prev => ({
          ...prev,
          [currentQuestionIndex]: evaluation.perCategory,
        }))

        // Update AI Coach Notes - only for current question
        const topWeakness = newEvaluation.weaknesses && newEvaluation.weaknesses.length > 0 ? newEvaluation.weaknesses[0] : undefined
        const topTip = newEvaluation.tips && newEvaluation.tips.length > 0 ? newEvaluation.tips[0] : undefined
        
        setAiCoachNotes(prev => {
          // Remove old note for this question if exists, then add new one
          const filtered = prev.filter(note => note.questionIndex !== currentQuestionIndex)
          return [
            {
              questionIndex: currentQuestionIndex,
              tip: topTip || 'Evaluate your answer to see tips here.',
              weakness: topWeakness,
              improvement: undefined,
            },
            ...filtered,
          ]
        })

        // Mark evaluation as complete for this question
        setHasEvaluatedCurrent(true)

        // Auto-generate improved answer after evaluation
        if (data.improvedSample) {
          setImprovedAnswer(data.improvedSample)
          setWhyBetter(Array.isArray(data.whyBetter) ? data.whyBetter : [])
        }
      } else {
        alert('Failed to evaluate. Please try again.')
      }
    } catch (error) {
      console.error('Evaluation error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsEvaluating(false)
    }
  }

  // Handle Improve Sample Answer (can be called manually or auto-generated after Evaluate)
  const handleImproveAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please write an answer before improving.')
      return
    }

    setIsImproving(true)
    try {
      const currentQuestion = interviewQuestions[currentQuestionIndex]
      const questionText = typeof currentQuestion === 'string' ? currentQuestion : String(currentQuestion || '')
      const finalJobTitle = getFinalJobTitle()
      const finalCompany = getFinalCompany()

      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAnswer: userAnswer,
          jobTitle: finalJobTitle,
          company: finalCompany,
          question: questionText,
        }),
      })

      const data = await response.json()
      const limitMsg = messageFromAiLimitPayload(data, response.status)
      if (limitMsg) {
        alert(limitMsg)
        return
      }
      
      if (data.ok && data.improvedSample) {
        setImprovedAnswer(data.improvedSample)
        setWhyBetter(Array.isArray(data.whyBetter) ? data.whyBetter : [])
      } else {
        alert('Failed to generate improved answer. Please try again.')
      }
    } catch (error) {
      console.error('Improve answer error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsImproving(false)
    }
  }

  // Handle Use This Answer button
  const handleUseImprovedAnswer = () => {
    if (!improvedAnswer.trim()) return
    
    // Mark as programmatic change to skip debounced auto-evaluation
    isProgrammaticChangeRef.current = true
    setUserAnswer(improvedAnswer)
    
    // Automatically trigger evaluation with the improved answer (immediate, not debounced)
    // Use setTimeout to ensure state update completes first
    setTimeout(() => {
      handleEvaluate(improvedAnswer)
      // Reset flag after a short delay
      setTimeout(() => {
        isProgrammaticChangeRef.current = false
      }, 100)
    }, 0)
    showToast('success', 'Inserted into Your Answer. Evaluating...')
  }

  // Handle Save & Next
  const handleSaveAndNext = async () => {
    if (!userAnswer.trim()) {
      alert('Please write an answer before saving.')
      return
    }

    if (guest.isGuest) {
      const usage = readGuestUsage('interview')
      if ((usage.questionsAnswered ?? 0) >= GUEST_LIMITS.interviewPracticeQuestions) {
        guest.promptForAuth('fullAccess')
        return
      }

      setSavedWritingAnswers((prev) => [...prev, userAnswer])
      setWritingEvaluations((prev) => {
        const existingEval = prev[currentQuestionIndex] || {}
        return {
          ...prev,
          [currentQuestionIndex]: {
            ...existingEval,
            savedAnswer: userAnswer,
          },
        }
      })
      incrementGuestUsage('interview', 'questionsAnswered')
      writeGuestDraft('interview', {
        userAnswer,
        currentQuestionIndex,
        writingEvaluations,
        savedWritingAnswers: [...savedWritingAnswers, userAnswer],
        savedAt: Date.now(),
      })
      guest.promptForAuth('fullAccess')
      return
    }

    setIsSaving(true)
    try {
      // Save to Supabase
      const currentQuestion = interviewQuestions[currentQuestionIndex]
      const questionText = typeof currentQuestion === 'string' ? currentQuestion : String(currentQuestion || '')
      const saveRes = await fetch('/api/interview/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user', // Static for now
          question: questionText,
          answer: userAnswer,
          score: evaluationData?.overallScore || evaluationData?.score || null,
          strengths: evaluationData?.strengths || [],
          weaknesses: evaluationData?.weaknesses || [],
          improved_answer: evaluationData?.improvedSampleAnswer || evaluationData?.improved_answer || '',
        }),
      })
      if (saveRes.ok) {
        const score = evaluationData?.overallScore || evaluationData?.score || null
        const isLastQuestion = currentQuestionIndex === interviewQuestions.length - 1
        void import('@/lib/jobaz-ai/interviewCoachSignals').then(
          ({ emitInterviewQuestionAnswered, emitInterviewCompleted }) => {
            emitInterviewQuestionAnswered({
              mode: 'writing',
              questionIndex: currentQuestionIndex,
              score,
            })
            if (isLastQuestion) {
              emitInterviewCompleted({
                mode: 'writing',
                score,
                questionsCompleted: interviewQuestions.length,
              })
            }
          }
        )
      }

      // Track saved answer for unlock logic
      setSavedWritingAnswers(prev => [...prev, userAnswer])

      // Store the saved answer in writingEvaluations for this question
      setWritingEvaluations(prev => {
        const existingEval = prev[currentQuestionIndex] || {}
        return {
          ...prev,
          [currentQuestionIndex]: {
            ...existingEval,
            savedAnswer: userAnswer, // Store the user's saved answer
          },
        }
      })

      // Check if this is the last question
      const isLastQuestion = currentQuestionIndex === interviewQuestions.length - 1

      if (isLastQuestion) {
        // Mark Writing Training as completed
        setWritingCompleted(true)
      }
      
      // Calculate writing progress based on number of saved answers
      const totalQuestions = interviewQuestions.length || 8
      const newWritingProgress = Math.min(((savedWritingAnswers.length + 1) / totalQuestions) * 100, 100)
      
      // Update progress
      setProgress(prev => ({
        ...prev,
        writing: newWritingProgress,
      }))
      
      if (!isLastQuestion) {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }

      // Reset states
      setSelectedAnswer(null)
      setUserAnswer('')
      setEvaluationData(null)
      setShowImprovedAnswer(false)
      // Clear improved answer feature state when moving to next question
      setImprovedAnswer('')
      setWhyBetter([])
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to generate questions and store in coreQuestions
  const generateCoreQuestions = async (finalJobTitle: string, finalCompany: string): Promise<string[]> => {
    if (!finalJobTitle) {
      return []
    }

    try {
      const response = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobType: finalJobTitle,
          jobTitle: finalJobTitle,
          company: finalCompany,
        }),
      })

      const data = await response.json()

      if (data.ok && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        return normalizeQuestions(data.questions)
      } else {
        // Fallback to client-side generation
        return generateJobSpecificQuestions(finalJobTitle, finalCompany)
      }
    } catch (error) {
      console.error('Error generating core questions:', error)
      // Fallback to client-side generation
      return generateJobSpecificQuestions(finalJobTitle, finalCompany)
    }
  }

  // Load evaluation data when switching to a question that already has an evaluation
  useEffect(() => {
    // Cancel any pending debounced evaluation when switching questions
    if (evaluationDebounceRef.current) {
      clearTimeout(evaluationDebounceRef.current)
      evaluationDebounceRef.current = null
    }

    const existingEval = writingEvaluations[currentQuestionIndex]
    if (existingEval) {
      // Sync evaluationData for backward compatibility
      setEvaluationData({
        overallScore: existingEval.score,
        perCategory: {
          Clarity: existingEval.clarity,
          Relevance: existingEval.relevance,
          Structure: existingEval.structure,
          ProfessionalTone: existingEval.professionalTone,
          Conciseness: existingEval.examplesImpact,
        },
        strengths: existingEval.strengths,
        weaknesses: existingEval.weaknesses,
        improvements: existingEval.tips,
        improvedSampleAnswer: existingEval.improvedSample,
        shortTip: existingEval.tips.length > 0 ? existingEval.tips[0] : 'Focus on clarity and providing specific examples.',
        score: existingEval.score,
        improved_answer: existingEval.improvedSample,
        rewrite_in_user_tone: '',
      })
    } else {
      // Clear evaluation data if no evaluation exists for this question
      setEvaluationData(null)
    }
  }, [currentQuestionIndex, writingEvaluations])

  // Auto re-evaluation: debounced evaluation when user edits Your Answer manually
  useEffect(() => {
    // Skip if this is a programmatic change (e.g., from "Use this answer")
    if (isProgrammaticChangeRef.current) {
      return
    }

    // Only auto-evaluate if:
    // 1. We're in writing training tab
    // 2. There's already an evaluation for the current question (to avoid evaluating empty text)
    // 3. The answer has content
    if (activeTab !== 'writing') return
    if (!writingEvaluations[currentQuestionIndex]?.score) return
    if (!userAnswer.trim()) return

    // Clear existing debounce timer
    if (evaluationDebounceRef.current) {
      clearTimeout(evaluationDebounceRef.current)
    }

    // Set up new debounce timer (1000ms = 1 second, within 800-1200ms range)
    evaluationDebounceRef.current = setTimeout(() => {
      // Generate new request ID for this evaluation
      const requestId = ++evaluationRequestIdRef.current
      handleEvaluate(userAnswer, requestId)
    }, 1000)

    // Cleanup: cancel pending evaluation if component unmounts or dependencies change
    return () => {
      if (evaluationDebounceRef.current) {
        clearTimeout(evaluationDebounceRef.current)
        evaluationDebounceRef.current = null
      }
    }
    // Note: handleEvaluate is stable enough - it doesn't change between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAnswer, currentQuestionIndex, activeTab])

  // Load job information from localStorage on mount
  useEffect(() => {
    const jobInfo = getJobInfo()
    if (jobInfo) {
      // Auto-populate jobContext with the job context for API calls
      const jobContextFromStore = getJobContextForAPI(jobInfo)
      if (jobContextFromStore && !jobContext.jobTitle && !jobContext.manualJobTitle) {
        setJobContext(prev => ({
          ...prev,
          manualJobTitle: jobContextFromStore,
        }))
      }
    }
  }, [])

  // Load voice questions when voice tab is active
  useEffect(() => {
    if (activeTab === 'voice') {
      loadVoiceQuestions()
    }
  }, [activeTab])

  useEffect(() => {
    if (interviewStartedModesRef.current.has(activeTab)) return
    interviewStartedModesRef.current.add(activeTab)
    void import('@/lib/jobaz-ai/interviewCoachSignals').then(({ emitInterviewStarted }) =>
      emitInterviewStarted(activeTab)
    )
  }, [activeTab])

  useEffect(() => {
    if (!interviewSimulationFinished || mockInterviewSignalRef.current) return
    mockInterviewSignalRef.current = true
    void import('@/lib/jobaz-ai/interviewCoachSignals').then(({ emitMockInterviewCompleted }) =>
      emitMockInterviewCompleted({ score: interviewSimulationScore })
    )
  }, [interviewSimulationFinished, interviewSimulationScore])

  // Update voice questions' answers when writingEvaluations changes (if voice tab is active and questions are loaded)
  useEffect(() => {
    if (activeTab === 'voice' && voiceQuestions.length > 0 && coreQuestions.length > 0) {
      // Update answers in existing voice questions based on latest writingEvaluations
      setVoiceQuestions(prev => prev.map((vq, index) => {
        const savedEvaluation = writingEvaluations[index]
        const savedAnswer = savedEvaluation?.savedAnswer || ''
        return {
          ...vq,
          answer: savedAnswer, // Update with latest saved answer
        }
      }))
    }
  }, [writingEvaluations, activeTab, coreQuestions.length])

  // Load Hard Mode questions when hard tab is active
  useEffect(() => {
    if (activeTab === 'hard') {
      loadHardModeQuestions()
    }
  }, [activeTab])

  // Update Hard Mode questions' target answers when writingEvaluations changes (if hard tab is active and questions are loaded)
  // This ensures Hard Mode always shows the latest saved answer from Writing Training (live updates)
  useEffect(() => {
    if (activeTab === 'hard' && hardModeQuestions.length > 0) {
      // Update target answers in existing Hard Mode questions based on latest writingEvaluations
      setHardModeQuestions(prev => prev.map((hmq, index) => {
        const savedEvaluation = writingEvaluations[index]
        const savedAnswer = savedEvaluation?.savedAnswer || ''
        return {
          ...hmq,
          targetAnswer: savedAnswer, // Update with latest saved answer from Writing Training
        }
      }))
    }
  }, [writingEvaluations, activeTab])

  // Writing mode: Generate questions once when job context is available
  useEffect(() => {
    if (activeTab === 'writing') {
      const finalJobTitle = getFinalJobTitle()
      const finalCompany = getFinalCompany()
      
      // Only generate if we have job context and no core questions yet
      // Check coreQuestions.length inside the effect to avoid dependency issues
      if (finalJobTitle && coreQuestions.length === 0) {
        generateCoreQuestions(finalJobTitle, finalCompany).then((questions) => {
          const normalized = normalizeQuestions(questions)
          if (normalized.length > 0) {
            setCoreQuestions(normalized)
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, jobContext.jobTitle, jobContext.company, jobContext.manualJobTitle, jobContext.selectedJobType])

  // Cleanup timers and streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (hardModeTimerIntervalRef.current) {
        clearInterval(hardModeTimerIntervalRef.current)
      }
      if (hardModeStreamRef.current) {
        hardModeStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (hardModeCountdownIntervalRef.current) {
        clearInterval(hardModeCountdownIntervalRef.current)
      }
      if (simulationTimerIntervalRef.current) {
        clearInterval(simulationTimerIntervalRef.current)
      }
      if (simulationStreamRef.current) {
        simulationStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (simulationCountdownIntervalRef.current) {
        clearInterval(simulationCountdownIntervalRef.current)
      }
      if (simulationSilenceTimerRef.current) {
        clearTimeout(simulationSilenceTimerRef.current)
      }
      if (simulationAudioElementRef.current) {
        simulationAudioElementRef.current.pause()
        simulationAudioElementRef.current = null
      }
    }
  }, [])

  const loadVoiceQuestions = async () => {
    setIsLoadingQuestions(true)
    try {
      const finalJobTitle = getFinalJobTitle()
      const finalCompany = getFinalCompany()
      
      // Use coreQuestions if available, otherwise generate once
      let questionsToUse: string[] = []
      if (coreQuestions.length > 0) {
        questionsToUse = normalizeQuestions(coreQuestions)
      } else if (finalJobTitle) {
        // Generate questions once and store in coreQuestions
        const generated = await generateCoreQuestions(finalJobTitle, finalCompany)
        questionsToUse = normalizeQuestions(generated)
        if (questionsToUse.length > 0) {
          setCoreQuestions(questionsToUse)
        }
      }
      
      if (questionsToUse.length > 0) {
        // Transform to VoiceQuestion format (use all questions from coreQuestions)
        // Pull saved written answers from writingEvaluations for each question index
        const voiceQuestionsToSet: VoiceQuestion[] = questionsToUse.map((q, index) => {
          // Get the saved written answer for this question index from writingEvaluations
          const savedEvaluation = writingEvaluations[index]
          const savedAnswer = savedEvaluation?.savedAnswer || ''
          
          return {
            id: String(index + 1),
            question: q,
            answer: savedAnswer, // Use the saved written answer from Writing Training
          }
        })
        setVoiceQuestions(voiceQuestionsToSet)
        setCurrentVoiceIndex(0)
        setVoiceResult(null)
        setAudioBlob(null)
      } else {
        setVoiceQuestions([])
      }
    } catch (error) {
      console.error('Error loading voice questions:', error)
      setVoiceQuestions([])
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setVoiceResult(null)
      setVoiceErrorMessage(null)

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleVoiceSubmit = async () => {
    if (!audioBlob || !voiceQuestions[currentVoiceIndex]) {
      alert('Please record an answer first.')
      return
    }

    setIsAnalyzing(true)
    setVoiceErrorMessage(null)
    setVoiceResult(null)
    try {
      const result = await evaluateVoiceAnswer({
        audioBlob,
        question: voiceQuestions[currentVoiceIndex].question,
        referenceAnswer: voiceQuestions[currentVoiceIndex].answer,
      })

      const newVoiceResult: VoiceResult = {
        transcript: result.transcript,
        scores: result.scores,
        summary_feedback: result.summary_feedback,
        improvement_tips: result.improvement_tips,
      }
      
      setVoiceResult(newVoiceResult)

      void import('@/lib/jobaz-ai/interviewCoachSignals').then(({ emitInterviewQuestionAnswered }) =>
        emitInterviewQuestionAnswered({
          mode: 'voice',
          questionIndex: currentVoiceIndex,
          score: newVoiceResult.scores?.confidence ?? null,
        })
      )
      
      // Track voice results history and calculate progress
      setVoiceResultsHistory(prev => {
        const updatedHistory = [...prev, newVoiceResult]
        // Calculate voice progress based on number of questions answered
        const totalVoiceQuestions = voiceQuestions.length || 8 // Default to 8 if not loaded yet
        const newProgress = Math.min((updatedHistory.length / totalVoiceQuestions) * 100, 100)
        
        // Check if this is the last question and mark as complete (all 8 questions answered)
        const requiredQuestions = 8 // Voice Training always has 8 questions
        if (updatedHistory.length >= requiredQuestions) {
          setVoiceTrainingCompleted(true)
          void import('@/lib/jobaz-ai/interviewCoachSignals').then(({ emitVoiceTrainingCompleted }) =>
            emitVoiceTrainingCompleted({
              questionsCompleted: requiredQuestions,
              score: newVoiceResult.scores?.confidence ?? null,
            })
          )
        }
        
        // Update progress
        setProgress(prevProgress => ({
          ...prevProgress,
          voice: newProgress,
        }))
        
        return updatedHistory
      })
    } catch (error: any) {
      console.error('Voice training error:', error)
      setVoiceErrorMessage(error.message || 'Voice analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNextVoiceQuestion = () => {
    if (currentVoiceIndex < voiceQuestions.length - 1) {
      voiceTtsIndexRef.current = -1
      setVoiceReadyMessage(null)
      setCurrentVoiceIndex(currentVoiceIndex + 1)
      setVoiceResult(null)
      setAudioBlob(null)
      setRecordingTime(0)
      setVoiceErrorMessage(null)
    }
  }

  // Hard Mode: Load questions with best written answers
  const loadHardModeQuestions = async () => {
    setHardModeIsLoadingQuestions(true)
    try {
      const finalJobTitle = getFinalJobTitle()
      const finalCompany = getFinalCompany()
      
      // Use coreQuestions if available, otherwise generate once
      let questionsToUse: string[] = []
      if (coreQuestions.length > 0) {
        questionsToUse = normalizeQuestions(coreQuestions)
      } else if (finalJobTitle) {
        // Generate questions once and store in coreQuestions
        const generated = await generateCoreQuestions(finalJobTitle, finalCompany)
        questionsToUse = normalizeQuestions(generated)
        if (questionsToUse.length > 0) {
          setCoreQuestions(questionsToUse)
        }
      }
      
      if (questionsToUse.length > 0) {
        // Use the SAME source as Voice Training: writingEvaluations[index].savedAnswer
        // This ensures Hard Mode always shows the exact same final answer from Writing Training
        const questionsWithAnswers: HardModeQuestion[] = questionsToUse.map((q, index) => {
          // Get the saved written answer for this question index from writingEvaluations
          const savedEvaluation = writingEvaluations[index]
          const savedAnswer = savedEvaluation?.savedAnswer || ''
          
          return {
            question: q,
            targetAnswer: savedAnswer, // Use the saved written answer from Writing Training (same as Voice Training)
          }
        })
        setHardModeQuestions(questionsWithAnswers)
      } else {
        // Fallback: use interviewQuestions with saved answers from writingEvaluations
        const normalizedInterviewQuestions = normalizeQuestions(interviewQuestions)
        const fallbackQuestions: HardModeQuestion[] = normalizedInterviewQuestions.map((question, index) => {
          const savedEvaluation = writingEvaluations[index]
          const savedAnswer = savedEvaluation?.savedAnswer || ''
          return {
            question,
            targetAnswer: savedAnswer, // Use the saved written answer from Writing Training
          }
        })
        setHardModeQuestions(fallbackQuestions)
      }
      setHardModeIndex(0)
      setHardModeResult(null)
      setHardModeConvertedText('')
      setHardModeAudioBlob(null)
      setHardModeRecordingTime(0)
      setHardModeShowCompletion(false)
    } catch (error) {
      console.error('Error loading Hard Mode questions:', error)
      // Fallback to using interviewQuestions with saved answers from writingEvaluations
      const normalizedInterviewQuestions = normalizeQuestions(interviewQuestions)
      const fallbackQuestions: HardModeQuestion[] = normalizedInterviewQuestions.map((question, index) => {
        const savedEvaluation = writingEvaluations[index]
        const savedAnswer = savedEvaluation?.savedAnswer || ''
        return {
          question,
          targetAnswer: savedAnswer, // Use the saved written answer from Writing Training
        }
      })
      setHardModeQuestions(fallbackQuestions)
    } finally {
      setHardModeIsLoadingQuestions(false)
    }
  }

  // Helper function to start countdown
  const startHardModeCountdown = () => {
    // Start countdown at 3
    let countdownValue = 3
    setHardModeCountdown(countdownValue)
    
    const countdownInterval = setInterval(() => {
      countdownValue -= 1
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval)
        hardModeCountdownIntervalRef.current = null
        setHardModeCountdown(null)
        // Countdown finished, start recording after a brief delay
        setTimeout(() => {
          startHardModeRecording()
        }, 100)
      } else {
        setHardModeCountdown(countdownValue)
      }
    }, 1000)
    
    hardModeCountdownIntervalRef.current = countdownInterval
  }

  // Hard Mode: Start countdown and then recording (no audio playback in Hard Mode)
  const handleHardModePlayQuestion = async () => {
    if (!writingCompleted) {
      alert('Complete Writing Training to unlock Hard Mode.')
      return
    }
    if (hardModeQuestions.length === 0 || !hardModeQuestions[hardModeIndex]) {
      alert('Hard Mode questions are not loaded yet. Please wait.')
      return
    }

    // Clear any existing countdown interval
    if (hardModeCountdownIntervalRef.current) {
      clearInterval(hardModeCountdownIntervalRef.current)
    }

    // Start countdown directly (no audio playback in Hard Mode)
    startHardModeCountdown()
  }

  // Hard Mode: Start recording
  const startHardModeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      hardModeStreamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      hardModeMediaRecorderRef.current = mediaRecorder
      hardModeAudioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          hardModeAudioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(hardModeAudioChunksRef.current, { type: 'audio/webm' })
        setHardModeAudioBlob(audioBlob)
        
        // Stop all tracks
        if (hardModeStreamRef.current) {
          hardModeStreamRef.current.getTracks().forEach(track => track.stop())
          hardModeStreamRef.current = null
        }
      }

      mediaRecorder.start()
      setHardModeIsRecording(true)
      setHardModeRecordingTime(0)
      setHardModeResult(null)
      setHardModeConvertedText('')

      // Start timer
      hardModeTimerIntervalRef.current = setInterval(() => {
        setHardModeRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting Hard Mode recording:', error)
      showToast('error', 'Failed to access microphone. Please check your permissions.')
    }
  }

  // Hard Mode: Stop recording
  const stopHardModeRecording = () => {
    if (hardModeMediaRecorderRef.current && hardModeIsRecording) {
      hardModeMediaRecorderRef.current.stop()
      setHardModeIsRecording(false)
      
      if (hardModeTimerIntervalRef.current) {
        clearInterval(hardModeTimerIntervalRef.current)
        hardModeTimerIntervalRef.current = null
      }
    }
  }

  // Hard Mode: Transcribe audio and get evaluation
  const handleHardModeSubmit = async () => {
    if (!hardModeAudioBlob || !hardModeQuestions[hardModeIndex]) {
      showToast('error', 'Please record an answer first.')
      return
    }

    setHardModeIsTranscribing(true)
    try {
      // First, transcribe the audio to text using the same API as Voice Training
      const formData = new FormData()
      formData.append('audio', hardModeAudioBlob, 'recording.webm')
      formData.append('question', hardModeQuestions[hardModeIndex].question)
      formData.append('reference_answer', hardModeQuestions[hardModeIndex].targetAnswer)

      // Use voice-train API to transcribe (we only need the transcript)
      const transcriptionResponse = await fetch('/api/interview/voice-train', {
        method: 'POST',
        body: formData,
      })

      const transcriptionData = await transcriptionResponse.json()
      
      if (!transcriptionData.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const convertedText = transcriptionData.transcript || ''

      // Now call Hard Mode evaluation API
      setHardModeIsTranscribing(false)
      setHardModeLoading(true)

      const evalResponse = await fetch('/api/interview/hard-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: hardModeQuestions[hardModeIndex].question,
          userAnswer: convertedText,
          targetAnswer: hardModeQuestions[hardModeIndex].targetAnswer,
          jobTitle: getFinalJobTitle(),
          company: getFinalCompany(),
        }),
      })

      const evalData = await evalResponse.json()

      if (evalData.ok) {
        const newHardModeResult: HardModeResult = {
          convertedText: evalData.convertedText || convertedText,
          accuracy: evalData.accuracy,
          memoryRetention: evalData.memoryRetention,
          logic: evalData.logic,
          stability: evalData.stability,
          tone: evalData.tone,
          completeness: evalData.completeness,
          examplesClarity: evalData.examplesClarity,
          structure: evalData.structure,
          summaryFeedback: evalData.summaryFeedback,
          improvementTips: evalData.improvementTips || [],
        }
        
        setHardModeResult(newHardModeResult)
        setHardModeConvertedText(evalData.convertedText || convertedText)
        
        // Track hard mode results history and calculate progress
        setHardModeResultsHistory(prev => {
          const updatedHistory = [...prev, newHardModeResult]
          // Calculate hard mode progress based on number of questions answered
          const totalHardModeQuestions = hardModeQuestions.length || 3 // Default to 3 if not loaded yet
          const newHardProgress = Math.min((updatedHistory.length / totalHardModeQuestions) * 100, 100)
          
          // Update progress
          setProgress(prevProgress => ({
            ...prevProgress,
            hard: newHardProgress,
          }))
          
          return updatedHistory
        })
      } else {
        showToast('error', 'Hard Mode evaluation failed. Please try again.')
      }
    } catch (error) {
      console.error('Hard Mode submission error:', error)
      showToast('error', 'An error occurred. Please try again.')
    } finally {
      setHardModeIsTranscribing(false)
      setHardModeLoading(false)
    }
  }

  // Hard Mode: Next question
  const handleNextHardModeQuestion = () => {
    if (hardModeQuestions.length === 0) return
    
    // Check if we're on question 8 (index 7) and have completed it
    // If so, show completion screen instead of moving to next question
    if (hardModeIndex === 7 && hardModeResultsHistory.length >= 8) {
      setHardModeShowCompletion(true)
      return
    }
    
    // Stop any currently playing audio
    stopQuestionAudio()
    
    // Clear any existing countdown interval
    if (hardModeCountdownIntervalRef.current) {
      clearInterval(hardModeCountdownIntervalRef.current)
      hardModeCountdownIntervalRef.current = null
    }
    
    const nextIndex = (hardModeIndex + 1) % hardModeQuestions.length
    setHardModeIndex(nextIndex)
    setHardModeResult(null)
    setHardModeConvertedText('')
    setHardModeAudioBlob(null)
    setHardModeRecordingTime(0)
    setHardModeCountdown(null)
  }


  // ============================================
  // Level 3 - Memory Mode Handlers
  // ============================================
  // Memory Mode allows users to answer multiple questions consecutively
  // without feedback after each question, then receive a comprehensive
  // evaluation at the end covering memory retention, clarity, and confidence.
  
  // Level 3 - Memory Mode: Start Memory Session
  const handleStartMemorySession = async () => {
    const finalJobTitle = getFinalJobTitle()
    const finalCompany = getFinalCompany()
    
    // Use coreQuestions if available, otherwise generate once
    let questionsToUse: string[] = []
    if (coreQuestions.length > 0) {
      questionsToUse = normalizeQuestions(coreQuestions)
    } else if (finalJobTitle) {
      // Generate questions once and store in coreQuestions
      const generated = await generateCoreQuestions(finalJobTitle, finalCompany)
      questionsToUse = normalizeQuestions(generated)
      if (questionsToUse.length > 0) {
        setCoreQuestions(questionsToUse)
      }
    } else {
      // Fallback to interviewQuestions
      questionsToUse = normalizeQuestions(interviewQuestions)
    }
    
    // Use first 3 questions
    const memoryQuestionsToSet = questionsToUse.slice(0, 3).map((q) => ({
      question: q,
      idealAnswer: undefined,
    }))
    
    setMemoryQuestions(memoryQuestionsToSet)
    setMemoryAnswers([])
    setCurrentMemoryQuestionIndex(0)
    setIsMemorySessionActive(true)
    setIsMemorySessionFinished(false)
    setMemoryEvaluationResult(null)
    setCurrentMemoryAnswer('')
  }

  // Level 3 - Memory Mode: Handle Next Question
  const handleMemoryNextQuestion = () => {
    if (!currentMemoryAnswer.trim()) {
      alert('Please enter an answer before proceeding.')
      return
    }

    // Save current answer
    const newAnswers = [...memoryAnswers]
    newAnswers[currentMemoryQuestionIndex] = { answer: currentMemoryAnswer }
    setMemoryAnswers(newAnswers)

    // Check if this was the last question
    if (currentMemoryQuestionIndex < memoryQuestions.length - 1) {
      // Move to next question
      setCurrentMemoryQuestionIndex(currentMemoryQuestionIndex + 1)
      setCurrentMemoryAnswer('')
    } else {
      // Last question completed, finish session and trigger evaluation
      setIsMemorySessionFinished(true)
      // Use newAnswers which already includes the current answer at the correct index
      handleMemoryEvaluateSession(newAnswers)
    }
  }

  // Level 3 - Memory Mode: Evaluate entire session
  const handleMemoryEvaluateSession = async (allAnswers: MemoryAnswer[] = memoryAnswers) => {
    if (allAnswers.length !== memoryQuestions.length) {
      alert('Please answer all questions before evaluating.')
      return
    }

    setIsMemoryEvaluating(true)
    try {
      const response = await fetch('/api/interview/memory-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: memoryQuestions.map((q) => {
            const question = typeof q === 'string' ? q : (q?.question || '')
            return question
          }),
          answers: allAnswers.map((a) => a.answer),
          jobTitle: getFinalJobTitle(),
          company: getFinalCompany(),
        }),
      })

      const data = await response.json()
      const limitMsg = messageFromAiLimitPayload(data, response.status)
      if (limitMsg) {
        alert(limitMsg)
        return
      }

      if (data.ok) {
        setMemoryEvaluationResult({
          memoryScore: data.memoryScore || 0,
          clarityScore: data.clarityScore || 0,
          confidenceScore: data.confidenceScore || 0,
          summary: data.summary || '',
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          missedPoints: data.missedPoints || [],
        })
        void import('@/lib/jobaz-ai/interviewCoachSignals').then(({ emitInterviewCompleted }) =>
          emitInterviewCompleted({
            mode: 'memory',
            score: data.confidenceScore ?? null,
            questionsCompleted: allAnswers.length,
            dedupeId: `memory-${new Date().toISOString().slice(0, 10)}`,
          })
        )
      } else {
        throw new Error(data.error || 'Evaluation failed')
      }
    } catch (error: any) {
      console.error('Memory evaluation error:', error)
      alert('Failed to evaluate session. Please try again.')
    } finally {
      setIsMemoryEvaluating(false)
    }
  }

  // Level 3 - Memory Mode: Reset session
  const handleMemoryResetSession = () => {
    setIsMemorySessionActive(false)
    setCurrentMemoryQuestionIndex(0)
    setMemoryQuestions([])
    setMemoryAnswers([])
    setIsMemorySessionFinished(false)
    setMemoryEvaluationResult(null)
    setCurrentMemoryAnswer('')
  }

  // ============================================
  // Job types available for job setup
  const jobTypes = [
    'Customer Service',
    'Sales',
    'Hospitality',
    'IT Support',
    'Admin',
    'Management',
    'Retail',
    'Warehouse',
    'Healthcare',
    'Marketing',
    'Other',
  ]

  // ============================================
  // Simulation Mode Functions (VOICE-BASED FULL INTERVIEW)
  // ============================================

  // Start simulation: Load 8 questions and start countdown
  const handleStartSimulation = async () => {
    const finalJobTitle = getFinalJobTitle()
    const finalCompany = getFinalCompany()
    
    if (!finalJobTitle) {
      alert('Please either enter a job title/description or select a job type to start the simulation.')
      return
    }

    try {
      // Use coreQuestions if available, otherwise generate once
      let questionsToUse: string[] = []
      if (coreQuestions.length > 0) {
        questionsToUse = normalizeQuestions(coreQuestions)
      } else {
        const generated = await generateCoreQuestions(finalJobTitle, finalCompany)
        questionsToUse = normalizeQuestions(generated)
        if (questionsToUse.length > 0) {
          setCoreQuestions(questionsToUse)
        }
      }

      if (questionsToUse.length > 0) {
        // Use all 8 questions (same as Writing/Voice/Hard Mode)
        const simulationQuestionsToSet = questionsToUse.slice(0, 8)
        setSimulationQuestions(simulationQuestionsToSet)
        setSimulationCurrentIndex(0)
        setSimulationSpokenAnswers([])
        setSimulationEvaluations([])
        setSimulationFinalScore(null)
        setIsSimulationActive(true)
        setIsSimulationFinished(false)
        setSimulationCurrentSpokenAnswer('')
        setSimulationAudioBlob(null)
        setSimulationIsRecording(false)
        setSimulationRecordingTime(0)
        setSimulationIsPlayingAudio(false)
        
        // Start countdown
        startSimulationCountdown()
      } else {
        throw new Error('Failed to generate questions')
      }
    } catch (error: any) {
      console.error('Error starting simulation:', error)
      alert('Failed to start simulation. Please try again.')
    }
  }

  // Start countdown (3, 2, 1)
  const startSimulationCountdown = () => {
    if (simulationCountdownIntervalRef.current) {
      clearInterval(simulationCountdownIntervalRef.current)
    }

    let countdownValue = 3
    setSimulationCountdown(countdownValue)

    const countdownInterval = setInterval(() => {
      countdownValue -= 1

      if (countdownValue <= 0) {
        clearInterval(countdownInterval)
        simulationCountdownIntervalRef.current = null
        setSimulationCountdown(null)
        // Countdown finished, start playing question audio
        setTimeout(() => {
          playSimulationQuestionAudio()
        }, 100)
      } else {
        setSimulationCountdown(countdownValue)
      }
    }, 1000)

    simulationCountdownIntervalRef.current = countdownInterval
  }

  // Play question audio using TTS
  const playSimulationQuestionAudio = async () => {
    if (simulationCurrentIndex >= simulationQuestions.length) return

    // Guard: Prevent duplicate calls - if already playing, return early
    if (simulationIsPlayingAudio) {
      console.log('[Interview Simulation] Already playing question audio, skipping duplicate call')
      return
    }

    const currentQuestion = simulationQuestions[simulationCurrentIndex]
    if (!currentQuestion) {
      // No question available, start recording
      setTimeout(() => {
        startSimulationRecording()
      }, 500)
      return
    }

    setSimulationIsPlayingAudio(true)

    // Play question audio using TTS
    await playQuestionWithTts(
      currentQuestion,
      'simulation',
      () => {
        // Audio finished, automatically start recording
        setSimulationIsPlayingAudio(false)
        setTimeout(() => {
          startSimulationRecording()
        }, 500)
      },
      () => {
        // Audio failed, skip audio and go straight to recording
        setSimulationIsPlayingAudio(false)
        setTimeout(() => {
          startSimulationRecording()
        }, 500)
      }
    )
  }

  // Start recording user's answer
  const startSimulationRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      simulationStreamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      simulationMediaRecorderRef.current = mediaRecorder
      simulationAudioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          simulationAudioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(simulationAudioChunksRef.current, { type: 'audio/webm' })
        setSimulationAudioBlob(audioBlob)
        
        if (simulationStreamRef.current) {
          simulationStreamRef.current.getTracks().forEach(track => track.stop())
          simulationStreamRef.current = null
        }
      }

      mediaRecorder.start()
      setSimulationIsRecording(true)
      setSimulationRecordingTime(0)
      setSimulationCurrentSpokenAnswer('')

      // Start timer
      simulationTimerIntervalRef.current = setInterval(() => {
        setSimulationRecordingTime((prev) => prev + 1)
      }, 1000)

      // Start recording timeout (60 seconds)
      startRecordingTimeout()
    } catch (error) {
      console.error('Error starting simulation recording:', error)
      alert('Failed to access microphone. Please check your permissions.')
    }
  }

  // Recording timeout - auto-stop after 60 seconds
  const startRecordingTimeout = () => {
    // Clear any existing timeout
    if (simulationSilenceTimerRef.current) {
      clearTimeout(simulationSilenceTimerRef.current)
    }

    // Set timer for 60 seconds before auto-stopping
    simulationSilenceTimerRef.current = setTimeout(() => {
      if (simulationIsRecording) {
        stopSimulationRecording()
      }
    }, 60000) // 60 seconds timeout
  }

  // Stop recording (manual or silence detection)
  const stopSimulationRecording = () => {
    if (simulationMediaRecorderRef.current && simulationIsRecording) {
      simulationMediaRecorderRef.current.stop()
      setSimulationIsRecording(false)
      
      if (simulationTimerIntervalRef.current) {
        clearInterval(simulationTimerIntervalRef.current)
        simulationTimerIntervalRef.current = null
      }

      if (simulationSilenceTimerRef.current) {
        clearTimeout(simulationSilenceTimerRef.current)
        simulationSilenceTimerRef.current = null
      }

      // Automatically transcribe and proceed
      setTimeout(() => {
        handleSimulationTranscribeAndProceed()
      }, 500)
    }
  }

  // Transcribe audio and proceed to next question
  const handleSimulationTranscribeAndProceed = async () => {
    if (!simulationAudioBlob || simulationCurrentIndex >= simulationQuestions.length) return

    setSimulationIsTranscribing(true)
    try {
      // Transcribe audio using Whisper (simulation-transcribe API)
      const formData = new FormData()
      formData.append('audio', simulationAudioBlob, 'recording.webm')

      const transcriptionResponse = await fetch('/api/simulation-transcribe', {
        method: 'POST',
        body: formData,
      })

      const transcriptionData = await transcriptionResponse.json()
      
      if (!transcriptionData.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const convertedText = transcriptionData.transcript || ''
      setSimulationCurrentSpokenAnswer(convertedText)

      // Save spoken answer
      const newSpokenAnswers = [...simulationSpokenAnswers]
      newSpokenAnswers[simulationCurrentIndex] = convertedText
      setSimulationSpokenAnswers(newSpokenAnswers)

      // Check if this was the last question
      if (simulationCurrentIndex < simulationQuestions.length - 1) {
        // Move to next question automatically
        setSimulationCurrentIndex(simulationCurrentIndex + 1)
        setSimulationAudioBlob(null)
        setSimulationRecordingTime(0)
        setSimulationCurrentSpokenAnswer('')
        
        // Play next question audio
        setTimeout(() => {
          playSimulationQuestionAudio()
        }, 1000)
      } else {
        // All questions completed, calculate final score and finish
        calculateSimulationFinalScore()
        setIsSimulationFinished(true)
      }
    } catch (error) {
      console.error('Simulation transcription error:', error)
      alert('Failed to transcribe audio. Please try again.')
    } finally {
      setSimulationIsTranscribing(false)
    }
  }

  // Calculate final simulation score (simple length-based normalization)
  const calculateSimulationFinalScore = () => {
    if (simulationSpokenAnswers.length === 0) {
      setSimulationFinalScore(0)
      return
    }

    // Simple scoring: normalize answer lengths (0-10 scale)
    // Assume average good answer is ~200 characters, max is ~500
    const scores = simulationSpokenAnswers.map(answer => {
      const length = answer.trim().length
      // Normalize: 0 chars = 0, 200 chars = 8, 500+ chars = 10
      const normalized = Math.min(10, (length / 200) * 8)
      return Math.max(0, normalized)
    })

    const finalAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length
    setSimulationFinalScore(finalAverage)

    // Update progress
    setProgress(prev => ({
      ...prev,
      full: 100,
    }))
  }

  // Reset simulation
  const handleSimulationReset = () => {
    setIsSimulationActive(false)
    setSimulationCurrentIndex(0)
    setSimulationQuestions([])
    setSimulationSpokenAnswers([])
    setSimulationEvaluations([])
    setIsSimulationFinished(false)
    setSimulationFinalScore(null)
    setSimulationCurrentSpokenAnswer('')
    setSimulationAudioBlob(null)
    setSimulationIsRecording(false)
    setSimulationRecordingTime(0)
    setSimulationCountdown(null)
    setSimulationIsPlayingAudio(false)
    
    // Clean up refs
    if (simulationCountdownIntervalRef.current) {
      clearInterval(simulationCountdownIntervalRef.current)
      simulationCountdownIntervalRef.current = null
    }
    if (simulationTimerIntervalRef.current) {
      clearInterval(simulationTimerIntervalRef.current)
      simulationTimerIntervalRef.current = null
    }
    if (simulationSilenceTimerRef.current) {
      clearTimeout(simulationSilenceTimerRef.current)
      simulationSilenceTimerRef.current = null
    }
    if (simulationAudioElementRef.current) {
      simulationAudioElementRef.current.pause()
      simulationAudioElementRef.current = null
    }
    if (simulationStreamRef.current) {
      simulationStreamRef.current.getTracks().forEach(track => track.stop())
      simulationStreamRef.current = null
    }
  }

  // Handle tab change
  const handleTabChange = (tab: TrainingLevel) => {
    if (guest.isGuest && tab !== 'writing') {
      guest.promptForAuth('fullAccess')
      return
    }
    setActiveTab(tab)
  }

  // Handle Writing Training completion actions
  const handleStartVoiceTraining = () => {
    handleTabChange('voice')
  }

  const handleRepeatWritingTraining = () => {
    setWritingCompleted(false)
    setCurrentQuestionIndex(0)
    setVoiceTrainingExplicitlyUnlocked(false)
    // Optionally clear previous answers - keeping them for now as per requirements
    // Reset states for fresh start
    setSelectedAnswer(null)
    setUserAnswer('')
    setEvaluationData(null)
    setShowImprovedAnswer(false)
    setHasEvaluatedCurrent(false)
    // Clear improved answer feature state
    setImprovedAnswer('')
    setWhyBetter([])
    // Optionally clear scores - keeping them for reference but user can improve
    // setWritingScores({})
    // setWritingCategoryScores({})
  }
  
  const handleContinueToVoiceTraining = () => {
    handleTabChange('voice')
  }

  const handleRepeatVoiceTraining = () => {
    setVoiceTrainingCompleted(false)
    setCurrentVoiceIndex(0)
    setVoiceResultsHistory([])
    setVoiceResult(null)
    setAudioBlob(null)
    setRecordingTime(0)
    setVoiceErrorMessage(null)
  }

  const handleContinueToHardMode = () => {
    handleTabChange('hard')
  }

  const handleContinueToSimulation = () => {
    handleTabChange('interviewSimulation')
  }

  const handleGoToSimulationAnyway = () => {
    handleTabChange('interviewSimulation')
  }

  const handleRepeatHardMode = () => {
    setHardModeIndex(0)
    setHardModeResultsHistory([])
    setHardModeResult(null)
    setHardModeConvertedText('')
    setHardModeAudioBlob(null)
    setHardModeRecordingTime(0)
    setHardModeCountdown(null)
    setHardModeShowCompletion(false)
    setProgress(prevProgress => ({
      ...prevProgress,
      hard: 0,
    }))
  }

  // Derived boolean: Voice Training unlocks when user has at least one non-empty saved writing answer
  const hasWritingAnswer = savedWritingAnswers.some(a => a && a.trim().length > 0)
  
  // Calculate average voice score from history
  const calculateAverageVoiceScore = () => {
    if (voiceResultsHistory.length === 0) return 0
    const totalScore = voiceResultsHistory.reduce((sum, result) => {
      const scores = result.scores
      const avgScore = (
        scores.clarity +
        scores.confidence +
        scores.speed +
        scores.filler_words +
        scores.professional_tone +
        scores.structure
      ) / 6
      return sum + avgScore
    }, 0)
    return totalScore / voiceResultsHistory.length
  }

  // Calculate final Voice Training score (average of 8 Overall Scores, 0-10 scale)
  const calculateFinalVoiceTrainingScore = () => {
    const totalQuestions = 8 // Always use 8 questions for Voice Training
    if (voiceResultsHistory.length < totalQuestions) return 0
    
    // Get the first 8 results (one per question)
    const resultsForAllQuestions = voiceResultsHistory.slice(0, totalQuestions)
    
    // Calculate overall score for each question (average of 6 scores)
    const overallScores = resultsForAllQuestions.map(result => {
      const scores = result.scores
      return (
        scores.clarity +
        scores.confidence +
        scores.speed +
        scores.filler_words +
        scores.professional_tone +
        scores.structure
      ) / 6
    })
    
    // Calculate average of all 8 overall scores
    const sum = overallScores.reduce((acc, score) => acc + score, 0)
    return sum / overallScores.length
  }

  // Check if Voice Training is complete (all 8 questions have at least one evaluation)
  const isVoiceTrainingComplete = () => {
    const totalQuestions = 8 // Always use 8 questions for Voice Training
    return voiceResultsHistory.length >= totalQuestions
  }

  // Calculate final Hard Mode score (average of 8 Overall Hard Mode Evaluation scores, 0-10 scale)
  const calculateFinalHardModeScore = () => {
    const totalQuestions = 8 // Hard Mode always has 8 questions
    if (hardModeResultsHistory.length < totalQuestions) return 0
    
    // Get the first 8 results (one per question)
    const resultsForAllQuestions = hardModeResultsHistory.slice(0, totalQuestions)
    
    // Calculate overall score for each question (average of 8 scores)
    const overallScores = resultsForAllQuestions.map(result => {
      return (
        result.accuracy +
        result.memoryRetention +
        result.logic +
        result.stability +
        result.tone +
        result.completeness +
        result.examplesClarity +
        result.structure
      ) / 8
    })
    
    // Calculate average of all 8 overall scores
    const sum = overallScores.reduce((acc, score) => acc + score, 0)
    return sum / overallScores.length
  }

  // Check if Hard Mode is complete (all 8 questions have at least one evaluation)
  const isHardModeComplete = () => {
    const totalQuestions = 8 // Hard Mode always has 8 questions
    return hardModeResultsHistory.length >= totalQuestions
  }
  
  // Unlock status flags
  // All modes unlock after Writing Training is completed (having written answers saved)
  const voiceUnlocked = writingCompleted // Voice unlocks after Writing Training is complete
  const voiceUsed = voiceResultsHistory.length > 0
  const averageVoiceScore = calculateAverageVoiceScore()
  const voiceCompleted = voiceUsed && averageVoiceScore >= 80
  const hardModeUnlocked = writingCompleted // Hard Mode unlocks after Writing Training is complete
  const hardModeUsed = hardModeResultsHistory.length > 0
  const hardModeCompleted = hardModeUsed && progress.hard >= 100
  const fullSimulationUnlocked = coreQuestions.length > 0 // Full Simulation unlocks when questions are available (from Writing Training)
  const fullSimulationUsed = isSimulationFinished && simulationFinalScore !== null

  // Helper function to get training subline text
  const getTrainingSubline = () => {
    const jobTitle = getFinalJobTitle()
    const company = getFinalCompany()
    
    if (jobTitle && company) {
      return `Training for: ${jobTitle} @ ${company}`
    } else if (jobTitle) {
      return `Training for: ${jobTitle}`
    } else {
      return 'Training for: Your next interview'
    }
  }

  return (
    <PublicToolLayout
      title="Interview Coach"
      subtitle="Your 4-step professional training system"
      guest={guest}
      maxWidthClass="max-w-[1440px]"
      continueGuestLabel="Continue practicing as guest"
      footer={
        toast ? (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
            <div
              className={cn(
                'rounded-lg px-4 py-3 shadow-lg flex items-center gap-2',
                toast.type === 'success'
                  ? 'bg-green-600/90 text-white'
                  : 'bg-red-600/90 text-white'
              )}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        ) : null
      }
    >

      <InterviewSourceBanner source={interviewSource} />

      <InterviewJourneyProgress
        activeTab={
          (activeTab === 'memory' ? 'hard' : activeTab) as
            | 'writing'
            | 'voice'
            | 'hard'
            | 'interviewSimulation'
        }
        progress={progress}
        overallReadiness={overallInterviewReadiness}
        onTabChange={(tab) => handleTabChange(tab as TrainingLevel)}
      />

      {/* Main Content */}
      <div className="container mx-auto px-3 py-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Main Content - Full Width */}
          <div className="flex-1">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4 min-h-[600px]">
              {/* Level 1: Writing Training */}
              {activeTab === 'writing' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-heading font-semibold mb-3">Writing Training</h2>
                    
                    {/* Completion UI - Show when Writing Training is completed AND all questions are evaluated */}
                    {writingCompleted && Object.keys(writingEvaluations).length === interviewQuestions.length && interviewQuestions.length > 0 ? (
                      <div className="bg-[#0D0D0D] rounded-xl p-4 mb-3 border border-[#9b5cff]/30">
                        <div className="text-center space-y-4">
                          <div className="space-y-1.5">
                            <h3 className="text-lg font-heading font-semibold text-[#9b5cff]">
                              Writing Training Complete
                            </h3>
                            {averageWritingScore < 8 ? (
                              <>
                                <p className="text-gray-300 text-sm">
                                  Your writing answers are not fully ready for Voice Training. We recommend improving some answers before you move on.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                                  <button
                                    onClick={handleRepeatWritingTraining}
                                    data-jaz-action="ic_writing_repeat"
                                    className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                  >
                                    <Edit className="w-5 h-5" />
                                    Repeat Writing Training
                                  </button>
                                  <button
                                    onClick={handleContinueToVoiceTraining}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                  >
                                    <Headphones className="w-5 h-5" />
                                    Continue to Voice Training Anyway
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-gray-300 text-sm">
                                  Writing Training Complete. You've answered all questions and are ready to move to Voice Training.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                                  <button
                                    onClick={handleStartVoiceTraining}
                                    data-jaz-action="ic_voice_start"
                                    className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                  >
                                    <Headphones className="w-5 h-5" />
                                    Start Voice Training
                                  </button>
                                  <button
                                    onClick={handleRepeatWritingTraining}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                  >
                                    <Edit className="w-5 h-5" />
                                    Repeat Writing Training
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Job Setup Panel - Only visible when no URL context */}
                        {!jobContext.jobTitle && !jobContext.company && (
                          <>
                            {/* Collapsed View */}
                            {jobSetupCollapsed ? (
                              <div className="bg-[#0D0D0D] rounded-xl py-2 px-4 mb-2 border border-gray-800">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300">
                                    Job: {getFinalJobTitle() || '(not set yet)'}
                                  </span>
                                  <button
                                    onClick={() => setJobSetupCollapsed(false)}
                                    className="text-xs text-[#9b5cff] hover:text-[#8a4ae8] transition-colors font-medium"
                                  >
                                    Change job
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Expanded View */
                              <div className="bg-[#0D0D0D] rounded-xl py-3 px-4 mb-2 border border-gray-800">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-base font-medium text-gray-300">Job Setup</h3>
                                  <button
                                    onClick={() => setJobSetupCollapsed(true)}
                                    className="px-3 py-1.5 bg-[#9b5cff]/20 hover:bg-[#9b5cff]/30 border border-[#9b5cff]/30 text-[#9b5cff] text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                    Hide job setup
                                  </button>
                                </div>
                                
                                {/* Job Title/Description Input */}
                                <div className="mb-2">
                                  <label className="block text-gray-400 font-medium mb-2 text-sm">
                                    Job title or description (or select a job type below)
                                  </label>
                                  <input
                                    type="text"
                                    value={jobContext.manualJobTitle}
                                    onChange={(e) => setJobContext(prev => ({ ...prev, manualJobTitle: e.target.value }))}
                                    placeholder="Customer Service Advisor at Amazon"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#9b5cff] transition-colors text-sm"
                                  />
                                </div>

                                {/* Job Type Selection */}
                                <div className="mb-2">
                                  <label className="block text-gray-400 font-medium mb-2 text-sm">Select Job Type:</label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                                    {jobTypes.map((jobType) => (
                                      <button
                                        key={jobType}
                                        onClick={() => setJobContext(prev => ({ ...prev, selectedJobType: jobType }))}
                                        className={`px-1.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                                          jobContext.selectedJobType === jobType
                                            ? 'bg-[#9b5cff] text-white border-2 border-[#9b5cff]'
                                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#9b5cff]/50'
                                        }`}
                                      >
                                        {jobType}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                  Enter your exact job title or pick a job type.
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Sticky Question */}
                        <div className="sticky top-[60px] z-30 bg-[#1a1a1a] -mx-4 px-4 pt-3 pb-2 mb-3 border-b border-gray-800">
                          <div className="bg-[#0D0D0D] rounded-xl p-3 mb-2">
                            <p className="text-sm text-gray-300 mb-1 font-medium">Question {currentQuestionIndex + 1} of {interviewQuestions.length}:</p>
                            <p className="text-white text-sm">
                              <TranslatableText text={typeof interviewQuestions[currentQuestionIndex] === 'string' ? interviewQuestions[currentQuestionIndex] : ''}>
                                {typeof interviewQuestions[currentQuestionIndex] === 'string' ? interviewQuestions[currentQuestionIndex] : ''}
                              </TranslatableText>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {!writingCompleted && (
                    <>
                      <div className="space-y-3">
                        <p className="text-gray-400 font-medium text-sm">Suggested Answers:</p>
                        <div className="space-y-2">
                          {getSuggestedAnswers(
                            typeof interviewQuestions[currentQuestionIndex] === 'string' 
                              ? interviewQuestions[currentQuestionIndex] 
                              : String(interviewQuestions[currentQuestionIndex] || ''),
                            getFinalJobTitle(),
                            jobContext.selectedJobType,
                            getFinalCompany()
                          ).map((answer, index) => (
                            <div
                              key={index}
                              onClick={() => handleSuggestedAnswerClick(index)}
                              className={`bg-[#0D0D0D] rounded-lg p-3 border transition-colors cursor-pointer ${
                                selectedAnswer === index
                                  ? 'border-[#9b5cff] border-2'
                                  : 'border-gray-800 hover:border-[#9b5cff]/50'
                              }`}
                            >
                              <p className="text-xs text-gray-300">
                                {answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 font-medium mb-2 text-sm">Your Answer:</label>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => {
                            setUserAnswer(e.target.value)
                            // Do NOT reset evaluation state - Save & Next should remain enabled if evaluation exists
                          }}
                          className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl p-3 text-white min-h-[150px] focus:outline-none focus:border-[#9b5cff] transition-colors resize-none text-sm"
                          placeholder="Write your answer here..."
                        />
                      </div>

                      {/* Evaluate + Save & Next buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleEvaluate()
                          }}
                          disabled={isEvaluating || !userAnswer.trim()}
                          data-jaz-action="ic_writing_evaluate"
                          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg border border-violet-400/70 shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:border-violet-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.7)] transition-all flex items-center gap-2 text-sm font-medium"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Evaluate
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleSaveAndNext}
                          disabled={!writingEvaluations[currentQuestionIndex]?.score || isEvaluating || isSaving || !userAnswer.trim()}
                          data-jaz-action="ic_writing_save_next"
                          className={`px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                            writingEvaluations[currentQuestionIndex]?.score && !isEvaluating && !isSaving && userAnswer.trim()
                              ? "bg-[#9b5cff] hover:bg-[#8a4ae8] text-white"
                              : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                          }`}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save & Next
                            </>
                          )}
                        </button>
                      </div>
                      {!writingEvaluations[currentQuestionIndex]?.score && (
                        <p className="text-xs text-gray-500 mt-1">
                          Evaluate your answer first to unlock Save & Next.
                        </p>
                      )}

                      {/* Improved Sample Answer - New isolated feature */}
                      {hasEvaluatedCurrent && (
                        <div className="mt-4">
                          {improvedAnswer ? (
                            <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#9b5cff]/30">
                              <div className="text-sm text-purple-400 font-medium mb-3">
                                <span>Improved Sample Answer</span>
                              </div>
                              
                              {/* Improved Answer Card */}
                              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 mb-3">
                                <p className="text-xs text-gray-300 whitespace-pre-wrap">{improvedAnswer}</p>
                              </div>

                              {/* Why This Version is Better */}
                              {whyBetter.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-400 font-medium mb-2">Why this version is better:</p>
                                  <ul className="space-y-1.5">
                                    {whyBetter.map((point, index) => (
                                      <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                                        <span className="text-[#9b5cff] mt-0.5">•</span>
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Use This Answer Button */}
                              <button
                                onClick={handleUseImprovedAnswer}
                                className="w-full bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                              >
                                Use this answer
                              </button>
                            </div>
                          ) : (
                            <div className="bg-[#0D0D0D] rounded-xl p-4 border border-gray-800">
                              <button
                                onClick={handleImproveAnswer}
                                disabled={isImproving || !hasEvaluatedCurrent}
                                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg border border-violet-400/70 shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:border-violet-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.7)] transition-all flex items-center justify-center gap-2 text-xs font-medium"
                              >
                                {isImproving ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Generating improved answer...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3" />
                                    AI Improve Sample Answer
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </>
                  )}
                </div>
              )}

              {/* Level 2: Voice Training */}
              {activeTab === 'voice' && (
                <div className="space-y-4">
                  {isLoadingQuestions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#9b5cff]" />
                      <span className="ml-2 text-gray-400">Loading questions...</span>
                    </div>
                  ) : !voiceUnlocked ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg mb-2">
                        Complete Writing Training first to unlock Voice Training.
                      </p>
                      <p className="text-gray-500 text-sm">
                        Save your written answers for all questions to start practicing with voice.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-2xl font-heading font-semibold mb-4">Voice Training</h2>
                        
                        {/* Completion UI - Show when Voice Training is completed */}
                        {voiceTrainingCompleted && isVoiceTrainingComplete() ? (
                          <div className="bg-[#0D0D0D] rounded-xl p-4 mb-3 border border-[#9b5cff]/30">
                            <div className="text-center space-y-4">
                              <div className="space-y-1.5">
                                <h3 className="text-lg font-heading font-semibold text-[#9b5cff]">
                                  Voice Training Complete
                                </h3>
                                {(() => {
                                  const finalScore = calculateFinalVoiceTrainingScore()
                                  const scoreFormatted = finalScore.toFixed(1)
                                  if (finalScore >= 8.0) {
                                    return (
                                      <>
                                        <p className="text-gray-300 text-sm">
                                          Great job! Your average voice score is {scoreFormatted}/10. You're ready to move on to Hard Mode.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                                          <button
                                            onClick={handleContinueToHardMode}
                                            className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                          >
                                            Continue to Hard Mode
                                          </button>
                                        </div>
                                      </>
                                    )
                                  } else {
                                    return (
                                      <>
                                        <p className="text-gray-300 text-sm">
                                          Your average voice score is {scoreFormatted}/10. We recommend repeating Voice Training to improve your performance before moving to Hard Mode.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                                          <button
                                            onClick={handleRepeatVoiceTraining}
                                            className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                          >
                                            Repeat Voice Training
                                          </button>
                                          <button
                                            onClick={handleContinueToHardMode}
                                            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                          >
                                            Go to Hard Mode Anyway
                                          </button>
                                        </div>
                                      </>
                                    )
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-[#0D0D0D] rounded-xl p-6 mb-4">
                              <p className="text-lg text-gray-300 mb-2 font-medium">
                                Question {currentVoiceIndex + 1} of {voiceQuestions.length}:
                              </p>
                              {getFinalJobTitle() && getFinalCompany() && (
                                <p className="text-[#9b5cff] mb-3 font-medium italic">
                                  Answer this question as if you are interviewing for the {getFinalJobTitle()} role at {getFinalCompany()}.
                                </p>
                              )}
                              {getFinalJobTitle() && !getFinalCompany() && (
                                <p className="text-[#9b5cff] mb-3 font-medium italic">
                                  Answer this question as if you are interviewing for the {getFinalJobTitle()} role.
                                </p>
                              )}
                              {!getFinalJobTitle() && getFinalCompany() && (
                                <p className="text-[#9b5cff] mb-3 font-medium italic">
                                  Answer this question as if you are interviewing at {getFinalCompany()}.
                                </p>
                              )}
                              <p className="text-white mb-4">
                                {voiceQuestions[currentVoiceIndex]?.question ? (
                                  <TranslatableText text={formatVoiceQuestionWithContext(
                                    voiceQuestions[currentVoiceIndex].question,
                                    getFinalJobTitle(),
                                    getFinalCompany()
                                  )}>
                                    {formatVoiceQuestionWithContext(
                                      voiceQuestions[currentVoiceIndex].question,
                                      getFinalJobTitle(),
                                      getFinalCompany()
                                    )}
                                  </TranslatableText>
                                ) : ''}
                              </p>
                            </div>

                            <div className="bg-[#0D0D0D] rounded-xl p-4 mb-4 border border-gray-800">
                              <p className="text-gray-400 font-medium mb-2">Your Best Written Answer:</p>
                              {voiceQuestions[currentVoiceIndex]?.answer && voiceQuestions[currentVoiceIndex].answer.trim() ? (
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                  {voiceQuestions[currentVoiceIndex].answer}
                                </p>
                              ) : (
                                <p className="text-gray-500 text-sm italic">
                                  Write and save your answer in the Writing Training tab to see it here.
                                </p>
                              )}
                            </div>

                            <div className="space-y-3">
                              <VoiceRecordingPanel
                                isRecording={isRecording}
                                hasRecording={Boolean(audioBlob)}
                                recordingTime={recordingTime}
                                currentQuestion={currentVoiceIndex + 1}
                                totalQuestions={voiceQuestions.length}
                                formatTime={formatTime}
                                readyMessage={voiceReadyMessage}
                                isSpeakingQuestion={voiceIsSpeakingQuestion}
                                onStartRecording={startRecording}
                                onStopRecording={stopRecording}
                                onSubmit={handleVoiceSubmit}
                                isAnalyzing={isAnalyzing}
                              />
                            </div>

                            {/* Error Message */}
                            {voiceErrorMessage && (
                              <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
                                <p className="text-red-400 text-sm">
                                  Voice analysis failed: {voiceErrorMessage}
                                </p>
                              </div>
                            )}

                            {/* Converted Text Result */}
                            {voiceResult && (
                              <div className="bg-[#0D0D0D] rounded-xl p-4 border border-gray-800">
                                <p className="text-gray-400 font-medium mb-3">Converted Text Result:</p>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                  {voiceResult.transcript}
                                </p>
                              </div>
                            )}

                            {/* Next Question Button */}
                            {voiceResult && currentVoiceIndex < voiceQuestions.length - 1 && (
                              <button
                                onClick={handleNextVoiceQuestion}
                                data-jaz-action="ic_voice_next"
                                className="w-full bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-6 py-2 rounded-xl transition-colors"
                              >
                                Next Question
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Level 3: Hard Mode */}
              {activeTab === 'hard' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-200">
                        Memory Challenge
                      </span>
                      <h2 className="text-xl font-semibold text-slate-100">Hard Mode – Memory Interview</h2>
                    </div>
                    
                    {/* Unlock Warning */}
                    {!hardModeUnlocked && (
                      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 mb-6">
                        <p className="text-yellow-400 text-sm font-medium">
                          Complete Writing Training first to unlock Hard Mode.
                        </p>
                        <p className="text-yellow-300/70 text-xs mt-1">
                          Save your written answers for all questions to access Hard Mode.
                        </p>
                      </div>
                    )}

                    {hardModeIsLoadingQuestions ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[#9b5cff]" />
                        <span className="ml-2 text-gray-400">Loading questions...</span>
                      </div>
                    ) : hardModeQuestions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg mb-2">
                          No questions available for Hard Mode.
                        </p>
                        <p className="text-gray-500 text-sm">
                          Complete Writing Training and save your answers to unlock Hard Mode questions.
                        </p>
                      </div>
                    ) : !hardModeUnlocked ? (
                      <div className="bg-[#0D0D0D] rounded-xl p-8 border-2 border-gray-700 text-center">
                        <p className="text-gray-500 mb-4">Hard Mode is locked</p>
                        <p className="text-gray-600 text-sm">
                          Complete Writing Training first to unlock Hard Mode.
                        </p>
                      </div>
                    ) : hardModeShowCompletion && isHardModeComplete() ? (
                      <>
                        {/* Completion UI - Show when Hard Mode is completed */}
                        <div className="bg-[#0D0D0D] rounded-xl p-4 mb-3 border border-[#9b5cff]/30">
                          <div className="text-center space-y-4">
                            <div className="space-y-1.5">
                              <h3 className="text-lg font-heading font-semibold text-[#9b5cff]">
                                Hard Mode Complete
                              </h3>
                              {(() => {
                                const finalScore = calculateFinalHardModeScore()
                                const scoreFormatted = finalScore.toFixed(1)
                                if (finalScore >= 8.0) {
                                  return (
                                    <>
                                      <p className="text-gray-300 text-sm">
                                        Great job! Your average Hard Mode score is {scoreFormatted}/10. You're ready for the final Simulation.
                                      </p>
                                      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                                        <button
                                          onClick={handleContinueToSimulation}
                                          className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                        >
                                          Go to Interview Simulation
                                        </button>
                                      </div>
                                    </>
                                  )
                                } else {
                                  return (
                                    <>
                                      <p className="text-gray-300 text-sm">
                                        Your average Hard Mode score is {scoreFormatted}/10. We recommend retaking Hard Mode to improve your memory and consistency before moving to Simulation.
                                      </p>
                                      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                                        <button
                                          onClick={handleRepeatHardMode}
                                          className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                        >
                                          Repeat Hard Mode
                                        </button>
                                        <button
                                          onClick={handleGoToSimulationAnyway}
                                          className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-medium"
                                        >
                                          Go to Interview Simulation Anyway
                                        </button>
                                      </div>
                                    </>
                                  )
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Main Card */}
                        <div className="bg-[#0D0D0D] rounded-xl p-6 mb-6 border-2 border-[#9b5cff]/30">
                          <div className="flex items-start gap-2 mb-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2.5">
                            <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-100/90">
                              Answer naturally without looking at previous notes.
                            </p>
                          </div>
                          <p className="text-lg text-[#9b5cff] mb-2 font-medium">
                            Question {hardModeIndex + 1} of {hardModeQuestions.length}
                          </p>
                          <p className="text-gray-400 text-sm mb-4">
                            You will see the question, but you must answer from memory without seeing your previous written answer. There is no audio playback in Hard Mode.
                          </p>
                          
                          {/* Question Text Display */}
                          {getFinalJobTitle() && getFinalCompany() && (
                            <p className="text-[#9b5cff] mb-3 font-medium italic">
                              Answer this question as if you are interviewing for the {getFinalJobTitle()} role at {getFinalCompany()}.
                            </p>
                          )}
                          {getFinalJobTitle() && !getFinalCompany() && (
                            <p className="text-[#9b5cff] mb-3 font-medium italic">
                              Answer this question as if you are interviewing for the {getFinalJobTitle()} role.
                            </p>
                          )}
                          {!getFinalJobTitle() && getFinalCompany() && (
                            <p className="text-[#9b5cff] mb-3 font-medium italic">
                              Answer this question as if you are interviewing at {getFinalCompany()}.
                            </p>
                          )}
                          <p className="text-white mb-4">
                            {hardModeQuestions[hardModeIndex]?.question ? formatVoiceQuestionWithContext(
                              hardModeQuestions[hardModeIndex].question,
                              getFinalJobTitle(),
                              getFinalCompany()
                            ) : ''}
                          </p>
                          
                          {/* Countdown Display */}
                          {hardModeCountdown !== null && (
                            <div className="text-center py-8 mb-4">
                              <div className="text-8xl font-bold text-[#9b5cff] mb-2">
                                {hardModeCountdown}
                              </div>
                              <p className="text-gray-400 text-sm">Recording will start in...</p>
                            </div>
                          )}

                          {/* Start Answer Button */}
                          {!hardModeCountdown && !hardModeIsRecording && !hardModeAudioBlob && (
                            <button
                              onClick={handleHardModePlayQuestion}
                              disabled={!writingCompleted || hardModeQuestions.length === 0 || !hardModeQuestions[hardModeIndex]}
                              data-jaz-action="ic_hard_record"
                              className="rounded-full px-4 py-2.5 text-sm font-medium text-white border transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-violet-600 border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300"
                            >
                              <Mic className="w-4 h-4" />
                              Start Answer
                            </button>
                          )}
                          <p className="text-slate-400 text-xs mt-2">
                            Recording will start when you press the button to begin your answer.
                          </p>
                        </div>

                        {/* Recording Controls */}
                        {hardModeIsRecording && (
                          <div className="space-y-4">
                            {/* Question Text Display During Recording */}
                            <div className="bg-[#0D0D0D] rounded-xl p-6 border border-gray-800">
                              <p className="text-lg text-gray-300 mb-2 font-medium">
                                Question {hardModeIndex + 1} of {hardModeQuestions.length}:
                              </p>
                              <p className="text-white mb-4">
                                {hardModeQuestions[hardModeIndex]?.question ? formatVoiceQuestionWithContext(
                                  hardModeQuestions[hardModeIndex].question,
                                  getFinalJobTitle(),
                                  getFinalCompany()
                                ) : ''}
                              </p>
                            </div>
                            
                            <button
                              onClick={stopHardModeRecording}
                              data-jaz-action="ic_hard_stop"
                              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
                            >
                              <Square className="w-5 h-5" />
                              Stop Recording ({formatTime(hardModeRecordingTime)})
                            </button>
                            
                            {/* Recording Visualization */}
                            <div className="bg-[#0D0D0D] rounded-xl p-8 border border-gray-800">
                              <div className="text-center space-y-4">
                                <div className="flex items-end justify-center gap-1 h-20">
                                  {[...Array(40)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-1 bg-[#9b5cff] rounded-full opacity-80"
                                      style={{
                                        height: `${(Math.sin(i * 0.3 + hardModeRecordingTime * 0.5) * 30 + 50)}%`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <p className="text-gray-500 text-sm">Recording in progress...</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* After Recording: Record Again or Submit */}
                        {hardModeAudioBlob && !hardModeIsRecording && !hardModeResult && (
                          <div className="space-y-3">
                            {/* Question Text Display After Recording */}
                            <div className="bg-[#0D0D0D] rounded-xl p-6 border border-gray-800">
                              <p className="text-lg text-gray-300 mb-2 font-medium">
                                Question {hardModeIndex + 1} of {hardModeQuestions.length}:
                              </p>
                              <p className="text-white mb-4">
                                {hardModeQuestions[hardModeIndex]?.question ? formatVoiceQuestionWithContext(
                                  hardModeQuestions[hardModeIndex].question,
                                  getFinalJobTitle(),
                                  getFinalCompany()
                                ) : ''}
                              </p>
                            </div>
                            
                            <button
                              onClick={startHardModeRecording}
                              data-jaz-action="ic_hard_record"
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
                            >
                              <Mic className="w-5 h-5" />
                              Record Again
                            </button>
                            <button
                              onClick={handleHardModeSubmit}
                              disabled={hardModeLoading || hardModeIsTranscribing}
                              data-jaz-action="ic_hard_submit"
                              className="w-full bg-[#9b5cff] hover:bg-[#8a4ae8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
                            >
                              {hardModeLoading || hardModeIsTranscribing ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  {hardModeIsTranscribing ? 'Transcribing...' : 'Evaluating...'}
                                </>
                              ) : (
                                <>
                                  <Send className="w-5 h-5" />
                                  Submit Hard Mode Answer
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Results Section */}
                        {hardModeResult && (
                          <div className="space-y-6">
                            {/* Converted Answer */}
                            <div className="bg-[#0D0D0D] rounded-xl p-6 border border-gray-800">
                              <p className="text-gray-400 font-medium mb-3">Converted Answer:</p>
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                {hardModeResult.convertedText || hardModeConvertedText}
                              </p>
                            </div>

                            {/* Target Answer */}
                            <div className="bg-[#0D0D0D] rounded-xl p-6 border border-gray-800">
                              <p className="text-gray-400 font-medium mb-3">Target Answer (Best Written):</p>
                              {hardModeQuestions[hardModeIndex]?.targetAnswer && hardModeQuestions[hardModeIndex].targetAnswer.trim() ? (
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                  {hardModeQuestions[hardModeIndex].targetAnswer}
                                </p>
                              ) : (
                                <p className="text-gray-500 text-sm italic">
                                  Complete this question in Writing Training to see your target answer here.
                                </p>
                              )}
                            </div>

                            {/* Next Question Button */}
                            <button
                              onClick={handleNextHardModeQuestion}
                              data-jaz-action="ic_hard_next"
                              className="w-full bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-6 py-2 rounded-xl transition-colors"
                            >
                              {hardModeIndex === 7 && hardModeResultsHistory.length >= 8 
                                ? 'View Final Results' 
                                : 'Next Hard Question'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Level 4: Full Simulation */}
              {/* Level 3 - Memory Mode */}
              {activeTab === 'memory' && (
                <div className="space-y-6 relative min-h-[400px]">
                  <div>
                    <h2 className="text-2xl font-heading font-semibold mb-4">Memory Mode – Text-Based Memory Training</h2>
                    
                    {/* Explanation */}
                    <div className="bg-[#0D0D0D] rounded-xl p-6 mb-6 border border-gray-800">
                      <p className="text-gray-300 mb-2">
                        Memory Mode helps you practice answering multiple interview questions in sequence without seeing feedback after each question.
                      </p>
                      <p className="text-gray-400 text-sm">
                        You'll answer 3 questions consecutively, and receive a comprehensive evaluation at the end covering memory retention, clarity, and confidence across all your answers.
                      </p>
                    </div>

                    {/* Start Session Button */}
                    {!isMemorySessionActive && !isMemorySessionFinished && (
                      <div className="text-center py-8">
                        <button
                          onClick={handleStartMemorySession}
                          className="bg-[#9b5cff] hover:bg-[#8a4ae8] text-white px-8 py-4 rounded-xl transition-colors text-lg font-medium"
                        >
                          Start Memory Session
                        </button>
                      </div>
                    )}

                    {/* Memory Session Active - Question Flow */}
                    {isMemorySessionActive && !isMemorySessionFinished && (
                      <div className="space-y-6">
                        {/* Progress Indicator */}
                        <div className="bg-[#0D0D0D] rounded-xl p-4 border border-gray-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Question {currentMemoryQuestionIndex + 1} of {memoryQuestions.length}</span>
                            <span className="text-[#9b5cff]">
                              {Math.round(((currentMemoryQuestionIndex + 1) / memoryQuestions.length) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-[#9b5cff] rounded-full transition-all duration-300"
                              style={{ width: `${((currentMemoryQuestionIndex + 1) / memoryQuestions.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Current Question */}
                        <div className="bg-[#0D0D0D] rounded-xl p-6 border-2 border-[#9b5cff]/30">
                          <p className="text-lg text-gray-300 mb-2 font-medium">Question {currentMemoryQuestionIndex + 1}:</p>
                          <p className="text-white text-xl">
                            {memoryQuestions[currentMemoryQuestionIndex]?.question}
                          </p>
                        </div>

                        {/* Answer Input */}
                        <div>
                          <label className="block text-gray-400 font-medium mb-2">Your Answer:</label>
                          <textarea
                            value={currentMemoryAnswer}
                            onChange={(e) => setCurrentMemoryAnswer(e.target.value)}
                            className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl p-4 text-white min-h-[250px] focus:outline-none focus:border-[#9b5cff] transition-colors resize-none"
                            placeholder="Type your answer here... (No feedback will be shown until the end)"
                          />
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={handleMemoryNextQuestion}
                          disabled={!currentMemoryAnswer.trim()}
                          className="w-full bg-[#9b5cff] hover:bg-[#8a4ae8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl transition-colors text-lg font-medium"
                        >
                          {currentMemoryQuestionIndex < memoryQuestions.length - 1 ? 'Next Question' : 'Finish & Evaluate'}
                        </button>
                      </div>
                    )}

                    {/* Memory Session Finished - Evaluation Results */}
                    {isMemorySessionFinished && (
                      <div className="space-y-6">
                        {/* Evaluation Results */}
                        {memoryEvaluationResult && !isMemoryEvaluating && (
                          <div className="space-y-6">
                            {/* Scores Summary */}
                            <div className="bg-[#0D0D0D] rounded-xl p-6 border border-gray-800">
                              <h3 className="text-xl font-heading font-semibold mb-4">Memory Evaluation Report</h3>
                              
                              <div className="grid grid-cols-3 gap-4 mb-6">
                                {/* Memory Score */}
                                <div className="bg-[#1a1a1a] rounded-lg p-4">
                                  <p className="text-gray-400 text-sm mb-1">Memory Score</p>
                                  <p className="text-3xl font-bold text-[#9b5cff]">{memoryEvaluationResult.memoryScore}/10</p>
                                </div>
                                
                                {/* Clarity Score */}
                                <div className="bg-[#1a1a1a] rounded-lg p-4">
                                  <p className="text-gray-400 text-sm mb-1">Clarity Score</p>
                                  <p className="text-3xl font-bold text-[#9b5cff]">{memoryEvaluationResult.clarityScore}/10</p>
                                </div>
                                
                                {/* Confidence Score */}
                                <div className="bg-[#1a1a1a] rounded-lg p-4">
                                  <p className="text-gray-400 text-sm mb-1">Confidence Score</p>
                                  <p className="text-3xl font-bold text-[#9b5cff]">{memoryEvaluationResult.confidenceScore}/10</p>
                                </div>
                              </div>

                              {/* Summary */}
                              <div className="mb-6">
                                <p className="text-gray-400 font-medium mb-2">Summary:</p>
                                <p className="text-gray-300 whitespace-pre-wrap">{memoryEvaluationResult.summary}</p>
                              </div>

                              {/* Strengths */}
                              {memoryEvaluationResult.strengths.length > 0 && (
                                <div className="mb-6">
                                  <p className="text-green-400 font-medium mb-2">Strengths:</p>
                                  <ul className="space-y-2">
                                    {memoryEvaluationResult.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                                        <span className="text-green-400 mt-1">•</span>
                                        <span>{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Weaknesses */}
                              {memoryEvaluationResult.weaknesses.length > 0 && (
                                <div className="mb-6">
                                  <p className="text-orange-400 font-medium mb-2">Weaknesses:</p>
                                  <ul className="space-y-2">
                                    {memoryEvaluationResult.weaknesses.map((weakness, idx) => (
                                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                                        <span className="text-orange-400 mt-1">•</span>
                                        <span>{weakness}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Missed Points */}
                              {memoryEvaluationResult.missedPoints.length > 0 && (
                                <div>
                                  <p className="text-yellow-400 font-medium mb-2">Missed Points:</p>
                                  <ul className="space-y-2">
                                    {memoryEvaluationResult.missedPoints.map((point, idx) => (
                                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                                        <span className="text-yellow-400 mt-1">•</span>
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Reset Button */}
                            <button
                              onClick={handleMemoryResetSession}
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-colors"
                            >
                              Start New Memory Session
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Loading Overlay During Memory Evaluation */}
                  {isMemoryEvaluating && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl min-h-[400px]">
                      <div className="bg-[#1a1a1a] border-2 border-[#9b5cff]/50 rounded-2xl p-8 shadow-lg shadow-[#9b5cff]/20 max-w-md mx-4">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-16 h-16 animate-spin text-[#9b5cff]" />
                          <div className="text-center space-y-2">
                            <p className="text-xl font-semibold text-white">Evaluating your interview…</p>
                            <p className="text-sm text-gray-400">This may take a few seconds.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interview Simulation Tab */}
              {activeTab === 'interviewSimulation' && (
                <>
                  {!fullSimulationUnlocked ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg mb-2">
                        Complete Writing Training first to unlock Full Interview Simulation.
                      </p>
                      <p className="text-gray-500 text-sm">
                        Save your written answers for all questions to access the full simulation.
                      </p>
                    </div>
                  ) : (
                    <InterviewSimulationTab 
                      key={interviewSimulationRestartKey}
                      jobTitle={getFinalJobTitle()}
                      company={getFinalCompany()}
                      jobId={jobIdFromURL}
                      onScoreUpdate={(score: number | null, finished: boolean) => {
                        setInterviewSimulationScore(score)
                        setInterviewSimulationFinished(finished)
                      }}
                      onCoachNotesUpdate={(coachNotes) => {
                        setInterviewSimulationCoachNotes(coachNotes)
                      }}
                      onRestart={() => {
                        mockInterviewSignalRef.current = false
                        setInterviewSimulationRestartKey(k => k + 1)
                      }}
                      coreQuestions={coreQuestions}
                      writingEvaluations={writingEvaluations}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - 30% */}
          <div className="lg:w-[30%] space-y-4">
            <InterviewCoachNotesPanel
              strengths={
                activeTab === 'writing' && writingEvaluations[currentQuestionIndex]
                  ? writingEvaluations[currentQuestionIndex].strengths
                  : activeTab === 'interviewSimulation' && interviewSimulationCoachNotes
                    ? interviewSimulationCoachNotes.slice(0, 2)
                    : []
              }
              areasToImprove={
                activeTab === 'writing' && writingEvaluations[currentQuestionIndex]
                  ? writingEvaluations[currentQuestionIndex].weaknesses
                  : activeTab === 'interviewSimulation' && interviewSimulationCoachNotes
                    ? interviewSimulationCoachNotes.slice(2, 4)
                    : hardModeResult?.improvementTips?.slice(0, 2) ?? []
              }
              topPriority={
                activeTab === 'voice' && voiceResult?.summary_feedback
                  ? voiceResult.summary_feedback
                  : hardModeResult?.summaryFeedback
              }
              quickTips={
                activeTab === 'writing' && writingEvaluations[currentQuestionIndex]
                  ? writingEvaluations[currentQuestionIndex].tips
                  : voiceResult?.improvement_tips ?? hardModeResult?.improvementTips ?? []
              }
              nextGoal={
                activeTab === 'writing' && writingCompleted
                  ? 'Move to Voice Training to practice speaking your answers.'
                  : activeTab === 'voice' && voiceTrainingCompleted
                    ? 'Continue to Hard Mode to test memory recall.'
                    : activeTab === 'hard' && hardModeShowCompletion
                      ? 'Complete the full Interview Simulation.'
                      : undefined
              }
              recommendedPractice={
                activeTab === 'interviewSimulation' && interviewSimulationFinished
                  ? 'Repeat simulation or tailor your CV for the target role.'
                  : 'Evaluate each answer before moving to the next question.'
              }
              emptyMessage={
                activeTab === 'writing'
                  ? 'Evaluate your answer to see writing tips here.'
                  : activeTab === 'voice'
                    ? 'Submit a voice answer to see coaching notes.'
                    : activeTab === 'hard'
                      ? 'Record and submit a Hard Mode answer to see tips here.'
                      : 'Complete a step to see coaching notes.'
              }
            />

            {activeTab === 'voice' && voiceResult?.scores && (
              <VoiceMetricsPanel scores={voiceResult.scores} />
            )}

            {activeTab === 'interviewSimulation' && interviewSimulationFinished && interviewSimulationScore !== null && (
              <InterviewFinalReport
                scores={{
                  overall: interviewSimulationScore,
                  readiness: Math.round((interviewSimulationScore / 10) * 100),
                  communication: interviewSimulationScore,
                  confidence: interviewSimulationScore,
                  professionalTone: interviewSimulationScore,
                  examples: interviewSimulationScore,
                  starMethod: interviewSimulationScore,
                  voiceQuality: interviewSimulationScore,
                  memory: interviewSimulationScore,
                  employerImpression: interviewSimulationScore,
                }}
                title="Simulation Score"
              />
            )}

            {/* Hard Mode Evaluation Panel */}
            {activeTab === 'hard' && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
                <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#9b5cff]/30">
                  <h3 className="text-base font-heading font-semibold mb-3 text-[#9b5cff]">Hard Mode Evaluation</h3>
                  
                  {hardModeResult ? (
                    <>
                      {/* Overall Score - Calculate average of all scores */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400 font-medium">Overall Score</span>
                          <span className="text-xl font-bold text-[#9b5cff]">
                            {Math.round(
                              (hardModeResult.accuracy +
                              hardModeResult.memoryRetention +
                              hardModeResult.logic +
                              hardModeResult.stability +
                              hardModeResult.tone +
                              hardModeResult.completeness +
                              hardModeResult.examplesClarity +
                              hardModeResult.structure) / 8
                            )} / 10
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] rounded-full transition-all"
                            style={{ 
                              width: `${((hardModeResult.accuracy +
                              hardModeResult.memoryRetention +
                              hardModeResult.logic +
                              hardModeResult.stability +
                              hardModeResult.tone +
                              hardModeResult.completeness +
                              hardModeResult.examplesClarity +
                              hardModeResult.structure) / 8 / 10) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Category Breakdown - Always Expanded */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 font-medium mb-2">
                          <span>Category Breakdown</span>
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Accuracy</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.accuracy / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.accuracy}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Memory Retention</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.memoryRetention / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.memoryRetention}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Logic</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.logic / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.logic}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Stability</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.stability / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.stability}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Tone</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.tone / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.tone}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Completeness</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.completeness / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.completeness}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Examples Clarity</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.examplesClarity / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.examplesClarity}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Structure</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(hardModeResult.structure / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{hardModeResult.structure}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Record and submit a Hard Mode answer to see your score and feedback.</p>
                  )}
                </div>
              </div>
            )}

            {/* Answer Evaluation Panel - Only show when writing training is NOT complete */}
            {activeTab === 'writing' && !isWritingTrainingComplete && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
                <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#9b5cff]/30">
                  <h3 className="text-base font-heading font-semibold mb-3 text-[#9b5cff]">Answer Evaluation</h3>
                  
                  {writingEvaluations[currentQuestionIndex] ? (
                    <>
                      {/* Overall Score */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400 font-medium">Overall Score</span>
                          <span className="text-xl font-bold text-[#9b5cff]">{writingEvaluations[currentQuestionIndex].score} / 10</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] rounded-full transition-all"
                            style={{ width: `${(writingEvaluations[currentQuestionIndex].score / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Category Breakdown - Always Expanded */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 font-medium mb-2">
                          <span>Category Breakdown</span>
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Clarity</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(writingEvaluations[currentQuestionIndex].clarity / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{writingEvaluations[currentQuestionIndex].clarity}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Relevance</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(writingEvaluations[currentQuestionIndex].relevance / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{writingEvaluations[currentQuestionIndex].relevance}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Structure</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(writingEvaluations[currentQuestionIndex].structure / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{writingEvaluations[currentQuestionIndex].structure}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Professional Tone</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(writingEvaluations[currentQuestionIndex].professionalTone / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{writingEvaluations[currentQuestionIndex].professionalTone}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Examples Impact</span>
                            <div className="flex items-center gap-2 flex-1 mx-3">
                              <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-[#9b5cff] rounded-full transition-all"
                                  style={{ width: `${(writingEvaluations[currentQuestionIndex].examplesImpact / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#9b5cff] font-medium w-8 text-right">{writingEvaluations[currentQuestionIndex].examplesImpact}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Evaluate your answer to see your score and feedback.</p>
                  )}
                </div>
              </div>
            )}

            {/* Your Progress — Writing */}
            {activeTab === 'writing' && (
              <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
                <h3 className="text-base font-heading font-semibold mb-4">Your Progress — Writing</h3>
                <div className="space-y-4">
                  {/* Writing Progress - Full Detailed Panel */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-300">Writing</span>
                      <span className="text-xs text-gray-400">{Math.round(progress.writing)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-2 bg-[#9b5cff] rounded-full transition-all duration-500"
                        style={{ width: `${progress.writing}%` }}
                      />
                    </div>

                    {/* (A) Per-question results list */}
                    <div className="mb-3 space-y-1.5">
                      {Array.from({ length: interviewQuestions.length }, (_, idx) => {
                        const evaluation = writingEvaluations[idx]
                        if (evaluation) {
                          // Create a short summary: best strength + main weakness, or first tip
                          const bestStrength = evaluation.strengths && evaluation.strengths.length > 0 ? evaluation.strengths[0] : null
                          const mainWeakness = evaluation.weaknesses && evaluation.weaknesses.length > 0 ? evaluation.weaknesses[0] : null
                          const firstTip = evaluation.tips && evaluation.tips.length > 0 ? evaluation.tips[0] : null
                          
                          let summaryTip = ''
                          if (bestStrength && mainWeakness) {
                            summaryTip = `${bestStrength}. ${mainWeakness}.`
                          } else if (firstTip) {
                            summaryTip = firstTip
                          } else if (bestStrength) {
                            summaryTip = bestStrength
                          } else if (mainWeakness) {
                            summaryTip = mainWeakness
                          }
                          
                          return (
                            <div key={idx} className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                              <div className="font-medium text-[#9b5cff]">
                                Q{idx + 1} – {evaluation.score.toFixed(1)}/10
                              </div>
                              {summaryTip && (
                                <div className="text-gray-400 text-[10px] mt-1">{summaryTip}</div>
                              )}
                            </div>
                          )
                        } else {
                          return (
                            <div key={idx} className="text-xs text-gray-500 bg-gray-800/30 rounded p-2">
                              <span className="font-medium">Q{idx + 1} – Not evaluated yet</span>
                            </div>
                          )
                        }
                      })}
                    </div>

                    {/* (B) Overall Writing Score */}
                    {Object.keys(writingEvaluations).length > 0 && (
                      <div className="mb-3 pt-2 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-400">Overall Writing Score:</span>
                          <span className="text-xs font-bold text-[#9b5cff]">
                            {averageWritingScore.toFixed(1)} / 10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </PublicToolLayout>
  )
}

