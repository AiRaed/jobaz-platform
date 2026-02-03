import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SYSTEM_PROMPT, PATH_MODULES } from '@/lib/uk-career-assistant/prompts'
import { buildReasons } from '@/lib/uk-career-assistant/reasons'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface AIResponse {
  path: string | null
  phase: 'classification' | 'assessment' | 'recommendation' | 'CLASSIFY' | 'PATH' | 'RESULT'
  assistant_message: string
  question: {
    id: string
    text: string
    type: 'single' | 'multi'
    options: Array<{ value: string; label: string }>
    max_select?: number
  } | null
  allow_free_text: boolean
  state_updates: Record<string, any>
  done: boolean
  confidence_score?: number // Optional: 0.0-1.0, computed server-side if missing
  result: {
    summary: string
    work_now: {
      directions: Array<{
        direction_id: string
        direction_title: string
        why: Array<string>
        chips?: Array<string>
      }>
    }
    improve_later: {
      directions: Array<{
        direction_id: string
        direction_title: string
        why: Array<string>
        chips?: Array<string>
      }>
    } | null
    avoid: Array<string>
    next_step: string
  } | null
}

/**
 * Normalize option schema to {value, label} format
 * Handles various input shapes: {id, text}, {value, label}, or mixed
 */
function normalizeOptions(options: any[]): Array<{ value: string; label: string }> {
  if (!Array.isArray(options)) return []
  
  return options.map(opt => {
    // If already in correct format, return as-is
    if (opt.value && opt.label) {
      return { value: opt.value, label: opt.label }
    }
    
    // Convert {id, text} to {value, label}
    if (opt.id && opt.text) {
      return { value: opt.id, label: opt.text }
    }
    
    // Convert {value, text} to {value, label}
    if (opt.value && opt.text) {
      return { value: opt.value, label: opt.text }
    }
    
    // Convert {id, label} to {value, label}
    if (opt.id && opt.label) {
      return { value: opt.id, label: opt.label }
    }
    
    // Fallback: use best available
    const value = opt.id || opt.value || opt.label || opt.text || String(opt)
    const label = opt.text || opt.label || opt.value || opt.id || String(opt)
    
    return { value, label }
  })
}

/**
 * Normalize classify values to canonical format
 * Converts button labels (Yes, No, Not sure) to canonical values (yes, no, not_sure)
 */
function normalizeClassifyValue(userInput: string | string[] | null | undefined): string | string[] | null {
  if (userInput === null || userInput === undefined) return null
  if (Array.isArray(userInput)) {
    return userInput.map(v => normalizeClassifyValue(v) as string)
  }
  
  const normalized = String(userInput).toLowerCase().trim()
  
  // Map common variations to canonical values
  if (normalized === 'yes' || normalized === 'y') return 'yes'
  if (normalized === 'no' || normalized === 'n') return 'no'
  if (normalized === 'not sure' || normalized === 'not_sure' || normalized === 'unsure') return 'not_sure'
  
  // Return as-is if already canonical
  return normalized
}

/**
 * FORBIDDEN QUESTION IDs - These can NEVER be asked after classification is complete
 */
const FORBIDDEN_QUESTION_IDS = ['edu', 'exp', 'rel'] as const

/**
 * Check if classification is complete
 * Classification is complete when:
 * - edu is answered
 * - exp is answered
 * - rel is answered (if required: only if edu=yes AND exp=yes)
 */
function isClassificationComplete(state: any): boolean {
  const answers = state?.answers || {}
  const classification = state?.classification || {}
  
  // Check if edu and exp are answered (either in answers or classification)
  const edu = answers['edu'] || classification['edu']
  const exp = answers['exp'] || classification['exp']
  
  if (edu === undefined || exp === undefined) {
    return false
  }
  
  // If both are yes, rel must be answered
  if (edu === 'yes' && exp === 'yes') {
    const rel = answers['rel'] || classification['rel']
    return rel !== undefined
  }
  
  // If not both yes, classification is complete
  return true
}

/**
 * Check if a question ID is forbidden (classification question after classification is done)
 */
function isForbiddenQuestion(questionId: string, state: any): boolean {
  if (!FORBIDDEN_QUESTION_IDS.includes(questionId as any)) {
    return false
  }
  
  // If classification is done, these questions are forbidden
  return state?.classification_done === true || isClassificationComplete(state)
}

/**
 * Get current phase from state
 * Maps old phase names to new ones for backward compatibility
 */
function getCurrentPhase(state: any): 'CLASSIFY' | 'PATH' | 'RESULT' {
  const phase = state?.phase
  
  // Handle new phase names
  if (phase === 'CLASSIFY' || phase === 'PATH' || phase === 'RESULT') {
    return phase
  }
  
  // Map old phase names to new ones
  if (phase === 'classification') {
    return 'CLASSIFY'
  }
  if (phase === 'assessment') {
    return 'PATH'
  }
  if (phase === 'recommendation') {
    return 'RESULT'
  }
  
  // Default: determine phase from state
  if (state?.classification_done === true || isClassificationComplete(state)) {
    if (state?.done === true || state?.result) {
      return 'RESULT'
    }
    return 'PATH'
  }
  
  return 'CLASSIFY'
}

/**
 * Extract and store classification answers
 * Called when classification questions are answered
 */
function extractClassificationAnswers(state: any): { edu: string | null; exp: string | null; rel: string | null } {
  const answers = state?.answers || {}
  const classification = state?.classification || {}
  
  return {
    edu: answers['edu'] || classification['edu'] || null,
    exp: answers['exp'] || classification['exp'] || null,
    rel: answers['rel'] || classification['rel'] || null
  }
}

/**
 * CANONICAL QUESTION ID SEQUENCES
 * These define the exact order and IDs for each path - NO VARIATIONS ALLOWED
 * 
 * CANONICAL FIELD LOCKING RULE:
 * - If a field has a value in state.answers, it is LOCKED and can NEVER be asked again
 * - Only canonical field IDs are allowed
 * - Server (not AI) decides the next question during PATH phase
 */
const CANONICAL_QUESTION_IDS = {
  CLASSIFY: ['edu', 'exp', 'rel', 'goal_gate'] as const,
  // PATH_1: goal_gate is REQUIRED first, then priorities (conditional), then others
  PATH_1: ['goal_gate', 'priorities', 'physical_ability', 'people_comfort', 'language', 'transport', 'training_openness'] as const,
  PATH_2: ['goal_gate', 'experience_field', 'change_reason', 'move_away', 'strengths', 'physical_ability', 'people_comfort', 'language', 'transport', 'training_openness'] as const,
  PATH_3: ['goal_gate', 'education_level', 'education_field', 'study_status', 'work_during_study', 'physical_ability', 'people_comfort', 'language', 'transport', 'training_openness'] as const,
  PATH_4: ['goal_gate', 'education_level', 'education_field', 'experience_field', 'change_reason', 'move_away', 'transferable_strengths', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness'] as const,
  PATH_5: ['goal_gate', 'current_role_type', 'adjustment_goal', 'pressure_source', 'change_level', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness'] as const,
} as const

/**
 * CANONICAL PREFERENCE GATE QUESTIONS (optional, only if needed)
 * These are asked AFTER all required PATH questions are answered
 */
const CANONICAL_PREFERENCE_GATE_IDS = {
  PATH_1: ['work_style', 'customer_interaction', 'driving_interest'] as const,
  PATH_2: ['work_style', 'customer_interaction', 'driving_interest'] as const,
  PATH_3: ['work_style', 'customer_interaction', 'driving_interest'] as const,
  PATH_4: ['work_style', 'customer_interaction', 'driving_interest'] as const,
  PATH_5: ['work_style', 'customer_interaction'] as const,
} as const

/**
 * Get canonical sequence for a path
 * PHASE LOCKING: Classification questions (edu, exp, rel) are ONLY allowed in CLASSIFY phase
 */
function getCanonicalSequence(path: string | null, phase: string, state: any): readonly string[] {
  const currentPhase = getCurrentPhase(state)
  
  // CLASSIFY phase: only classification questions
  if (currentPhase === 'CLASSIFY' || (phase === 'classification' && !path)) {
    const answers = state?.answers || {}
    const classification = state?.classification || {}
    const edu = answers['edu'] || classification['edu']
    const exp = answers['exp'] || classification['exp']
    
    const seq: string[] = []
    
    // Only include questions that haven't been answered
    if (edu === undefined) {
      seq.push('edu')
    }
    if (exp === undefined) {
      seq.push('exp')
    }
    // rel is conditional and only if both edu and exp are yes
    if (edu === 'yes' && exp === 'yes') {
      const rel = answers['rel'] || classification['rel']
      if (rel === undefined) {
        seq.push('rel')
      }
    }
    
    // goal_gate comes after classification
    if (seq.length === 0 || (seq.length > 0 && isClassificationComplete(state))) {
      const goalGate = answers['goal_gate']
      if (goalGate === undefined) {
        seq.push('goal_gate')
      }
    }
    
    return seq
  }
  
  // PATH phase: only path-specific questions (NO classification questions)
  // CANONICAL FIELD LOCKING: Follow exact canonical order
  if (currentPhase === 'PATH' || phase === 'assessment') {
    switch (path) {
      case 'PATH_1': {
        // PATH_1: Follow canonical order - goal_gate first, then priorities (conditional), then others
        const goalType = state?.answers?.goal_gate
        const seq1: string[] = []
        // goal_gate is ALWAYS required first
        seq1.push('goal_gate')
        // priorities is conditional on goal_gate !== 'not_sure'
        if (goalType && goalType !== 'not_sure') {
          seq1.push('priorities')
        }
        seq1.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
        return seq1
      }
      case 'PATH_2': {
        // PATH_2: Build sequence with conditional follow-ups for experience_field
        const answers = state?.answers || {}
        const seq: string[] = []
        
        // goal_gate is ALWAYS required first
        seq.push('goal_gate')
        
        // experience_field
        seq.push('experience_field')
        
        // Conditional follow-ups for experience_field
        const experienceField = answers['experience_field']
        if (experienceField === 'trades') {
          seq.push('trade_type')
        } else if (experienceField === 'warehouse_logistics') {
          seq.push('warehouse_focus')
        } else if (experienceField === 'other') {
          seq.push('experience_field_other')
        }
        
        // Rest of required fields
        seq.push('change_reason', 'move_away', 'strengths', 'physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
        
        return seq
      }
      case 'PATH_3': {
        // PATH_3: Follow canonical order - goal_gate first, then education fields, then others
        // work_during_study is conditional on study_status === 'studying'
        // Conditional follow-ups for education_field
        const answers = state?.answers || {}
        const studyStatus = answers['study_status']
        const seq3: string[] = []
        
        // goal_gate is ALWAYS required first
        seq3.push('goal_gate')
        
        // education fields
        seq3.push('education_level', 'education_field')
        
        // Conditional follow-ups for education_field
        const educationField = answers['education_field']
        if (educationField === 'it_digital') {
          seq3.push('it_focus')
        } else if (educationField === 'healthcare_care') {
          seq3.push('care_focus')
        } else if (educationField === 'other') {
          seq3.push('education_field_other')
        }
        
        // study_status
        seq3.push('study_status')
        
        // work_during_study is conditional on study_status === 'studying'
        if (studyStatus === 'studying') {
          seq3.push('work_during_study')
        }
        
        seq3.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
        return seq3
      }
      case 'PATH_4': {
        // PATH_4: Build sequence with conditional follow-ups for both education_field and experience_field
        const answers = state?.answers || {}
        const seq: string[] = []
        
        // goal_gate is ALWAYS required first
        seq.push('goal_gate')
        
        // education fields
        seq.push('education_level', 'education_field')
        
        // Conditional follow-ups for education_field
        const educationField = answers['education_field']
        if (educationField === 'it_digital') {
          seq.push('it_focus')
        } else if (educationField === 'healthcare_care') {
          seq.push('care_focus')
        } else if (educationField === 'other') {
          seq.push('education_field_other')
        }
        
        // experience_field
        seq.push('experience_field')
        
        // Conditional follow-ups for experience_field
        const experienceField = answers['experience_field']
        if (experienceField === 'trades') {
          seq.push('trade_type')
        } else if (experienceField === 'warehouse_logistics') {
          seq.push('warehouse_focus')
        } else if (experienceField === 'other') {
          seq.push('experience_field_other')
        }
        
        // Rest of required fields
        seq.push('change_reason', 'move_away', 'transferable_strengths', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness')
        
        return seq
      }
      case 'PATH_5':
        // PATH_5: Use canonical sequence (includes goal_gate)
        return CANONICAL_QUESTION_IDS.PATH_5
      default:
        return []
    }
  }
  
  // RESULT phase: no questions
  if (currentPhase === 'RESULT' || phase === 'recommendation') {
    return []
  }
  
  return []
}


/**
 * Check if a question has been answered
 */
function isQuestionAnswered(state: any, questionId: string): boolean {
  const answers = state?.answers || {}
  return answers[questionId] !== undefined
}




/**
 * ============================================
 * PURE FUNCTIONS - NO RECURSION, NO AI, NO MUTATION
 * ============================================
 */

/**
 * A) classifyIfNeeded(state) -> question | null
 * Pure function: Returns classification question if needed, null if complete
 * NEVER calls AI, NEVER mutates state, NEVER calls other question functions
 * 
 * STAGE 2.1: QUESTION LOCKING - Only returns questions where state.answers[field] === undefined
 * Locked questions (where state.answers[field] !== undefined) are NEVER returned
 */
function classifyIfNeeded(state: any): AIResponse['question'] | null {
  // If classification is already done, return null
  if (state?.classification_done === true) {
    return null
  }
  
  const answers = state?.answers || {}
  
  // STAGE 2.1: SINGLE SOURCE OF TRUTH - Only check state.answers
  // If field exists in state.answers, it's LOCKED - never ask again
  
  // Check edu - LOCKED if state.answers['edu'] !== undefined
  if (answers['edu'] === undefined) {
    return getQuestionById('edu')
  }
  
  // Check exp - LOCKED if state.answers['exp'] !== undefined
  if (answers['exp'] === undefined) {
    return getQuestionById('exp')
  }
  
  // Check rel (only if edu=yes AND exp=yes) - LOCKED if state.answers['rel'] !== undefined
  const edu = answers['edu']
  const exp = answers['exp']
  if (edu === 'yes' && exp === 'yes') {
    if (answers['rel'] === undefined) {
      return getQuestionById('rel')
    }
  }
  
  // Classification complete
  return null
}

/**
 * ANTI-LOOP HELPER: getNextMissingQuestion(state) -> question | null
 * Returns the next missing question based on current phase and path
 * Used to force progression when AI tries to repeat questions
 */
function getNextMissingQuestion(state: any): AIResponse['question'] | null {
  const currentPhase = getCurrentPhase(state)
  
  if (currentPhase === 'CLASSIFY') {
    // For classification: edu -> exp -> rel -> goal_gate
    return classifyIfNeeded(state)
  } else if (currentPhase === 'PATH') {
    // For path: first missing required field
    const pgQuestion = maybeTriggerPreferenceGate(state)
    if (pgQuestion) {
      return pgQuestion
    }
    return getNextPathQuestion(state)
  }
  
  // No more questions
  return null
}

/**
 * B) getNextPathQuestion(state) -> question | null
 * Pure function: Returns next path question based on canonical sequence
 * NEVER references edu/exp/rel, NEVER calls AI, NEVER mutates state
 * 
 * CANONICAL FIELD LOCKING:
 * - Returns FIRST question where state.answers[field] === undefined
 * - If field exists in state.answers, it is LOCKED - skip it
 * - Only canonical field IDs are allowed
 * - Server-driven selection (not AI)
 */
function getNextPathQuestion(state: any): AIResponse['question'] | null {
  const path = state?.path
  if (!path) {
    return null
  }
  
  const answers = state?.answers || {}
  
  // Get canonical sequence for this path
  let canonicalSequence: readonly string[] = []
  
  switch (path) {
    case 'PATH_1': {
      // PATH_1: Follow exact canonical order: goal_gate, priorities (conditional), then others
      // Build sequence based on canonical order
      const seq: string[] = []
      
      // 1) goal_gate is ALWAYS required first
      seq.push('goal_gate')
      
      // 2) priorities is conditional on goal_gate !== 'not_sure'
      const goalType = answers['goal_gate']
      if (goalType && goalType !== 'not_sure') {
        seq.push('priorities')
      }
      
      // 3) Rest of required fields in canonical order
      seq.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
      
      canonicalSequence = seq
      break
    }
    case 'PATH_2': {
      // PATH_2: Build sequence with conditional follow-ups for experience_field
      const seq: string[] = []
      
      // 1) goal_gate is ALWAYS required first
      seq.push('goal_gate')
      
      // 2) experience_field
      seq.push('experience_field')
      
      // 3) Conditional follow-ups for experience_field
      const experienceField = answers['experience_field']
      if (experienceField === 'trades') {
        seq.push('trade_type')
      } else if (experienceField === 'warehouse_logistics') {
        seq.push('warehouse_focus')
      } else if (experienceField === 'other') {
        seq.push('experience_field_other')
      }
      
      // 4) Rest of required fields
      seq.push('change_reason', 'move_away', 'strengths', 'physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
      
      canonicalSequence = seq
      break
    }
    case 'PATH_3': {
      // PATH_3: Follow exact canonical order: goal_gate, education fields, then others
      // work_during_study is conditional on study_status === 'studying'
      // Conditional follow-ups for education_field
      const seq: string[] = []
      
      // 1) goal_gate is ALWAYS required first
      seq.push('goal_gate')
      
      // 2) education fields
      seq.push('education_level', 'education_field')
      
      // 3) Conditional follow-ups for education_field
      const educationField = answers['education_field']
      if (educationField === 'it_digital') {
        seq.push('it_focus')
      } else if (educationField === 'healthcare_care') {
        seq.push('care_focus')
      } else if (educationField === 'other') {
        seq.push('education_field_other')
      }
      
      // 4) study_status
      seq.push('study_status')
      
      // 5) work_during_study is conditional on study_status === 'studying'
      const studyStatus = answers['study_status']
      if (studyStatus === 'studying') {
        seq.push('work_during_study')
      }
      
      // 6) Rest of required fields in canonical order
      seq.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
      
      canonicalSequence = seq
      break
    }
    case 'PATH_4': {
      // PATH_4: Build sequence with conditional follow-ups for both education_field and experience_field
      const seq: string[] = []
      
      // 1) goal_gate is ALWAYS required first
      seq.push('goal_gate')
      
      // 2) education fields
      seq.push('education_level', 'education_field')
      
      // 3) Conditional follow-ups for education_field
      const educationField = answers['education_field']
      if (educationField === 'it_digital') {
        seq.push('it_focus')
      } else if (educationField === 'healthcare_care') {
        seq.push('care_focus')
      } else if (educationField === 'other') {
        seq.push('education_field_other')
      }
      
      // 4) experience_field
      seq.push('experience_field')
      
      // 5) Conditional follow-ups for experience_field
      const experienceField = answers['experience_field']
      if (experienceField === 'trades') {
        seq.push('trade_type')
      } else if (experienceField === 'warehouse_logistics') {
        seq.push('warehouse_focus')
      } else if (experienceField === 'other') {
        seq.push('experience_field_other')
      }
      
      // 6) Rest of required fields
      seq.push('change_reason', 'move_away', 'transferable_strengths', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness')
      
      canonicalSequence = seq
      break
    }
    case 'PATH_5':
      canonicalSequence = CANONICAL_QUESTION_IDS.PATH_5
      break
    default:
      return null
  }
  
  // CANONICAL FIELD LOCKING: Iterate ordered list, return FIRST where state.answers[field] === undefined
  // If field exists in state.answers, it is LOCKED - skip it
  for (const questionId of canonicalSequence) {
    // HARD LOCK CHECK: If field exists in state.answers, it's locked - skip
    if (answers[questionId] === undefined) {
      // Validate question ID is canonical (safety check)
      const question = getQuestionById(questionId)
      if (question) {
        return question
      }
      // If question doesn't exist, log warning but continue to next
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[getNextPathQuestion] Non-canonical or missing question ID: ${questionId}`)
      }
    }
  }
  
  // All path questions answered (or locked)
  return null
}

/**
 * C) maybeTriggerPreferenceGate(state) -> question | null
 * Pure function: Returns preference gate question if needed, null otherwise
 * NEVER references edu, NEVER calls AI, NEVER mutates state
 * 
 * STAGE 2.1: QUESTION LOCKING - Only returns questions where state.answers[field] === undefined
 * Locked questions are NEVER returned
 */
function maybeTriggerPreferenceGate(state: any): AIResponse['question'] | null {
  // If preference gate already done, return null
  if (state?.preference_gate_done === true) {
    return null
  }
  
  const path = state?.path
  // Only for PATH_1, PATH_2, PATH_3, PATH_4, and PATH_5
  if (path !== 'PATH_1' && path !== 'PATH_2' && path !== 'PATH_3' && path !== 'PATH_4' && path !== 'PATH_5') {
    return null
  }
  
  const answers = state?.answers || {}
  const preferences = state?.preferences || {}
  
  // CANONICAL FIELD LOCKING: Check if all required path questions are answered
  // Use areAllRequiredFieldsAnswered for consistency
  const allRequiredAnswered = areAllRequiredFieldsAnswered(state)
  
  if (!allRequiredAnswered) {
    // Still have path questions to answer - preference gate should not trigger
    return null
  }
  
  if (!allRequiredAnswered) {
    // Still have path questions to answer
    return null
  }
  
  // Check confidence (must be < 0.8 to trigger preference gate)
  const confidence = computeConfidence(state)
  if (confidence >= 0.8) {
    return null
  }
  
  // Check if we can skip preference gate (simplified logic)
  // For PATH_1: if priorities includes 'any_job_now' and all clear signals
  if (path === 'PATH_1') {
    const priorities = answers['priorities']
    const hasAnyJobNow = Array.isArray(priorities) && priorities.includes('any_job_now')
    if (hasAnyJobNow && 
        answers['physical_ability'] && 
        answers['people_comfort'] && 
        answers['language'] && 
        answers['transport']) {
      // Check enforcement conditions
      const transport = answers['transport']
      const transportAllowsDriving = transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car'
      const peopleComfort = answers['people_comfort']
      const peopleComfortSuggestsCustomerFacing = peopleComfort === 'comfortable'
      const goalType = answers['goal_gate']
      const isSideIncome = goalType === 'side_income'
      const prioritiesArray = Array.isArray(priorities) ? priorities : []
      const hasFlexibilityOrBetterIncome = prioritiesArray.includes('flexibility') || prioritiesArray.includes('better_income')
      
      // If none of the enforcement conditions are true, skip preference gate
      if (!transportAllowsDriving && !peopleComfortSuggestsCustomerFacing && !isSideIncome && !hasFlexibilityOrBetterIncome) {
        return null
      }
    }
  }
  
  // STAGE 2.1: Get next preference gate question - check state.answers first (single source of truth)
  // If field exists in state.answers OR preferences, it's LOCKED - never ask again
  const isLocked = (key: string) => {
    // Check state.answers first (single source of truth)
    if (answers[key] !== undefined) {
      return true
    }
    // Also check preferences for preference gate questions
    if (preferences[key] !== undefined) {
      return true
    }
    return false
  }
  
  // PG1: work_style - LOCKED if state.answers['work_style'] !== undefined
  if (!isLocked('work_style')) {
    return getQuestionById('work_style')
  }
  
  // PG2: customer_interaction - LOCKED if state.answers['customer_interaction'] !== undefined
  if (!isLocked('customer_interaction')) {
    return getQuestionById('customer_interaction')
  }
  
  // PG3: driving_interest (conditional on transport) - LOCKED if state.answers['driving_interest'] !== undefined
  const transport = answers['transport']
  const shouldAskDriving = transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car'
  
  if (shouldAskDriving && !isLocked('driving_interest')) {
    return getQuestionById('driving_interest')
  }
  
  // All preference gate questions answered (or locked)
  return null
}


/**
 * Get question object by ID (includes all question definitions)
 */
function getQuestionById(questionId: string): AIResponse['question'] | null {
  // Internal map uses old format with id/text, will be normalized before return
  const questionMap: Record<string, {
    id: string
    text: string
    type: 'single' | 'multi'
    options: Array<{ id: string; text: string; label?: string; value?: string }>
    max_select?: number
  }> = {
    'edu': {
      id: 'edu',
      text: 'Do you have any formal education or qualifications?',
      type: 'single',
      options: [
        { id: 'no', text: 'No', label: 'No', value: 'no' },
        { id: 'yes', text: 'Yes', label: 'Yes', value: 'yes' }
      ]
    },
    'exp': {
      id: 'exp',
      text: 'Do you have work experience?',
      type: 'single',
      options: [
        { id: 'no', text: 'No', label: 'No', value: 'no' },
        { id: 'yes', text: 'Yes', label: 'Yes', value: 'yes' }
      ]
    },
    'rel': {
      id: 'rel',
      text: 'Is your work experience related to your education?',
      type: 'single',
      options: [
        { id: 'yes', text: 'Yes', label: 'Yes', value: 'yes' },
        { id: 'no', text: 'No', label: 'No', value: 'no' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'goal_gate': {
      id: 'goal_gate',
      text: 'What are you looking for right now?',
      type: 'single',
      options: [
        { id: 'main_job', text: 'A full-time / main job', label: 'A full-time / main job', value: 'main_job' },
        { id: 'side_income', text: 'A part-time / side income', label: 'A part-time / side income', value: 'side_income' },
        { id: 'study_work', text: 'Work while studying', label: 'Work while studying', value: 'study_work' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'priorities': {
      id: 'priorities',
      text: 'What matters most to you right now? (Pick up to 2)',
      type: 'multi',
      max_select: 2,
      options: [
        { id: 'stability', text: 'Stability', label: 'Stability', value: 'stability' },
        { id: 'less_stress', text: 'Less stress', label: 'Less stress', value: 'less_stress' },
        { id: 'better_income', text: 'Better income', label: 'Better income', value: 'better_income' },
        { id: 'flexibility', text: 'Flexibility', label: 'Flexibility', value: 'flexibility' },
        { id: 'physical_ease', text: 'Physical ease', label: 'Physical ease', value: 'physical_ease' },
        { id: 'any_job_now', text: 'Any job for now', label: 'Any job for now', value: 'any_job_now' }
      ]
    },
    'physical_ability': {
      id: 'physical_ability',
      text: 'What is your physical ability level?',
      type: 'single',
      options: [
        { id: 'no_limitations', text: 'No limitations', label: 'No limitations', value: 'no_limitations' },
        { id: 'light_physical', text: 'Light physical work only', label: 'Light physical work only', value: 'light_physical' },
        { id: 'prefer_non_physical', text: 'Prefer non-physical work', label: 'Prefer non-physical work', value: 'prefer_non_physical' },
        { id: 'health_limitations', text: 'Health limitations', label: 'Health limitations', value: 'health_limitations' }
      ]
    },
    'people_comfort': {
      id: 'people_comfort',
      text: 'How comfortable are you working with people?',
      type: 'single',
      options: [
        { id: 'prefer_not', text: 'Prefer not to', label: 'Prefer not to', value: 'prefer_not' },
        { id: 'okay_sometimes', text: 'Okay sometimes', label: 'Okay sometimes', value: 'okay_sometimes' },
        { id: 'comfortable', text: 'Comfortable with people', label: 'Comfortable with people', value: 'comfortable' }
      ]
    },
    'language': {
      id: 'language',
      text: 'What is your English language level?',
      type: 'single',
      options: [
        { id: 'basic', text: 'Basic', label: 'Basic', value: 'basic' },
        { id: 'simple_instructions', text: 'Can follow simple instructions', label: 'Can follow simple instructions', value: 'simple_instructions' },
        { id: 'comfortable', text: 'Comfortable', label: 'Comfortable', value: 'comfortable' },
        { id: 'fluent', text: 'Fluent', label: 'Fluent', value: 'fluent' }
      ]
    },
    'transport': {
      id: 'transport',
      text: 'What is your transport situation?',
      type: 'single',
      options: [
        { id: 'no_licence', text: 'No licence', label: 'No licence', value: 'no_licence' },
        { id: 'licence_no_car', text: 'Licence but no car', label: 'Licence but no car', value: 'licence_no_car' },
        { id: 'car', text: 'Car', label: 'Car', value: 'car' },
        { id: 'van_professional', text: 'Van / professional vehicle', label: 'Van / professional vehicle', value: 'van_professional' }
      ]
    },
    'training_openness': {
      id: 'training_openness',
      text: 'Are you open to training?',
      type: 'single',
      options: [
        { id: 'yes_short', text: 'Yes, short courses or licences', label: 'Yes, short courses or licences', value: 'yes_short' },
        { id: 'maybe_depends', text: 'Maybe, depends on time/cost', label: 'Maybe, depends on time/cost', value: 'maybe_depends' },
        { id: 'no_work_soon', text: 'No, I want to work as soon as possible', label: 'No, I want to work as soon as possible', value: 'no_work_soon' }
      ]
    },
    'shift_availability': {
      id: 'shift_availability',
      text: 'What shift availability do you have?',
      type: 'single',
      options: [
        { id: 'flexible', text: 'Flexible', label: 'Flexible', value: 'flexible' },
        { id: 'evenings', text: 'Evenings only', label: 'Evenings only', value: 'evenings' },
        { id: 'weekends', text: 'Weekends only', label: 'Weekends only', value: 'weekends' },
        { id: 'limited', text: 'Limited availability', label: 'Limited availability', value: 'limited' }
      ]
    },
    'intent': {
      id: 'intent',
      text: 'What is your primary intent?',
      type: 'single',
      options: [
        { id: 'work_while_studying', text: 'Work while studying', label: 'Work while studying', value: 'work_while_studying' },
        { id: 'entry_level', text: 'Entry-level position', label: 'Entry-level position', value: 'entry_level' },
        { id: 'career_start', text: 'Start a career', label: 'Start a career', value: 'career_start' }
      ]
    },
    'experience_field': {
      id: 'experience_field',
      text: 'What field is your work experience in?',
      type: 'single',
      options: [
        { id: 'hospitality_restaurants', text: 'Hospitality / restaurants', label: 'Hospitality / restaurants', value: 'hospitality_restaurants' },
        { id: 'warehouse_logistics', text: 'Warehouse / logistics', label: 'Warehouse / logistics', value: 'warehouse_logistics' },
        { id: 'cleaning', text: 'Cleaning', label: 'Cleaning', value: 'cleaning' },
        { id: 'construction_labour', text: 'Construction / labour', label: 'Construction / labour', value: 'construction_labour' },
        { id: 'trades', text: 'Trades (mechanic / tailor / carpentry / skilled)', label: 'Trades (mechanic / tailor / carpentry / skilled)', value: 'trades' },
        { id: 'retail_customer', text: 'Retail / customer-facing', label: 'Retail / customer-facing', value: 'retail_customer' },
        { id: 'office_admin', text: 'Office / admin', label: 'Office / admin', value: 'office_admin' },
        { id: 'other', text: 'Other (specify)', label: 'Other (specify)', value: 'other' }
      ]
    },
    'change_reason': {
      id: 'change_reason',
      text: 'Why do you want to change?',
      type: 'single',
      options: [
        { id: 'burnout_stress', text: 'Burnout / stress', label: 'Burnout / stress', value: 'burnout_stress' },
        { id: 'physical_strain', text: 'Physical strain', label: 'Physical strain', value: 'physical_strain' },
        { id: 'low_income', text: 'Low income', label: 'Low income', value: 'low_income' },
        { id: 'no_growth', text: 'No growth', label: 'No growth', value: 'no_growth' },
        { id: 'unstable_work', text: 'Unstable work', label: 'Unstable work', value: 'unstable_work' },
        { id: 'want_different', text: 'Want something different', label: 'Want something different', value: 'want_different' }
      ]
    },
    'move_away': {
      id: 'move_away',
      text: 'What do you want to move away from? (Pick up to 2)',
      type: 'multi',
      max_select: 2,
      options: [
        { id: 'physical_work', text: 'Physical work', label: 'Physical work', value: 'physical_work' },
        { id: 'long_hours', text: 'Long hours', label: 'Long hours', value: 'long_hours' },
        { id: 'customer_pressure', text: 'Customer pressure', label: 'Customer pressure', value: 'customer_pressure' },
        { id: 'high_stress', text: 'High stress', label: 'High stress', value: 'high_stress' },
        { id: 'unstable_income', text: 'Unstable income', label: 'Unstable income', value: 'unstable_income' },
        { id: 'repetitive_tasks', text: 'Repetitive tasks', label: 'Repetitive tasks', value: 'repetitive_tasks' }
      ]
    },
    'strengths': {
      id: 'strengths',
      text: 'What are your main strengths? (Pick up to 2)',
      type: 'multi',
      max_select: 2,
      options: [
        { id: 'reliability', text: 'Reliability', label: 'Reliability', value: 'reliability' },
        { id: 'working_under_pressure', text: 'Working under pressure', label: 'Working under pressure', value: 'working_under_pressure' },
        { id: 'teamwork', text: 'Teamwork', label: 'Teamwork', value: 'teamwork' },
        { id: 'speed_efficiency', text: 'Speed / efficiency', label: 'Speed / efficiency', value: 'speed_efficiency' },
        { id: 'attention_to_detail', text: 'Attention to detail', label: 'Attention to detail', value: 'attention_to_detail' },
        { id: 'problem_solving', text: 'Problem solving', label: 'Problem solving', value: 'problem_solving' },
        { id: 'organisation', text: 'Organisation', label: 'Organisation', value: 'organisation' }
      ]
    },
    'transferable_strengths': {
      id: 'transferable_strengths',
      text: 'What transferable strengths do you have? (Pick up to 2)',
      type: 'multi',
      max_select: 2,
      options: [
        { id: 'organisation_planning', text: 'Organisation / planning', label: 'Organisation / planning', value: 'organisation_planning' },
        { id: 'reliability_consistency', text: 'Reliability / consistency', label: 'Reliability / consistency', value: 'reliability_consistency' },
        { id: 'problem_solving', text: 'Problem solving', label: 'Problem solving', value: 'problem_solving' },
        { id: 'attention_to_detail', text: 'Attention to detail', label: 'Attention to detail', value: 'attention_to_detail' },
        { id: 'communication', text: 'Communication', label: 'Communication', value: 'communication' },
        { id: 'teamwork', text: 'Teamwork', label: 'Teamwork', value: 'teamwork' },
        { id: 'working_under_pressure', text: 'Working under pressure', label: 'Working under pressure', value: 'working_under_pressure' }
      ]
    },
    'work_mode': {
      id: 'work_mode',
      text: 'What work mode do you prefer?',
      type: 'single',
      options: [
        { id: 'full_time', text: 'Full-time', label: 'Full-time', value: 'full_time' },
        { id: 'part_time', text: 'Part-time', label: 'Part-time', value: 'part_time' },
        { id: 'flexible', text: 'Flexible', label: 'Flexible', value: 'flexible' }
      ]
    },
    'education_type': {
      id: 'education_type',
      text: 'What type of education do you have?',
      type: 'single',
      options: [
        { id: 'school', text: 'School qualifications', label: 'School qualifications', value: 'school' },
        { id: 'college', text: 'College/Further education', label: 'College/Further education', value: 'college' },
        { id: 'university', text: 'University degree', label: 'University degree', value: 'university' },
        { id: 'vocational', text: 'Vocational training', label: 'Vocational training', value: 'vocational' }
      ]
    },
    'education_field': {
      id: 'education_field',
      text: 'What field is your education in?',
      type: 'single',
      options: [
        { id: 'business_administration', text: 'Business / administration', label: 'Business / administration', value: 'business_administration' },
        { id: 'it_digital', text: 'IT / digital', label: 'IT / digital', value: 'it_digital' },
        { id: 'engineering', text: 'Engineering', label: 'Engineering', value: 'engineering' },
        { id: 'design_creative', text: 'Design / creative', label: 'Design / creative', value: 'design_creative' },
        { id: 'healthcare_care', text: 'Healthcare / care', label: 'Healthcare / care', value: 'healthcare_care' },
        { id: 'education', text: 'Education', label: 'Education', value: 'education' },
        { id: 'other', text: 'Other (specify)', label: 'Other (specify)', value: 'other' }
      ]
    },
    'education_level': {
      id: 'education_level',
      text: 'What is your education level?',
      type: 'single',
      options: [
        { id: 'high_school', text: 'High school', label: 'High school', value: 'high_school' },
        { id: 'college_diploma', text: 'College / diploma', label: 'College / diploma', value: 'college_diploma' },
        { id: 'university_degree', text: 'University degree', label: 'University degree', value: 'university_degree' },
        { id: 'postgraduate', text: 'Postgraduate', label: 'Postgraduate', value: 'postgraduate' }
      ]
    },
    'study_status': {
      id: 'study_status',
      text: 'What is your current study status?',
      type: 'single',
      options: [
        { id: 'studying', text: 'Currently studying', label: 'Currently studying', value: 'studying' },
        { id: 'completed', text: 'Completed', label: 'Completed', value: 'completed' }
      ]
    },
    'work_during_study': {
      id: 'work_during_study',
      text: 'Are you looking to work during your studies?',
      type: 'single',
      options: [
        { id: 'yes', text: 'Yes', label: 'Yes', value: 'yes' },
        { id: 'no', text: 'No', label: 'No', value: 'no' },
        { id: 'maybe', text: 'Maybe', label: 'Maybe', value: 'maybe' }
      ]
    },
    'education_field_other': {
      id: 'education_field_other',
      text: 'Briefly describe your field (1–3 words).',
      type: 'single',
      options: []
    },
    'experience_field_other': {
      id: 'experience_field_other',
      text: 'Briefly describe your field (1–3 words).',
      type: 'single',
      options: []
    },
    'trade_type': {
      id: 'trade_type',
      text: 'What type of trade?',
      type: 'single',
      options: [
        { id: 'mechanic', text: 'Mechanic', label: 'Mechanic', value: 'mechanic' },
        { id: 'tailoring', text: 'Tailoring', label: 'Tailoring', value: 'tailoring' },
        { id: 'carpentry', text: 'Carpentry', label: 'Carpentry', value: 'carpentry' },
        { id: 'electrical_helper', text: 'Electrical helper', label: 'Electrical helper', value: 'electrical_helper' },
        { id: 'plumbing_helper', text: 'Plumbing helper', label: 'Plumbing helper', value: 'plumbing_helper' },
        { id: 'other_trade', text: 'Other trade', label: 'Other trade', value: 'other_trade' }
      ]
    },
    'it_focus': {
      id: 'it_focus',
      text: 'What IT focus area?',
      type: 'single',
      options: [
        { id: 'it_support_helpdesk', text: 'IT Support / Helpdesk', label: 'IT Support / Helpdesk', value: 'it_support_helpdesk' },
        { id: 'qa_testing', text: 'QA / Testing', label: 'QA / Testing', value: 'qa_testing' },
        { id: 'data_admin', text: 'Data / Admin', label: 'Data / Admin', value: 'data_admin' },
        { id: 'content_digital_support', text: 'Content / Digital support', label: 'Content / Digital support', value: 'content_digital_support' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'care_focus': {
      id: 'care_focus',
      text: 'What care focus area?',
      type: 'single',
      options: [
        { id: 'care_support_non_medical', text: 'Care support (non-medical)', label: 'Care support (non-medical)', value: 'care_support_non_medical' },
        { id: 'nhs_support_roles', text: 'NHS support roles', label: 'NHS support roles', value: 'nhs_support_roles' },
        { id: 'admin_in_healthcare', text: 'Admin in healthcare', label: 'Admin in healthcare', value: 'admin_in_healthcare' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'warehouse_focus': {
      id: 'warehouse_focus',
      text: 'What warehouse focus area?',
      type: 'single',
      options: [
        { id: 'picking_packing', text: 'Picking / packing', label: 'Picking / packing', value: 'picking_packing' },
        { id: 'forklift_machinery', text: 'Forklift / machinery', label: 'Forklift / machinery', value: 'forklift_machinery' },
        { id: 'dispatch_loading', text: 'Dispatch / loading', label: 'Dispatch / loading', value: 'dispatch_loading' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'current_role_type': {
      id: 'current_role_type',
      text: 'What type of role are you currently in?',
      type: 'single',
      options: [
        { id: 'specialist_technical', text: 'Specialist / technical', label: 'Specialist / technical', value: 'specialist_technical' },
        { id: 'operational_hands_on', text: 'Operational / hands-on', label: 'Operational / hands-on', value: 'operational_hands_on' },
        { id: 'client_facing', text: 'Client-facing', label: 'Client-facing', value: 'client_facing' },
        { id: 'supervisory_team_lead', text: 'Supervisory / team lead', label: 'Supervisory / team lead', value: 'supervisory_team_lead' },
        { id: 'mixed', text: 'Mixed', label: 'Mixed', value: 'mixed' }
      ]
    },
    'adjustment_goal': {
      id: 'adjustment_goal',
      text: 'What is your adjustment goal?',
      type: 'single',
      options: [
        { id: 'less_stress', text: 'Less stress', label: 'Less stress', value: 'less_stress' },
        { id: 'better_balance', text: 'Better work-life balance', label: 'Better work-life balance', value: 'better_balance' },
        { id: 'stable_income', text: 'More stable income', label: 'More stable income', value: 'stable_income' },
        { id: 'lighter_workload', text: 'Lighter workload', label: 'Lighter workload', value: 'lighter_workload' },
        { id: 'different_environment', text: 'Different environment (new company/team)', label: 'Different environment (new company/team)', value: 'different_environment' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'pressure_source': {
      id: 'pressure_source',
      text: 'What is the main source of pressure?',
      type: 'single',
      options: [
        { id: 'long_hours', text: 'Long hours', label: 'Long hours', value: 'long_hours' },
        { id: 'high_responsibility', text: 'High responsibility', label: 'High responsibility', value: 'high_responsibility' },
        { id: 'physical_effort', text: 'Physical effort', label: 'Physical effort', value: 'physical_effort' },
        { id: 'customer_pressure', text: 'Customer pressure', label: 'Customer pressure', value: 'customer_pressure' },
        { id: 'tight_deadlines', text: 'Tight deadlines', label: 'Tight deadlines', value: 'tight_deadlines' },
        { id: 'unclear_expectations', text: 'Unclear expectations', label: 'Unclear expectations', value: 'unclear_expectations' }
      ]
    },
    'change_level': {
      id: 'change_level',
      text: 'What level of change are you looking for?',
      type: 'single',
      options: [
        { id: 'small_changes', text: 'Small changes (same field, different environment)', label: 'Small changes (same field, different environment)', value: 'small_changes' },
        { id: 'moderate_changes', text: 'Moderate changes (similar role, lighter responsibilities)', label: 'Moderate changes (similar role, lighter responsibilities)', value: 'moderate_changes' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    },
    'constraints': {
      id: 'constraints',
      text: 'What constraints do you have? (Pick up to 2)',
      type: 'multi',
      max_select: 2,
      options: [
        { id: 'location', text: 'Location', label: 'Location', value: 'location' },
        { id: 'hours', text: 'Hours', label: 'Hours', value: 'hours' },
        { id: 'physical', text: 'Physical limitations', label: 'Physical limitations', value: 'physical' },
        { id: 'family', text: 'Family commitments', label: 'Family commitments', value: 'family' }
      ]
    },
    // Preference Gate questions
    'work_style': {
      id: 'work_style',
      text: 'How do you prefer to work?',
      type: 'single',
      options: [
        { id: 'fixed_place', text: 'Fixed place (same location)', label: 'Fixed place (same location)', value: 'fixed_place' },
        { id: 'moving_delivery', text: 'Moving / delivery', label: 'Moving / delivery', value: 'moving_delivery' },
        { id: 'either', text: 'Either is fine', label: 'Either is fine', value: 'either' }
      ]
    },
    'customer_interaction': {
      id: 'customer_interaction',
      text: 'How do you feel about dealing with customers?',
      type: 'single',
      options: [
        { id: 'prefer_minimal', text: 'Prefer minimal interaction', label: 'Prefer minimal interaction', value: 'prefer_minimal' },
        { id: 'comfortable', text: 'Comfortable', label: 'Comfortable', value: 'comfortable' },
        { id: 'prefer_customer_facing', text: 'Prefer customer-facing work', label: 'Prefer customer-facing work', value: 'prefer_customer_facing' }
      ]
    },
    'driving_interest': {
      id: 'driving_interest',
      text: 'Are you interested in driving or delivery-type work?',
      type: 'single',
      options: [
        { id: 'yes', text: 'Yes', label: 'Yes', value: 'yes' },
        { id: 'no', text: 'No', label: 'No', value: 'no' },
        { id: 'not_sure', text: 'Not sure', label: 'Not sure', value: 'not_sure' }
      ]
    }
  }
  
  const question = questionMap[questionId]
  if (!question) return null
  
  // Normalize options to {value, label} format
  return {
    ...question,
    options: normalizeOptions(question.options)
  }
}


/**
 * Validate assistant message - must be 1-2 sentences and refer to question
 */
function validateAssistantMessage(message: string, question: AIResponse['question'] | null): boolean {
  if (!message || message.trim().length === 0) return false
  
  // Count sentences (rough heuristic: periods, exclamation, question marks)
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length > 2) return false
  
  // If there's a question, message should reference it
  if (question && question.text) {
    // Check if message contains question-related keywords or is very short (likely "Next question:")
    const lowerMessage = message.toLowerCase()
    const hasQuestionRef = lowerMessage.includes('next') || 
                          lowerMessage.includes('question') ||
                          lowerMessage.length < 30 // Very short messages are likely "Next: ..."
    if (!hasQuestionRef && sentences.length > 1) return false
  }
  
  return true
}

/**
 * Check if response is invalid based on progress rules
 */
function isResponseInvalid(parsed: any, state: any): { invalid: boolean; reason?: string } {
  // Rule 1: If done=false, question MUST exist with id/text/options
  if (parsed.done === false) {
    if (!parsed.question) {
      return { invalid: true, reason: 'done=false but question is missing' }
    }
    if (!parsed.question.id || !parsed.question.text || !parsed.question.options) {
      return { invalid: true, reason: 'done=false but question missing required fields' }
    }
    if (!Array.isArray(parsed.question.options) || parsed.question.options.length === 0) {
      return { invalid: true, reason: 'done=false but question.options is empty or not array' }
    }
  }
  
  // Rule 2: If question.id == last_question_id, it's a repeat
  const lastQuestionId = state?.last_question_id
  if (parsed.question?.id && lastQuestionId && parsed.question.id === lastQuestionId) {
    return { invalid: true, reason: `question.id (${parsed.question.id}) repeats last_question_id` }
  }
  
  // Rule 3: assistant_message validation
  if (!validateAssistantMessage(parsed.assistant_message, parsed.question)) {
    return { invalid: true, reason: 'assistant_message is empty, too long, or does not reference question' }
  }
  
  return { invalid: false }
}

/**
 * Refine result based on user preferences
 * Applies preference-based filtering and prioritization to work_now directions
 */
function refineResultWithPreferences(result: AIResponse['result'], state: any): AIResponse['result'] {
  if (!result || !result.work_now || !result.work_now.directions) {
    return result
  }
  
  const preferences = state?.preferences || {}
  const answers = state?.answers || {}
  let directions = [...result.work_now.directions]
  
  // Apply work_style preferences
  if (preferences.work_style === 'fixed_place') {
    // Deprioritize driving_transport
    directions = directions.filter(dir => 
      !dir.direction_id.includes('driving') && 
      !dir.direction_id.includes('transport') &&
      !dir.direction_id.includes('delivery')
    )
  } else if (preferences.work_style === 'moving_delivery') {
    // Prioritize driving_transport (move to front if exists)
    const drivingIndex = directions.findIndex(dir => 
      dir.direction_id.includes('driving') || 
      dir.direction_id.includes('transport') ||
      dir.direction_id.includes('delivery')
    )
    if (drivingIndex > 0) {
      const driving = directions.splice(drivingIndex, 1)[0]
      directions.unshift(driving)
    }
  }
  
  // Apply customer_interaction preferences
  if (preferences.customer_interaction === 'prefer_minimal') {
    // Deprioritize hospitality_front and care_support
    directions = directions.filter(dir => 
      !dir.direction_id.includes('hospitality') && 
      !dir.direction_id.includes('care') &&
      !dir.direction_id.includes('support') &&
      !dir.direction_id.includes('front')
    )
  } else if (preferences.customer_interaction === 'prefer_customer_facing') {
    // Prioritize hospitality_front (move to front if exists)
    const hospitalityIndex = directions.findIndex(dir => 
      dir.direction_id.includes('hospitality') || 
      dir.direction_id.includes('front')
    )
    if (hospitalityIndex > 0) {
      const hospitality = directions.splice(hospitalityIndex, 1)[0]
      directions.unshift(hospitality)
    }
  }
  
  // Apply driving_interest preference
  if (preferences.driving_interest === 'no') {
    // Remove driving_transport even if transport allows it
    directions = directions.filter(dir => 
      !dir.direction_id.includes('driving') && 
      !dir.direction_id.includes('transport') &&
      !dir.direction_id.includes('delivery')
    )
  }
  
  // Ensure we have at least 1 direction (fallback to first original if all filtered)
  if (directions.length === 0 && result.work_now.directions.length > 0) {
    directions = [result.work_now.directions[0]]
  }
  
  // Limit to max 3 directions
  if (directions.length > 3) {
    directions = directions.slice(0, 3)
  }
  
  return {
    ...result,
    work_now: {
      directions
    }
  }
}

/**
 * PATH-SPECIFIC RECOMMENDATION FUNCTIONS
 * Each function generates recommendations based on path-specific logic and key fields
 */

/**
 * PATH_1: No education, no experience
 * Work Now baseline: warehouse_logistics, hospitality_front (if people_comfort != prefer_not), 
 * cleaning (if physical_ability allows)
 * Optional third: security_facilities (if training_openness yes/maybe)
 * Improve Later: Only if training_openness yes/maybe
 */
function recommendPath1(state: any): AIResponse['result'] {
  const answers = state?.answers || {}
  const physicalAbility = answers['physical_ability']
  const peopleComfort = answers['people_comfort']
  const trainingOpenness = answers['training_openness']
  const transport = answers['transport']
  const drivingInterest = answers['driving_interest']
  const priorities = Array.isArray(answers['priorities']) ? answers['priorities'] : []
  
  const workNowDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const improveLaterDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const avoid: string[] = []
  
  // Work Now baseline - choose 2
  // 1. warehouse_logistics (always available unless physical limitations)
  if (physicalAbility !== 'health_limitations' && physicalAbility !== 'prefer_non_physical') {
    const reasons = buildReasons(state, 'warehouse-logistics')
    workNowDirections.push({
      direction_id: 'warehouse-logistics',
      direction_title: 'Warehouse & Logistics',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // 2. hospitality_front (only if people_comfort != prefer_not)
  if (peopleComfort !== 'prefer_not') {
    const reasons = buildReasons(state, 'hospitality-front')
    workNowDirections.push({
      direction_id: 'hospitality-front',
      direction_title: 'Hospitality & Front of House',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // 3. cleaning (only if physical_ability != prefer_nonphysical/health_limits)
  if (physicalAbility !== 'prefer_non_physical' && physicalAbility !== 'health_limitations') {
    const reasons = buildReasons(state, 'cleaner')
    workNowDirections.push({
      direction_id: 'cleaner',
      direction_title: 'Cleaning Services',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Optional third: security_facilities (only if training_openness yes/maybe)
  if ((trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') && workNowDirections.length < 3) {
    const reasons = buildReasons(state, 'security-facilities')
    workNowDirections.push({
      direction_id: 'security-facilities',
      direction_title: 'Security & Facilities',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Ensure at least 2 work_now directions
  if (workNowDirections.length === 0) {
    const reasons = buildReasons(state, 'warehouse-logistics')
    workNowDirections.push({
      direction_id: 'warehouse-logistics',
      direction_title: 'Warehouse & Logistics',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  if (workNowDirections.length === 1) {
    const reasons = buildReasons(state, 'cleaner')
    workNowDirections.push({
      direction_id: 'cleaner',
      direction_title: 'Cleaning Services',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Improve Later (only if training_openness yes/maybe)
  if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
    // Choose 1-2 from: security_facilities (SIA), warehouse_logistics (forklift), 
    // construction_trades (CSCS), driving_transport
    
    // security_facilities (SIA)
    const securityReasons = buildReasons(state, 'security-facilities')
    improveLaterDirections.push({
      direction_id: 'security-facilities',
      direction_title: 'Security & Facilities (SIA Licence)',
      why: securityReasons.bullets,
      chips: securityReasons.chips
    })
    
    // warehouse_logistics (forklift) - if no heavy physical limits
    if (physicalAbility !== 'health_limitations') {
      const warehouseReasons = buildReasons(state, 'warehouse-logistics')
      improveLaterDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics (Forklift Licence)',
        why: warehouseReasons.bullets,
        chips: warehouseReasons.chips
      })
    }
    
    // construction_trades (CSCS) - only if physical_ability is no_limitations/light_only
    if (physicalAbility === 'no_limitations' || physicalAbility === 'light_physical') {
      const constructionReasons = buildReasons(state, 'construction-trades')
      improveLaterDirections.push({
        direction_id: 'construction-trades',
        direction_title: 'Construction & Trades (CSCS Card)',
        why: constructionReasons.bullets,
        chips: constructionReasons.chips
      })
    }
    
    // driving_transport - only if transport indicates car/van AND driving_interest != no
    const transportAllowsDriving = transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car'
    if (transportAllowsDriving && drivingInterest !== 'no') {
      const drivingReasons = buildReasons(state, 'driving-transport')
      improveLaterDirections.push({
        direction_id: 'driving-transport',
        direction_title: 'Driving & Transport (Professional Licence)',
        why: drivingReasons.bullets,
        chips: drivingReasons.chips
      })
    }
  }
  
  // Avoid list - 2 unique items based on constraints
  if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
    avoid.push('Heavy manual roles with long standing or lifting')
  }
  if (peopleComfort === 'prefer_not') {
    avoid.push('Customer-facing roles with constant interaction')
  }
  if (answers['language'] === 'basic') {
    avoid.push('Roles requiring complex communication')
  }
  if (answers['transport'] === 'no_licence') {
    avoid.push('Jobs requiring travel between sites')
  }
  
  // Ensure exactly 2 avoid items
  const uniqueAvoid = Array.from(new Set(avoid))
  while (uniqueAvoid.length < 2) {
    uniqueAvoid.push('Roles requiring extensive training or qualifications')
  }
  const finalAvoid = uniqueAvoid.slice(0, 2)
  
  return {
    summary: 'Starting from scratch with no formal education or work experience, we recommend focusing on entry-level roles that offer immediate work opportunities while building your skills. These directions provide a solid foundation for your career journey in the UK.',
    work_now: {
      directions: workNowDirections.slice(0, 3)
    },
    improve_later: improveLaterDirections.length > 0 ? {
      directions: improveLaterDirections.slice(0, 2)
    } : null,
    avoid: finalAvoid,
    next_step: 'CREATE_CV'
  }
}

/**
 * PATH_2: Experience, no education
 * Work Now must reflect experience_field
 * Improve Later: licence-linked direction relevant to change_reason
 */
function recommendPath2(state: any): AIResponse['result'] {
  const answers = state?.answers || {}
  const goalGate = answers['goal_gate']
  const experienceField = answers['experience_field']
  const tradeType = answers['trade_type']
  const warehouseFocus = answers['warehouse_focus']
  const changeReason = answers['change_reason']
  const moveAway = Array.isArray(answers['move_away']) ? answers['move_away'] : []
  const physicalAbility = answers['physical_ability']
  const peopleComfort = answers['people_comfort']
  const language = answers['language']
  const transport = answers['transport']
  const trainingOpenness = answers['training_openness']
  const drivingInterest = answers['driving_interest']
  
  const workNowDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const improveLaterDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const avoid: string[] = []
  
  // Work Now must reflect experience_field
  if (experienceField === 'hospitality_restaurants') {
    // Include hospitality_front unless moving_away includes customers
    if (!Array.isArray(moveAway) || !moveAway.includes('customers')) {
      if (peopleComfort !== 'prefer_not') {
        const reasons = buildReasons(state, 'hospitality-front')
        workNowDirections.push({
          direction_id: 'hospitality-front',
          direction_title: 'Hospitality & Front of House',
          why: reasons.bullets,
          chips: reasons.chips
        })
      }
    }
  } else if (experienceField === 'trades' || experienceField === 'construction_labour') {
    // Include maintenance_facilities or warehouse_logistics
    const maintenanceReasons = buildReasons(state, 'maintenance-facilities')
    workNowDirections.push({
      direction_id: 'maintenance-facilities',
      direction_title: 'Maintenance & Facilities',
      why: maintenanceReasons.bullets,
      chips: maintenanceReasons.chips
    })
    if (physicalAbility !== 'health_limitations' && physicalAbility !== 'prefer_non_physical') {
      const warehouseReasons = buildReasons(state, 'warehouse-logistics')
      workNowDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics',
        why: warehouseReasons.bullets,
        chips: warehouseReasons.chips
      })
    }
  } else if (experienceField === 'warehouse_logistics') {
    const warehouseReasons = buildReasons(state, 'warehouse-logistics')
    workNowDirections.push({
      direction_id: 'warehouse-logistics',
      direction_title: 'Warehouse & Logistics',
      why: warehouseReasons.bullets,
      chips: warehouseReasons.chips
    })
  } else if (experienceField === 'cleaning') {
    const reasons = buildReasons(state, 'cleaner')
    workNowDirections.push({
      direction_id: 'cleaner',
      direction_title: 'Cleaning Services',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Also include security_facilities if goal_type is side_income
  if (goalGate === 'side_income') {
    const reasons = buildReasons(state, 'security-facilities')
    workNowDirections.push({
      direction_id: 'security-facilities',
      direction_title: 'Security & Facilities',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Ensure at least 1 direction
  if (workNowDirections.length === 0) {
    const reasons = buildReasons(state, 'security-facilities')
    workNowDirections.push({
      direction_id: 'security-facilities',
      direction_title: 'Security & Facilities',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Improve Later: include licence-linked direction relevant to change_reason
  if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
    if (changeReason === 'stress' || (Array.isArray(moveAway) && moveAway.includes('high_stress'))) {
      // stress -> security
      const reasons = buildReasons(state, 'security-facilities')
      improveLaterDirections.push({
        direction_id: 'security-facilities',
        direction_title: 'Security & Facilities (SIA Licence)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    if (changeReason === 'low_income' || (Array.isArray(moveAway) && moveAway.includes('unstable_income'))) {
      // low income -> forklift/warehouse
      if (physicalAbility !== 'health_limitations') {
        const reasons = buildReasons(state, 'warehouse-logistics')
        improveLaterDirections.push({
          direction_id: 'warehouse-logistics',
          direction_title: 'Warehouse & Logistics (Forklift Licence)',
          why: reasons.bullets,
          chips: reasons.chips
        })
      }
    }
    
    if (changeReason === 'physical_strain' || physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
      // physical strain -> office_admin_support only if language comfortable
      if (language === 'comfortable' || language === 'fluent') {
        const reasons = buildReasons(state, 'office-admin')
        improveLaterDirections.push({
          direction_id: 'office-admin',
          direction_title: 'Office & Admin Support',
          why: reasons.bullets,
          chips: reasons.chips
        })
      }
    }
    
    // Default: always include security if no other improve_later
    if (improveLaterDirections.length === 0) {
      const reasons = buildReasons(state, 'security-facilities')
      improveLaterDirections.push({
        direction_id: 'security-facilities',
        direction_title: 'Security & Facilities (SIA Licence)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  }
  
  // Avoid list - 2 unique items based on move_away + constraints
  if (Array.isArray(moveAway) && moveAway.includes('customer_pressure')) {
    avoid.push('Customer-facing roles with high pressure')
  }
  if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
    avoid.push('Heavy manual roles requiring physical strength')
  }
  if (Array.isArray(moveAway) && moveAway.includes('high_stress')) {
    avoid.push('High-pressure fast-paced roles')
  }
  if (Array.isArray(moveAway) && moveAway.includes('unstable_income')) {
    avoid.push('Commission-only or unstable gig work')
  }
  
  // Ensure exactly 2 avoid items
  const uniqueAvoid = Array.from(new Set(avoid))
  while (uniqueAvoid.length < 2) {
    if (!uniqueAvoid.includes('Roles requiring extensive training or qualifications')) {
      uniqueAvoid.push('Roles requiring extensive training or qualifications')
    } else {
      uniqueAvoid.push('Roles that don\'t match your experience background')
    }
  }
  const finalAvoid = uniqueAvoid.slice(0, 2)
  
  // Generate summary
  const summaryParts: string[] = []
  if (experienceField) {
    summaryParts.push(`With your experience in ${experienceField.replace(/_/g, ' ')},`)
  }
  summaryParts.push('we recommend focusing on roles that build on your work background while addressing your transition goals.')
  if (goalGate === 'side_income') {
    summaryParts.push('These options offer flexible scheduling for side income.')
  } else {
    summaryParts.push('These directions provide stable full-time opportunities with clear progression paths.')
  }
  
  return {
    summary: summaryParts.join(' '),
    work_now: {
      directions: workNowDirections.slice(0, 3)
    },
    improve_later: improveLaterDirections.length > 0 ? {
      directions: improveLaterDirections.slice(0, 2)
    } : null,
    avoid: finalAvoid,
    next_step: 'CREATE_CV'
  }
}

/**
 * PATH_3: Education, no experience
 * Work Now must be DIFFERENT from PATH_1
 * - If currently studying: part-time friendly options
 * - If completed: prioritize office_admin_support and digital_ai_adjacent
 * Improve Later: based on education_field
 */
function recommendPath3(state: any): AIResponse['result'] {
  const answers = state?.answers || {}
  const studyStatus = answers['study_status']
  const educationField = answers['education_field']
  const itFocus = answers['it_focus']
  const careFocus = answers['care_focus']
  const language = answers['language']
  const peopleComfort = answers['people_comfort']
  const physicalAbility = answers['physical_ability']
  const trainingOpenness = answers['training_openness']
  const goalGate = answers['goal_gate']
  
  const workNowDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const improveLaterDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const avoid: string[] = []
  
  // Work Now must be DIFFERENT from PATH_1
  if (studyStatus === 'currently_studying') {
    // Include part-time friendly options
    if (peopleComfort !== 'prefer_not') {
      const reasons = buildReasons(state, 'hospitality-front')
      workNowDirections.push({
        direction_id: 'hospitality-front',
        direction_title: 'Hospitality & Front of House',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    if (physicalAbility !== 'health_limitations' && physicalAbility !== 'prefer_non_physical') {
      const reasons = buildReasons(state, 'warehouse-logistics')
      workNowDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    // Include office_admin_support if language comfortable
    if (language === 'comfortable' || language === 'fluent') {
      const reasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  } else if (studyStatus === 'completed') {
    // Prioritize office_admin_support and digital_ai_adjacent (entry roles)
    if (language === 'comfortable' || language === 'fluent') {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
      
      const digitalReasons = buildReasons(state, 'digital-ai-beginner')
      workNowDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles',
        why: digitalReasons.bullets,
        chips: digitalReasons.chips
      })
    }
    
    // hospitality_front is secondary only if language not comfortable or user prefers customer-facing
    if ((language !== 'comfortable' && language !== 'fluent') || (peopleComfort === 'comfortable' && workNowDirections.length < 2)) {
      if (peopleComfort !== 'prefer_not') {
        const reasons = buildReasons(state, 'hospitality-front')
        workNowDirections.push({
          direction_id: 'hospitality-front',
          direction_title: 'Hospitality & Front of House',
          why: reasons.bullets,
          chips: reasons.chips
        })
      }
    }
  }
  
  // Ensure at least 1 direction
  if (workNowDirections.length === 0) {
    if (language === 'comfortable' || language === 'fluent') {
      const reasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: reasons.bullets,
        chips: reasons.chips
      })
    } else {
      const reasons = buildReasons(state, 'warehouse-logistics')
      workNowDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  }
  
  // Improve Later (if training yes/maybe): based on education_field and sub-categories
  if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
    if (educationField === 'business_administration') {
      const reasons = buildReasons(state, 'office-admin')
      improveLaterDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support (Advanced)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    } else if (educationField === 'it_digital') {
      const reasons = buildReasons(state, 'digital-ai-beginner')
      improveLaterDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles (Advanced)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    } else if (educationField === 'healthcare_care') {
      const reasons = buildReasons(state, 'care-support')
      improveLaterDirections.push({
        direction_id: 'care-support',
        direction_title: 'Care & Support',
        why: reasons.bullets,
        chips: reasons.chips
      })
    } else if (educationField === 'education') {
      const reasons = buildReasons(state, 'office-admin')
      improveLaterDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support (School Support)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    } else if (educationField === 'design_creative') {
      const reasons = buildReasons(state, 'digital-ai-beginner')
      improveLaterDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles (Creative)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    // Default if no education_field match
    if (improveLaterDirections.length === 0) {
      if (language === 'comfortable' || language === 'fluent') {
        const reasons = buildReasons(state, 'office-admin')
        improveLaterDirections.push({
          direction_id: 'office-admin',
          direction_title: 'Office & Admin Support (Advanced)',
          why: reasons.bullets,
          chips: reasons.chips
        })
      }
    }
  }
  
  // Avoid list - 2 unique items based on constraints + study_status
  if (studyStatus === 'currently_studying') {
    avoid.push('Heavy full-time roles that conflict with studies')
  }
  if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
    avoid.push('Heavy manual roles requiring physical strength')
  }
  if (peopleComfort === 'prefer_not') {
    avoid.push('Customer-facing roles with constant interaction')
  }
  if (language === 'basic') {
    avoid.push('Roles requiring complex communication')
  }
  
  // Ensure exactly 2 avoid items
  const uniqueAvoid = Array.from(new Set(avoid))
  while (uniqueAvoid.length < 2) {
    uniqueAvoid.push('Roles requiring extensive training or qualifications')
  }
  const finalAvoid = uniqueAvoid.slice(0, 2)
  
  // Generate summary
  const summaryParts: string[] = []
  summaryParts.push('With your education but no work experience,')
  if (studyStatus === 'currently_studying') {
    summaryParts.push('we recommend part-time friendly roles that work around your studies.')
  } else {
    summaryParts.push('we recommend entry-level roles that leverage your education while building practical experience.')
  }
  if (educationField) {
    summaryParts.push(`These directions align with your ${educationField.replace(/_/g, ' ')} background.`)
  }
  
  return {
    summary: summaryParts.join(' '),
    work_now: {
      directions: workNowDirections.slice(0, 3)
    },
    improve_later: improveLaterDirections.length > 0 ? {
      directions: improveLaterDirections.slice(0, 2)
    } : null,
    avoid: finalAvoid,
    next_step: 'CREATE_CV'
  }
}

/**
 * PATH_4: Education + experience not related (Career Redirection)
 * Focus: Skills transfer, not restart
 * Work Now must include at least ONE transferable/adjacent direction if language >= comfortable OR physical prefers non-heavy
 */
function recommendPath4(state: any): AIResponse['result'] {
  const answers = state?.answers || {}
  const goalGate = answers['goal_gate']
  const language = answers['language']
  const physicalAbility = answers['physical_ability']
  const peopleComfort = answers['people_comfort']
  const transport = answers['transport']
  const drivingInterest = answers['driving_interest']
  const educationField = answers['education_field']
  const itFocus = answers['it_focus']
  const careFocus = answers['care_focus']
  const experienceField = answers['experience_field']
  const tradeType = answers['trade_type']
  const warehouseFocus = answers['warehouse_focus']
  const moveAway = Array.isArray(answers['move_away']) ? answers['move_away'] : []
  const trainingOpenness = answers['training_openness']
  
  const workNowDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const improveLaterDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const avoid: string[] = []
  
  const hasPhysicalLimits = physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations'
  const languageComfortable = language === 'comfortable' || language === 'fluent'
  const prefersNonPhysical = physicalAbility === 'prefer_non_physical'
  
  // Check move_away constraints
  const moveAwayCustomers = Array.isArray(moveAway) && moveAway.includes('customer_pressure')
  const moveAwayPhysical = Array.isArray(moveAway) && moveAway.includes('physical_work')
  const moveAwayStress = Array.isArray(moveAway) && moveAway.includes('high_stress')
  
  // Work Now: Must include at least ONE transferable/adjacent direction if language >= comfortable OR physical prefers non-heavy
  if (languageComfortable || prefersNonPhysical) {
    // Add office_admin_support OR digital_ai_adjacent
    if (languageComfortable) {
      const reasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    if (languageComfortable && (educationField === 'it_digital' || educationField === 'engineering' || educationField === 'design_creative')) {
      const reasons = buildReasons(state, 'digital-ai-beginner')
      workNowDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  }
  
  // Additional directions based on goal_gate and constraints
  if (goalGate === 'side_income') {
    // Side income: allow security_facilities / warehouse_logistics / hospitality_front (only if people ok)
    if (!moveAwayPhysical && physicalAbility !== 'health_limitations') {
      const reasons = buildReasons(state, 'security-facilities')
      workNowDirections.push({
        direction_id: 'security-facilities',
        direction_title: 'Security & Facilities',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    if (!moveAwayPhysical && physicalAbility !== 'health_limitations') {
      const reasons = buildReasons(state, 'warehouse-logistics')
      workNowDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    if (!moveAwayCustomers && peopleComfort !== 'prefer_not') {
      const reasons = buildReasons(state, 'hospitality-front')
      workNowDirections.push({
        direction_id: 'hospitality-front',
        direction_title: 'Hospitality & Front of House',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  } else if (goalGate === 'main_job' || goalGate === 'full_time') {
    // Main job: prioritise stable transitions
    if (!moveAwayPhysical && physicalAbility !== 'health_limitations' && physicalAbility !== 'prefer_non_physical') {
      const reasons = buildReasons(state, 'warehouse-logistics')
      workNowDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    
    if (!moveAwayCustomers && peopleComfort !== 'prefer_not' && !moveAwayStress) {
      const reasons = buildReasons(state, 'hospitality-front')
      workNowDirections.push({
        direction_id: 'hospitality-front',
        direction_title: 'Hospitality & Front of House',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  }
  
  // Respect move_away constraints - deprioritise based on move_away
  // Filter out directions that conflict with move_away
  const filteredWorkNow = workNowDirections.filter(dir => {
    if (moveAwayCustomers && (dir.direction_id === 'hospitality-front' || dir.direction_id === 'care-support')) {
      return false
    }
    if (moveAwayPhysical && (dir.direction_id === 'construction-trades' || dir.direction_id === 'warehouse-logistics' || dir.direction_id === 'cleaner')) {
      return false
    }
    if (moveAwayStress && dir.direction_id === 'hospitality-front') {
      return false
    }
    return true
  })
  
  // Ensure at least 1 direction (fallback to office-admin if needed)
  if (filteredWorkNow.length === 0) {
    const reasons = buildReasons(state, 'office-admin')
    filteredWorkNow.push({
      direction_id: 'office-admin',
      direction_title: 'Office & Admin Support',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Improve Later: Include at least one short-step option aligned with redirection
  if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
    // Security & Facilities (SIA)
    const securityReasons = buildReasons(state, 'security-facilities')
    improveLaterDirections.push({
      direction_id: 'security-facilities',
      direction_title: 'Security & Facilities (with SIA licence)',
      why: securityReasons.bullets,
      chips: securityReasons.chips
    })
    
    // Warehouse & Logistics (forklift)
    if (!moveAwayPhysical) {
      const warehouseReasons = buildReasons(state, 'warehouse-logistics')
      improveLaterDirections.push({
        direction_id: 'warehouse-logistics',
        direction_title: 'Warehouse & Logistics (with forklift licence)',
        why: warehouseReasons.bullets,
        chips: warehouseReasons.chips
      })
    }
    
    // Digital & AI-Adjacent (basic digital/QA/data)
    if (languageComfortable) {
      const digitalReasons = buildReasons(state, 'digital-ai-beginner')
      improveLaterDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles (with basic training)',
        why: digitalReasons.bullets,
        chips: digitalReasons.chips
      })
    }
    
    // Maintenance & Facilities (if trades background)
    if (experienceField === 'trades' || experienceField === 'construction_labour') {
      const maintenanceReasons = buildReasons(state, 'maintenance-facilities')
      improveLaterDirections.push({
        direction_id: 'maintenance-facilities',
        direction_title: 'Maintenance & Facilities',
        why: maintenanceReasons.bullets,
        chips: maintenanceReasons.chips
      })
    }
    
    // Driving & Transport (only if transport allows AND driving_interest != no)
    if ((transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car') && drivingInterest !== 'no') {
      const drivingReasons = buildReasons(state, 'driving-transport')
      improveLaterDirections.push({
        direction_id: 'driving-transport',
        direction_title: 'Driving & Transport (with professional licence)',
        why: drivingReasons.bullets,
        chips: drivingReasons.chips
      })
    }
  }
  
  // Avoid list - 2 unique items based on move_away + constraints
  if (moveAwayPhysical) {
    avoid.push('Heavy manual roles with long standing/lifting')
  }
  if (moveAwayCustomers) {
    avoid.push('Customer-facing roles with constant interaction')
  }
  if (moveAwayStress) {
    avoid.push('High-pressure fast-paced environments')
  }
  if (hasPhysicalLimits && !moveAwayPhysical) {
    avoid.push('Heavy manual roles requiring physical strength')
  }
  if (language === 'basic' && !avoid.find(a => a.includes('communication'))) {
    avoid.push('Roles requiring complex communication')
  }
  
  // Ensure exactly 2 avoid items
  const uniqueAvoid = Array.from(new Set(avoid))
  while (uniqueAvoid.length < 2) {
    uniqueAvoid.push('Roles that don\'t leverage your transferable skills')
  }
  const finalAvoid = uniqueAvoid.slice(0, 2)
  
  // Summary must explicitly mention skills transfer
  const educationFieldText = educationField ? educationField.replace(/_/g, ' ').replace('administration', 'administration').replace('it digital', 'IT/digital').replace('design creative', 'design/creative').replace('healthcare care', 'healthcare/care') : 'your field'
  const experienceFieldText = experienceField ? experienceField.replace(/_/g, ' ').replace('hospitality restaurants', 'hospitality/restaurants').replace('warehouse logistics', 'warehouse/logistics').replace('construction labour', 'construction/labour').replace('retail customer', 'retail/customer-facing').replace('office admin', 'office/admin') : 'your field'
  
  return {
    summary: `You have education and experience in different fields. We focused on transferable directions that don't require starting from zero. With your education in ${educationFieldText} and experience in ${experienceFieldText}, these recommendations leverage your existing skills while redirecting your career.`,
    work_now: {
      directions: filteredWorkNow.slice(0, 3)
    },
    improve_later: improveLaterDirections.length > 0 ? {
      directions: improveLaterDirections.slice(0, 2)
    } : null,
    avoid: finalAvoid,
    next_step: 'CREATE_CV'
  }
}

/**
 * PATH_5: Education + related experience (Career Continuation & Adjustment)
 * Goal: adjust role/environment/work pattern, NOT restart
 * 
 * Summary must emphasize adjustments, not restarting
 * Work Now: choose 2 based on role type and constraints
 * Improve Later: only if training_openness yes/maybe, should be "light upskilling"
 * Avoid: 2 unique based on pressure_source and constraints
 */
function recommendPath5(state: any): AIResponse['result'] {
  const answers = state?.answers || {}
  const goalGate = answers['goal_gate']
  const currentRoleType = answers['current_role_type']
  const adjustmentGoal = answers['adjustment_goal']
  const pressureSource = answers['pressure_source']
  const changeLevel = answers['change_level']
  const language = answers['language']
  const physicalAbility = answers['physical_ability']
  const peopleComfort = answers['people_comfort']
  const transport = answers['transport']
  const trainingOpenness = answers['training_openness']
  
  const workNowDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const improveLaterDirections: Array<{ direction_id: string; direction_title: string; why: Array<string>; chips?: Array<string> }> = []
  const avoid: string[] = []
  
  const languageComfortable = language === 'comfortable' || language === 'fluent'
  const physicalStrain = pressureSource === 'physical_effort'
  const customerPressure = pressureSource === 'customer_pressure'
  const tightDeadlines = pressureSource === 'tight_deadlines'
  const longHours = pressureSource === 'long_hours'
  const highResponsibility = pressureSource === 'high_responsibility'
  
  // Work Now: choose 2 based on role type and constraints
  // Specialist/technical + deadlines -> digital_ai_adjacent or office_admin_support (documentation/QA style)
  if (currentRoleType === 'specialist_technical') {
    if (tightDeadlines) {
      const digitalReasons = buildReasons(state, 'digital-ai-beginner')
      workNowDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles',
        why: digitalReasons.bullets,
        chips: digitalReasons.chips
      })
      if (languageComfortable) {
        const officeReasons = buildReasons(state, 'office-admin')
        workNowDirections.push({
          direction_id: 'office-admin',
          direction_title: 'Office & Admin Support',
          why: officeReasons.bullets,
          chips: officeReasons.chips
        })
      }
    } else {
      const digitalReasons = buildReasons(state, 'digital-ai-beginner')
      workNowDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles',
        why: digitalReasons.bullets,
        chips: digitalReasons.chips
      })
      if (languageComfortable) {
        const officeReasons = buildReasons(state, 'office-admin')
        workNowDirections.push({
          direction_id: 'office-admin',
          direction_title: 'Office & Admin Support',
          why: officeReasons.bullets,
          chips: officeReasons.chips
        })
      }
    }
  }
  // Operational/hands-on + physical strain -> maintenance_facilities (lighter) or office_admin_support
  else if (currentRoleType === 'operational_hands_on') {
    if (physicalStrain) {
      const maintenanceReasons = buildReasons(state, 'maintenance-facilities')
      workNowDirections.push({
        direction_id: 'maintenance-facilities',
        direction_title: 'Maintenance & Facilities (Lighter Roles)',
        why: maintenanceReasons.bullets,
        chips: maintenanceReasons.chips
      })
      if (languageComfortable) {
        const officeReasons = buildReasons(state, 'office-admin')
        workNowDirections.push({
          direction_id: 'office-admin',
          direction_title: 'Office & Admin Support',
          why: officeReasons.bullets,
          chips: officeReasons.chips
        })
      }
    } else {
      const maintenanceReasons = buildReasons(state, 'maintenance-facilities')
      workNowDirections.push({
        direction_id: 'maintenance-facilities',
        direction_title: 'Maintenance & Facilities',
        why: maintenanceReasons.bullets,
        chips: maintenanceReasons.chips
      })
      if (languageComfortable) {
        const officeReasons = buildReasons(state, 'office-admin')
        workNowDirections.push({
          direction_id: 'office-admin',
          direction_title: 'Office & Admin Support',
          why: officeReasons.bullets,
          chips: officeReasons.chips
        })
      }
    }
  }
  // Client-facing + customer pressure -> office_admin_support (back-office) and digital_ai_adjacent
  else if (currentRoleType === 'client_facing') {
    if (customerPressure) {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support (Back-Office)',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
      if (currentRoleType === 'specialist_technical' || languageComfortable) {
        const digitalReasons = buildReasons(state, 'digital-ai-beginner')
        workNowDirections.push({
          direction_id: 'digital-ai-beginner',
          direction_title: 'Digital & AI-Adjacent Roles',
          why: digitalReasons.bullets,
          chips: digitalReasons.chips
        })
      }
    } else {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
      if (languageComfortable) {
        const digitalReasons = buildReasons(state, 'digital-ai-beginner')
        workNowDirections.push({
          direction_id: 'digital-ai-beginner',
          direction_title: 'Digital & AI-Adjacent Roles',
          why: digitalReasons.bullets,
          chips: digitalReasons.chips
        })
      }
    }
  }
  // Supervisory + high responsibility -> office_admin_support (coordination) and less direct management roles
  else if (currentRoleType === 'supervisory_team_lead') {
    if (highResponsibility) {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support (Coordination)',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
      const digitalReasons = buildReasons(state, 'digital-ai-beginner')
      workNowDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles',
        why: digitalReasons.bullets,
        chips: digitalReasons.chips
      })
    } else {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
      if (languageComfortable) {
        const digitalReasons = buildReasons(state, 'digital-ai-beginner')
        workNowDirections.push({
          direction_id: 'digital-ai-beginner',
          direction_title: 'Digital & AI-Adjacent Roles',
          why: digitalReasons.bullets,
          chips: digitalReasons.chips
        })
      }
    }
  }
  // Mixed role type - default to office_admin_support and digital_ai_adjacent
  else {
    if (languageComfortable) {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
      const digitalReasons = buildReasons(state, 'digital-ai-beginner')
      workNowDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent Roles',
        why: digitalReasons.bullets,
        chips: digitalReasons.chips
      })
    } else {
      const officeReasons = buildReasons(state, 'office-admin')
      workNowDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support',
        why: officeReasons.bullets,
        chips: officeReasons.chips
      })
    }
  }
  
  // Avoid listing warehouse_logistics/cleaning/hospitality_front as primary unless:
  // goal_gate is side_income AND user explicitly wants it
  // (This is handled by not adding them to workNowDirections unless side_income)
  
  // Ensure exactly 2 Work Now directions
  const finalWorkNow = workNowDirections.slice(0, 2)
  if (finalWorkNow.length === 0) {
    const reasons = buildReasons(state, 'office-admin')
    finalWorkNow.push({
      direction_id: 'office-admin',
      direction_title: 'Office & Admin Support',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  if (finalWorkNow.length === 1 && languageComfortable) {
    const reasons = buildReasons(state, 'digital-ai-beginner')
    finalWorkNow.push({
      direction_id: 'digital-ai-beginner',
      direction_title: 'Digital & AI-Adjacent Roles',
      why: reasons.bullets,
      chips: reasons.chips
    })
  }
  
  // Improve Later: only if training_openness yes/maybe, should be "light upskilling" not major retraining
  if (trainingOpenness === 'yes' || trainingOpenness === 'yes_short' || trainingOpenness === 'maybe' || trainingOpenness === 'maybe_depends') {
    // digital_ai_adjacent (skills upgrade)
    if (currentRoleType === 'specialist_technical' || currentRoleType === 'mixed') {
      const reasons = buildReasons(state, 'digital-ai-beginner')
      improveLaterDirections.push({
        direction_id: 'digital-ai-beginner',
        direction_title: 'Digital & AI-Adjacent (Skills Upgrade)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    // office_admin_support (advanced)
    if (languageComfortable) {
      const reasons = buildReasons(state, 'office-admin')
      improveLaterDirections.push({
        direction_id: 'office-admin',
        direction_title: 'Office & Admin Support (Advanced)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
    // maintenance_facilities (if relevant)
    if (currentRoleType === 'operational_hands_on' || currentRoleType === 'mixed') {
      const reasons = buildReasons(state, 'maintenance-facilities')
      improveLaterDirections.push({
        direction_id: 'maintenance-facilities',
        direction_title: 'Maintenance & Facilities (Advanced)',
        why: reasons.bullets,
        chips: reasons.chips
      })
    }
  }
  
  // Avoid (2 unique): derived from pressure_source and constraints
  // Long hours -> avoid shift-heavy
  if (longHours) {
    avoid.push('Shift-heavy roles with irregular hours')
  }
  // Deadlines -> avoid high-pressure ops
  if (tightDeadlines) {
    avoid.push('High-pressure operational roles with tight deadlines')
  }
  // Customer pressure -> avoid customer-facing
  if (customerPressure) {
    avoid.push('Customer-facing roles with high interaction pressure')
  }
  // Physical effort -> avoid heavy physical
  if (physicalStrain) {
    avoid.push('Heavy manual roles requiring significant physical effort')
  }
  // High responsibility -> avoid high-stakes management
  if (highResponsibility) {
    avoid.push('High-stakes management roles with heavy responsibility')
  }
  // Unclear expectations -> avoid ambiguous roles
  if (pressureSource === 'unclear_expectations') {
    avoid.push('Roles with unclear expectations and ambiguous responsibilities')
  }
  
  // Plus constraints (physical/language)
  if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
    avoid.push('Heavy manual roles requiring physical strength')
  }
  if (language === 'basic' || language === 'limited') {
    avoid.push('Roles requiring complex communication and advanced language skills')
  }
  
  // Ensure exactly 2 avoid items
  const uniqueAvoid = Array.from(new Set(avoid))
  while (uniqueAvoid.length < 2) {
    uniqueAvoid.push('Entry-level roles that don\'t leverage your education and experience')
  }
  const finalAvoid = uniqueAvoid.slice(0, 2)
  
  return {
    summary: `You have education and related experience. We focused on adjustments that reduce pressure without restarting from zero. These recommendations build on your existing background while addressing the specific pressures you're facing.`,
    work_now: {
      directions: finalWorkNow
    },
    improve_later: improveLaterDirections.length > 0 ? {
      directions: improveLaterDirections.slice(0, 2)
    } : null,
    avoid: finalAvoid,
    next_step: 'CREATE_CV'
  }
}

/**
 * Router function that calls the appropriate path-specific recommendation function
 */
function recommendForPath(state: any): AIResponse['result'] {
  const path = state?.path || 'PATH_1'
  
  switch (path) {
    case 'PATH_1':
      return recommendPath1(state)
    case 'PATH_2':
      return recommendPath2(state)
    case 'PATH_3':
      return recommendPath3(state)
    case 'PATH_4':
      return recommendPath4(state)
    case 'PATH_5':
      return recommendPath5(state)
    default:
      // Fallback to PATH_1 logic
      return recommendPath1(state)
  }
}

/**
 * Generate a simple result when AI fails to provide one
 */
function generateSimpleResult(state: any): AIResponse['result'] {
  // Use path-specific recommendation router
  return recommendForPath(state)
}

/**
 * Deduplicate avoid lines in result
 */
function dedupeAvoidLines(result: AIResponse['result']): AIResponse['result'] {
  if (!result || !result.avoid) return result
  
  const uniqueAvoid = Array.from(new Set(result.avoid))
  // Ensure exactly 2 items
  while (uniqueAvoid.length < 2) {
    uniqueAvoid.push('Roles requiring extensive training or qualifications')
  }
  
  return {
    ...result,
    avoid: uniqueAvoid.slice(0, 2)
  }
}

/**
 * Check if all required questions for a path are answered
 * Uses pure functions - no recursion
 */
function areAllQuestionsAnswered(state: any): boolean {
  const phase = getCurrentPhase(state)
  
  if (phase === 'CLASSIFY') {
    return classifyIfNeeded(state) === null
  }
  
  if (phase === 'PATH') {
    const pgQuestion = maybeTriggerPreferenceGate(state)
    const pathQuestion = getNextPathQuestion(state)
    return pgQuestion === null && pathQuestion === null
  }
  
  // RESULT phase: all questions answered
  return true
}

/**
 * STAGE 2.1: RESULT GATE - Check if all required fields for path are answered
 * Result can ONLY be shown if:
 * - classificationComplete === true
 * - all REQUIRED fields for path are answered
 */
function areAllRequiredFieldsAnswered(state: any): boolean {
  // Must have classification complete
  if (!isClassificationComplete(state)) {
    return false
  }
  
  const path = state?.path
  if (!path) {
    return false
  }
  
  const answers = state?.answers || {}
  
  // Get required fields for this path - MUST match canonical sequence exactly
  let requiredFields: string[] = []
  
  switch (path) {
    case 'PATH_1': {
      // PATH_1 canonical required fields in order:
      // 1) goal_gate (ALWAYS required)
      // 2) priorities (conditional on goal_gate !== 'not_sure')
      // 3) physical_ability, people_comfort, language, transport, training_openness
      requiredFields = ['goal_gate']
      
      const goalType = answers['goal_gate']
      if (goalType && goalType !== 'not_sure') {
        requiredFields.push('priorities')
      }
      
      requiredFields.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
      break
    }
    case 'PATH_2': {
      // PATH_2 canonical required fields with conditional follow-ups
      requiredFields = ['goal_gate', 'experience_field']
      
      // Conditional follow-ups for experience_field
      const experienceField = answers['experience_field']
      if (experienceField === 'trades') {
        requiredFields.push('trade_type')
      } else if (experienceField === 'warehouse_logistics') {
        requiredFields.push('warehouse_focus')
      } else if (experienceField === 'other') {
        requiredFields.push('experience_field_other')
      }
      
      // Rest of required fields
      requiredFields.push('change_reason', 'move_away', 'strengths', 'physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
      break
    }
    case 'PATH_3': {
      // PATH_3 canonical required fields in order:
      // 1) goal_gate (ALWAYS required)
      // 2) education_level, education_field
      // 3) Conditional follow-ups for education_field
      // 4) study_status
      // 5) work_during_study (conditional on study_status === 'studying')
      // 6) physical_ability, people_comfort, language, transport, training_openness
      requiredFields = ['goal_gate', 'education_level', 'education_field']
      
      // Conditional follow-ups for education_field
      const educationField = answers['education_field']
      if (educationField === 'it_digital') {
        requiredFields.push('it_focus')
      } else if (educationField === 'healthcare_care') {
        requiredFields.push('care_focus')
      } else if (educationField === 'other') {
        requiredFields.push('education_field_other')
      }
      
      requiredFields.push('study_status')
      
      const studyStatus = answers['study_status']
      if (studyStatus === 'studying') {
        requiredFields.push('work_during_study')
      }
      
      requiredFields.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
      break
    }
    case 'PATH_4': {
      // PATH_4 canonical required fields with conditional follow-ups
      requiredFields = ['goal_gate', 'education_level', 'education_field']
      
      // Conditional follow-ups for education_field
      const educationField = answers['education_field']
      if (educationField === 'it_digital') {
        requiredFields.push('it_focus')
      } else if (educationField === 'healthcare_care') {
        requiredFields.push('care_focus')
      } else if (educationField === 'other') {
        requiredFields.push('education_field_other')
      }
      
      requiredFields.push('experience_field')
      
      // Conditional follow-ups for experience_field
      const experienceField = answers['experience_field']
      if (experienceField === 'trades') {
        requiredFields.push('trade_type')
      } else if (experienceField === 'warehouse_logistics') {
        requiredFields.push('warehouse_focus')
      } else if (experienceField === 'other') {
        requiredFields.push('experience_field_other')
      }
      
      // Rest of required fields
      requiredFields.push('change_reason', 'move_away', 'transferable_strengths', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness')
      break
    }
    case 'PATH_5':
      // PATH_5: goal_gate + required fields
      requiredFields = Array.from(CANONICAL_QUESTION_IDS.PATH_5)
      break
    default:
      return false
  }
  
  // CANONICAL FIELD LOCKING: Check if all required fields are answered (locked)
  // A field is LOCKED if it exists in state.answers (even if value is null/empty)
  const allAnswered = requiredFields.every(field => answers[field] !== undefined)
  
  return allAnswered
}

/**
 * Compute confidence score (0.0-1.0) based on answered questions
 * PATH_1 and PATH_2: base (required) + bonus (preference)
 * Other paths: requiredAnswered/requiredTotal
 */
function computeConfidence(state: any): number {
  const path = state?.path
  const answers = state?.answers || {}
  const preferences = state?.preferences || {}
  
  if (!path) return 0.0
  
  // Helper to check if a question is answered
  const isAnswered = (key: string) => {
    return answers[key] !== undefined || preferences[key] !== undefined
  }
  
  if (path === 'PATH_1') {
    // PATH_1 required signals - MUST match canonical required fields
    // goal_gate is ALWAYS required first
    const requiredQuestions = ['goal_gate']
    
    // priorities is conditional on goal_gate !== 'not_sure'
    const goalType = answers['goal_gate']
    if (goalType && goalType !== 'not_sure') {
      requiredQuestions.push('priorities')
    }
    
    // Rest of required fields
    requiredQuestions.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
    
    const requiredAnswered = requiredQuestions.filter(q => isAnswered(q)).length
    const requiredTotal = requiredQuestions.length
    
    // PATH_1 preference signals
    const preferenceQuestions = ['work_style', 'customer_interaction']
    // Add driving_interest only if transport indicates licence/car
    const transport = answers['transport']
    const shouldIncludeDriving = transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car'
    const preferenceList = shouldIncludeDriving 
      ? [...preferenceQuestions, 'driving_interest']
      : preferenceQuestions
    
    const preferenceAnswered = preferenceList.filter(q => isAnswered(q)).length
    const preferenceTotal = preferenceList.length
    
    // Compute: base (70%) + bonus (30%)
    const base = (requiredAnswered / requiredTotal) * 0.7
    const bonus = preferenceTotal > 0 ? (preferenceAnswered / preferenceTotal) * 0.3 : 0.0
    return Math.min(1.0, base + bonus)
  }
  
  if (path === 'PATH_2') {
    // PATH_2 required signals - MUST match canonical required fields
    // Use canonical sequence for consistency
    const requiredQuestions = Array.from(CANONICAL_QUESTION_IDS.PATH_2)
    const requiredAnswered = requiredQuestions.filter(q => isAnswered(q)).length
    const requiredTotal = requiredQuestions.length
    
    // PATH_2 preference signals (same as PATH_1)
    const preferenceQuestions = ['work_style', 'customer_interaction']
    const transport = answers['transport']
    const shouldIncludeDriving = transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car'
    const preferenceList = shouldIncludeDriving 
      ? [...preferenceQuestions, 'driving_interest']
      : preferenceQuestions
    
    const preferenceAnswered = preferenceList.filter(q => isAnswered(q)).length
    const preferenceTotal = preferenceList.length
    
    // Compute: base (70%) + bonus (30%)
    const base = (requiredAnswered / requiredTotal) * 0.7
    const bonus = preferenceTotal > 0 ? (preferenceAnswered / preferenceTotal) * 0.3 : 0.0
    return Math.min(1.0, base + bonus)
  }
  
  if (path === 'PATH_3') {
    // PATH_3 required signals - MUST match canonical required fields
    // goal_gate is ALWAYS required first
    const requiredQuestions = ['goal_gate', 'education_level', 'education_field', 'study_status']
    
    // work_during_study is conditional on study_status === 'studying'
    const studyStatus = answers['study_status']
    if (studyStatus === 'studying') {
      requiredQuestions.push('work_during_study')
    }
    
    // Rest of required fields
    requiredQuestions.push('physical_ability', 'people_comfort', 'language', 'transport', 'training_openness')
    
    const requiredAnswered = requiredQuestions.filter(q => isAnswered(q)).length
    const requiredTotal = requiredQuestions.length
    
    // PATH_3 preference signals (same as PATH_1 and PATH_2)
    const preferenceQuestions = ['work_style', 'customer_interaction']
    const transport = answers['transport']
    const shouldIncludeDriving = transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car'
    const preferenceList = shouldIncludeDriving 
      ? [...preferenceQuestions, 'driving_interest']
      : preferenceQuestions
    
    const preferenceAnswered = preferenceList.filter(q => isAnswered(q)).length
    const preferenceTotal = preferenceList.length
    
    // Compute: base (70%) + bonus (30%)
    const base = (requiredAnswered / requiredTotal) * 0.7
    const bonus = preferenceTotal > 0 ? (preferenceAnswered / preferenceTotal) * 0.3 : 0.0
    return Math.min(1.0, base + bonus)
  }
  
  // PATH_4, PATH_5: simpler calculation
  let requiredQuestions: string[] = []
  if (path === 'PATH_4') {
    requiredQuestions = ['education_field', 'experience_field', 'change_reason', 'move_away', 'transferable_strengths', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness']
  } else if (path === 'PATH_5') {
    requiredQuestions = ['current_role_type', 'adjustment_goal', 'pressure_source', 'change_level', 'language', 'physical_ability', 'people_comfort', 'transport', 'training_openness']
  }
  
  const requiredAnswered = requiredQuestions.filter(q => isAnswered(q)).length
  const requiredTotal = requiredQuestions.length
  
  return requiredTotal > 0 ? requiredAnswered / requiredTotal : 0.0
}


/**
 * Fallback JSON response - always valid, ensures chat never breaks
 * Uses pure functions for one-directional flow
 */
function getFallbackResponse(state?: any): AIResponse {
  const normalizedState = state || {}
  const currentPhase = getCurrentPhase(normalizedState)
  
  // RESULT phase: return result only
  if (currentPhase === 'RESULT') {
    const confidence = computeConfidence(normalizedState)
    const simpleResult = generateSimpleResult(normalizedState)
    const refinedResult = refineResultWithPreferences(simpleResult, normalizedState)
    const dedupedResult = dedupeAvoidLines(refinedResult)
    return {
      path: normalizedState.path || null,
      phase: 'RESULT',
      assistant_message: 'Here are your recommendations:',
      question: null,
      allow_free_text: false,
      state_updates: {},
      done: true,
      confidence_score: confidence,
      result: dedupedResult
    }
  }
  
  // PATH phase: try preference gate, then path question, else RESULT
  if (currentPhase === 'PATH') {
    // Try preference gate first
    const pgQuestion = maybeTriggerPreferenceGate(normalizedState)
    if (pgQuestion) {
      const confidence = computeConfidence(normalizedState)
      return {
        path: normalizedState.path || null,
        phase: 'PATH',
        assistant_message: `Next: ${pgQuestion.text}`,
        question: pgQuestion,
        allow_free_text: true,
        state_updates: {},
        done: false,
        confidence_score: confidence,
        result: null
      }
    }
    
    // Try path question
    const pathQuestion = getNextPathQuestion(normalizedState)
    if (pathQuestion) {
      const confidence = computeConfidence(normalizedState)
      return {
        path: normalizedState.path || null,
        phase: 'PATH',
        assistant_message: `Next: ${pathQuestion.text}`,
        question: pathQuestion,
        allow_free_text: true,
        state_updates: {},
        done: false,
        confidence_score: confidence,
        result: null
      }
    }
    
    // No more questions - check confidence and return RESULT
    const confidence = computeConfidence(normalizedState)
    if (confidence >= 0.8) {
      const simpleResult = generateSimpleResult(normalizedState)
      const refinedResult = refineResultWithPreferences(simpleResult, normalizedState)
      const dedupedResult = dedupeAvoidLines(refinedResult)
      return {
        path: normalizedState.path || null,
        phase: 'RESULT',
        assistant_message: 'Here are your recommendations:',
        question: null,
        allow_free_text: false,
        state_updates: {},
        done: true,
        confidence_score: confidence,
        result: dedupedResult
      }
    }
    
    // Confidence too low but no questions - still return RESULT (failsafe)
    const simpleResult = generateSimpleResult(normalizedState)
    const refinedResult = refineResultWithPreferences(simpleResult, normalizedState)
    const dedupedResult = dedupeAvoidLines(refinedResult)
    return {
      path: normalizedState.path || null,
      phase: 'RESULT',
      assistant_message: 'Here are your recommendations:',
      question: null,
      allow_free_text: false,
      state_updates: {},
      done: true,
      confidence_score: confidence,
      result: dedupedResult
    }
  }
  
  // CLASSIFY phase: get next classification question
  const classifyQuestion = classifyIfNeeded(normalizedState)
  const confidence = computeConfidence(normalizedState)
  
  return {
    path: normalizedState.path || null,
    phase: 'CLASSIFY',
    assistant_message: classifyQuestion 
      ? `Next: ${classifyQuestion.text}`
      : "Next: Do you have any formal education or qualifications?",
    question: classifyQuestion || getQuestionById('edu'),
    allow_free_text: true,
    state_updates: {},
    done: false,
    confidence_score: confidence,
    result: null
  }
}

/**
 * Extract JSON from text, handling markdown code blocks and other wrappers
 */
function extractJSON(raw: string): any | null {
  try {
    // Try direct parse
    return JSON.parse(raw.trim())
  } catch {
    // Try removing markdown code blocks
    let cleaned = raw.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    try {
      return JSON.parse(cleaned)
    } catch {
      // Try regex extraction: find first {...} block
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch {
          return null
        }
      }
      return null
    }
  }
}

/**
 * Soft schema validation - allows optional fields, but enforces critical structure
 */
function validateAIResponse(data: any): data is AIResponse {
  if (!data || typeof data !== 'object') return false
  
  // Check required top-level keys
  const requiredKeys = ['path', 'phase', 'assistant_message', 'question', 'allow_free_text', 'state_updates', 'done']
  for (const key of requiredKeys) {
    if (!(key in data)) return false
  }
  
  // Validate types
  if (typeof data.assistant_message !== 'string') return false
  if (typeof data.allow_free_text !== 'boolean') return false
  if (typeof data.done !== 'boolean') return false
  if (!['classification', 'assessment', 'recommendation'].includes(data.phase)) return false
  if (data.path !== null && typeof data.path !== 'string') return false
  
  // Validate question (can be null)
  if (data.question !== null) {
    if (typeof data.question !== 'object') return false
    if (typeof data.question.id !== 'string') return false
    if (typeof data.question.text !== 'string') return false
    if (!['single', 'multi'].includes(data.question.type)) return false
    if (!Array.isArray(data.question.options)) return false
    for (const opt of data.question.options) {
      // Accept both old format {id, text} and new format {value, label}
      const hasOldFormat = typeof opt.id === 'string' && typeof opt.text === 'string'
      const hasNewFormat = typeof opt.value === 'string' && typeof opt.label === 'string'
      if (!hasOldFormat && !hasNewFormat) return false
    }
    // max_select is optional - can be null, undefined, or number
    if (data.question.max_select !== null && data.question.max_select !== undefined) {
      if (typeof data.question.max_select !== 'number') return false
    }
  }
  
  // Validate state_updates (must be object)
  if (typeof data.state_updates !== 'object' || Array.isArray(data.state_updates)) return false
  
  // Validate confidence_score (optional, 0.0-1.0)
  if (data.confidence_score !== undefined && data.confidence_score !== null) {
    if (typeof data.confidence_score !== 'number') return false
    if (data.confidence_score < 0.0 || data.confidence_score > 1.0) return false
  }
  
  // Validate result: can be null unless done=true, then it's required
  if (data.done === true) {
    if (data.result === null || data.result === undefined) return false
    if (typeof data.result !== 'object') return false
    if (typeof data.result.summary !== 'string') return false
    if (typeof data.result.next_step !== 'string') return false
    if (!Array.isArray(data.result.avoid)) return false
    if (data.result.avoid.length !== 2) return false
    if (!Array.isArray(data.result.work_now?.directions)) return false
    if (data.result.work_now.directions.length < 1 || data.result.work_now.directions.length > 3) return false
    for (const dir of data.result.work_now.directions) {
      if (typeof dir.direction_id !== 'string' || typeof dir.direction_title !== 'string') return false
      if (!Array.isArray(dir.why) || dir.why.length !== 3) return false
      for (const bullet of dir.why) {
        if (typeof bullet !== 'string') return false
      }
    }
    if (data.result.improve_later !== null && data.result.improve_later !== undefined) {
      if (!Array.isArray(data.result.improve_later.directions)) return false
      if (data.result.improve_later.directions.length < 1 || data.result.improve_later.directions.length > 3) return false
      for (const dir of data.result.improve_later.directions) {
        if (typeof dir.direction_id !== 'string' || typeof dir.direction_title !== 'string') return false
        if (!Array.isArray(dir.why) || dir.why.length !== 3) return false
        for (const bullet of dir.why) {
          if (typeof bullet !== 'string') return false
        }
      }
    }
  } else {
    // If not done, result should be null (but allow undefined for flexibility)
    if (data.result !== null && data.result !== undefined) return false
  }
  
  return true
}

/**
 * Compute path deterministically from classification answers
 * PATH_1: edu="no" AND exp="no"
 * PATH_2: edu="no" AND exp="yes"
 * PATH_3: edu="yes" AND exp="no"
 * PATH_4: edu="yes" AND exp="yes" AND (rel="no" OR rel="not_sure" OR rel === undefined)
 * PATH_5: edu="yes" AND exp="yes" AND rel="yes"
 */
function computePathFromClassification(state: any): string | null {
  const answers = state?.answers || {}
  const classification = state?.classification || {}
  
  const edu = answers['edu'] || classification['edu']
  const exp = answers['exp'] || classification['exp']
  const rel = answers['rel'] || classification['rel']
  
  if (edu === undefined || exp === undefined) {
    return null
  }
  
  if (edu === 'no' && exp === 'no') {
    return 'PATH_1'
  }
  if (edu === 'no' && exp === 'yes') {
    return 'PATH_2'
  }
  if (edu === 'yes' && exp === 'no') {
    return 'PATH_3'
  }
  if (edu === 'yes' && exp === 'yes') {
    if (rel === 'yes') {
      return 'PATH_5'
    } else {
      // rel === 'no' OR rel === 'not_sure' OR rel === undefined
      return 'PATH_4'
    }
  }
  
  return null
}

/**
 * Extract fields from free-text using AI
 * Returns extracted fields with confidence score
 */
async function extractFromFreeText(freeText: string, state: any): Promise<{
  extracted: Record<string, any>
  confidence: number
}> {
  if (!freeText || !freeText.trim()) {
    return { extracted: {}, confidence: 0 }
  }

  // Allowed fields that can be extracted
  const allowedFields = [
    'edu', 'exp', 'goal_type', 'priorities', 'physical_ability',
    'people_comfort', 'language', 'transport', 'training_openness',
    'work_style', 'customer_interaction', 'driving_interest',
    'experience_field', 'experience_field_other', 'change_reason', 'move_away', 'strengths',
    'education_level', 'education_field', 'education_field_other', 'transferable_strengths',
    'trade_type', 'it_focus', 'care_focus', 'warehouse_focus'
  ]

  const extractionPrompt = `You are a field extraction assistant. Your ONLY job is to extract known fields from user text.

STRICT RULES:
1. ONLY extract fields that are explicitly mentioned or clearly implied
2. DO NOT invent values
3. DO NOT decide path
4. DO NOT return questions
5. DO NOT return result
6. DO NOT set done=true
7. ONLY extract from this allowed list: ${allowedFields.join(', ')}
8. STAGE 2.1: QUESTION LOCKING - NEVER extract fields that already exist in state.answers
   - If state.answers[field] !== undefined, the field is LOCKED
   - DO NOT extract locked fields, even if mentioned in free-text
   - Locked fields are FINAL and cannot be overridden

ALLOWED FIELDS AND VALUES:
- edu: "yes" | "no"
- exp: "yes" | "no"
- goal_type: "full_time" | "part_time" | "side_income" | "any"
- priorities: array of strings from: ["stability", "less_stress", "better_income", "flexibility", "physical_ease", "any_job_now"]
- physical_ability: "no_limitations" | "light_physical" | "prefer_non_physical" | "health_limitations"
- people_comfort: "prefer_not" | "okay_sometimes" | "comfortable"
- language: "basic" | "simple_instructions" | "comfortable" | "fluent"
- transport: "no_licence" | "licence_no_car" | "car" | "van_professional"
- training_openness: "yes_short" | "maybe_depends" | "no_work_soon"
- work_style: "fixed_place" | "moving_delivery" | "either"
- customer_interaction: "prefer_minimal" | "comfortable" | "prefer_customer_facing"
- driving_interest: "yes" | "no" | "not_sure"
- experience_field: "hospitality_restaurants" | "warehouse_logistics" | "cleaning" | "construction_labour" | "trades" | "retail_customer" | "office_admin" | "other"
- experience_field_other: free text (1-3 words, only if experience_field == "other")
- trade_type: "mechanic" | "tailoring" | "carpentry" | "electrical_helper" | "plumbing_helper" | "other_trade" (only if experience_field == "trades")
- warehouse_focus: "picking_packing" | "forklift_machinery" | "dispatch_loading" | "not_sure" (only if experience_field == "warehouse_logistics")
- change_reason: "burnout_stress" | "physical_strain" | "low_income" | "no_growth" | "unstable_work" | "want_different"
- move_away: array of strings from: ["physical_work", "long_hours", "customer_pressure", "high_stress", "unstable_income", "repetitive_tasks"] (max 2)
- strengths: array of strings from: ["reliability", "working_under_pressure", "teamwork", "speed_efficiency", "attention_to_detail", "problem_solving", "organisation"] (max 2)
- education_level: "high_school" | "college_diploma" | "university_degree" | "postgraduate"
- education_field: "business_administration" | "it_digital" | "engineering" | "design_creative" | "healthcare_care" | "education" | "other"
- education_field_other: free text (1-3 words, only if education_field == "other")
- it_focus: "it_support_helpdesk" | "qa_testing" | "data_admin" | "content_digital_support" | "not_sure" (only if education_field == "it_digital")
- care_focus: "care_support_non_medical" | "nhs_support_roles" | "admin_in_healthcare" | "not_sure" (only if education_field == "healthcare_care")
- transferable_strengths: array of strings from: ["organisation_planning", "reliability_consistency", "problem_solving", "attention_to_detail", "communication", "teamwork", "working_under_pressure"] (max 2)

OUTPUT FORMAT (JSON only):
{
  "extracted": {
    "field_name": "value"
  },
  "confidence": 0.0-1.0
}

If you cannot extract a field with confidence >= 0.6, DO NOT include it.
If field value is ambiguous, DO NOT include it.
Be conservative - only extract what is clearly stated.

STAGE 2.1: LOCKED FIELDS CHECK:
Before extracting any field, check if it exists in state.answers.
If state.answers[field] !== undefined, DO NOT extract it (field is LOCKED).
Only extract fields where state.answers[field] === undefined.

User text: "${freeText}"

Current state (for context only, DO NOT override existing values):
${JSON.stringify(state, null, 2)}

IMPORTANT: Check state.answers before extracting. If a field is already in state.answers, it's LOCKED - skip it.`

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: extractionPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const rawContent = completion.choices[0]?.message?.content || ''
    if (!rawContent) {
      return { extracted: {}, confidence: 0 }
    }

    const parsed = extractJSON(rawContent)
    if (!parsed || typeof parsed !== 'object') {
      return { extracted: {}, confidence: 0 }
    }

    // Validate and filter extracted fields
    const extracted: Record<string, any> = {}
    const confidence = typeof parsed.confidence === 'number' 
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0

    // Only include allowed fields with valid values
    // STAGE 2.1: Also check if field is locked (exists in state.answers)
    const currentAnswers = state?.answers || {}
    if (parsed.extracted && typeof parsed.extracted === 'object') {
      for (const [field, value] of Object.entries(parsed.extracted)) {
        // Check if field is allowed, has valid value, AND is not locked
        if (allowedFields.includes(field) && value !== undefined && value !== null) {
          // STAGE 2.1: QUESTION LOCKING - Skip if field is locked
          if (currentAnswers[field] === undefined) {
            extracted[field] = value
          } else {
            // Field is locked - skip extraction
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Free-text extraction] Skipped locked field: ${field} (state.answers["${field}"] = ${JSON.stringify(currentAnswers[field])})`)
            }
          }
        }
      }
    }

    return { extracted, confidence }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[UK Career Assistant] Free-text extraction error:', error)
    }
    return { extracted: {}, confidence: 0 }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { state, user_input, free_text, current_question_id } = body

    // SERVER LOGGING: Log received state
    console.log('SERVER received state', state)
    console.log('SERVER phase', state?.phase, 'classification_done', state?.classification_done, 'path', state?.path)
    console.log('SERVER current_question_id', current_question_id)

    if (!user_input) {
      // Return fallback instead of error to keep chat working
      if (process.env.NODE_ENV === 'development') {
        console.warn('[UK Career Assistant] Missing user_input, using fallback')
      }
      return NextResponse.json(getFallbackResponse(state))
    }

    // Normalize state: ensure asked_question_ids and answers exist
    let normalizedState = {
      ...(state || {}),
      asked_question_ids: state?.asked_question_ids || [],
      answers: state?.answers || {},
      locked: state?.locked || {},
      phase: state?.phase || 'CLASSIFY',
      classification_done: state?.classification_done || false,
      classification: state?.classification || {},
      path: state?.path || null
    }

    // ============================================
    // B) SERVER COMMITS ANSWER BEFORE ANY LOGIC
    // ============================================
    // Commit answer deterministically using current_question_id from client
    if (current_question_id && user_input) {
      // Normalize user_input for classify questions
      let normalizedInput: string | string[] = user_input
      if (current_question_id === 'edu' || current_question_id === 'exp' || current_question_id === 'rel') {
        normalizedInput = normalizeClassifyValue(user_input) as string
      }
      
      // Commit to answers
      normalizedState.answers[current_question_id] = normalizedInput
      normalizedState.locked[current_question_id] = true
      
      // Also commit classification fields explicitly
      if (current_question_id === 'edu') {
        normalizedState.classification = {
          ...normalizedState.classification,
          edu: normalizedInput as string
        }
      } else if (current_question_id === 'exp') {
        normalizedState.classification = {
          ...normalizedState.classification,
          exp: normalizedInput as string
        }
      } else if (current_question_id === 'rel') {
        normalizedState.classification = {
          ...normalizedState.classification,
          rel: normalizedInput as string
        }
      }
      
      // Logging
      console.log('COMMIT', current_question_id, normalizedInput)
      console.log('CLASSIFICATION', normalizedState.classification)
    }

    // ============================================
    // STAGE 2: FREE-TEXT INTELLIGENCE
    // ============================================
    // Process free-text if provided and we're in PATH phase (or transitioning to PATH)
    // Only process free-text in PATH phase to avoid interfering with classification
    const phaseForFreeText = getCurrentPhase(normalizedState)
    if (free_text && free_text.trim() && (phaseForFreeText === 'PATH' || normalizedState.path)) {
      const extractionResult = await extractFromFreeText(free_text.trim(), normalizedState)
      
        // Safety guard: Only use extracted data if confidence >= 0.6
      if (extractionResult.confidence >= 0.6 && Object.keys(extractionResult.extracted).length > 0) {
        // STAGE 2.1: SINGLE SOURCE OF TRUTH - Only check state.answers
        // Merge extracted fields with existing state (DO NOT override existing values)
        const currentAnswers = normalizedState.answers || {}
        const mergedAnswers: Record<string, any> = { ...currentAnswers }
        let hasNewFields = false
        
        for (const [field, value] of Object.entries(extractionResult.extracted)) {
          // STAGE 2.1: QUESTION LOCKING - If field exists in state.answers, it's LOCKED
          // NEVER extract or override locked fields, even from free-text
          if (currentAnswers[field] === undefined) {
            // Field is not locked - can extract
            mergedAnswers[field] = value
            hasNewFields = true
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Free-text] Extracted ${field} = ${value} (confidence: ${extractionResult.confidence.toFixed(2)})`)
            }
          } else {
            // STAGE 2.1: Field is LOCKED - skip extraction
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Free-text] Skipped ${field} - LOCKED (state.answers["${field}"] = ${JSON.stringify(currentAnswers[field])})`)
            }
          }
        }
        
        // Update normalizedState with merged answers
        if (hasNewFields) {
          normalizedState = {
            ...normalizedState,
            answers: mergedAnswers
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Free-text] Confidence too low (${extractionResult.confidence.toFixed(2)}) or no fields extracted, ignoring`)
        }
      }
      
      // CRITICAL SAFETY: Free-text extraction NEVER sets path, done, or triggers result
      // These are already enforced by:
      // 1. Extraction prompt explicitly forbids these
      // 2. Extraction function only returns allowed fields
      // 3. Path is computed deterministically from classification answers only
      // 4. Done/result are controlled by pure functions, not free-text
    }

    // ============================================
    // D) CLASSIFY SEQUENCE IS SERVER-ONLY
    // ============================================
    // During CLASSIFY phase: NEVER ask AI, use deterministic server logic
    const currentPhaseBeforeAI = getCurrentPhase(normalizedState)
    
    if (currentPhaseBeforeAI === 'CLASSIFY') {
      // Server picks next question deterministically
      const answers = normalizedState.answers || {}
      const classification = normalizedState.classification || {}
      
      let nextQuestion: AIResponse['question'] | null = null
      let shouldTransitionToPath = false
      
      // Check what's missing
      const edu = answers['edu'] || classification['edu']
      const exp = answers['exp'] || classification['exp']
      const rel = answers['rel'] || classification['rel']
      
      if (edu === undefined) {
        nextQuestion = getQuestionById('edu')
      } else if (exp === undefined) {
        nextQuestion = getQuestionById('exp')
      } else if (edu === 'yes' && exp === 'yes' && rel === undefined) {
        nextQuestion = getQuestionById('rel')
      } else {
        // Classification complete
        shouldTransitionToPath = true
      }
      
      // Build response
      const response: AIResponse = {
        path: null,
        phase: shouldTransitionToPath ? 'PATH' : 'CLASSIFY',
        assistant_message: nextQuestion ? `Next: ${nextQuestion.text}` : 'Classification complete',
        question: nextQuestion,
        allow_free_text: true,
        state_updates: {
          answers: normalizedState.answers,
          locked: normalizedState.locked,
          classification: normalizedState.classification
        },
        done: false,
        result: null
      }
      
      // If classification complete, transition to PATH
      if (shouldTransitionToPath) {
        const finalClassification = extractClassificationAnswers(normalizedState)
        const computedPath = computePathFromClassification(normalizedState)
        
        response.state_updates = {
          ...response.state_updates,
          classification_done: true,
          classification: finalClassification,
          phase: 'PATH',
          path: computedPath
        }
        response.path = computedPath
      }
      
      return NextResponse.json(response)
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[UK Career Assistant] No OPENAI_API_KEY configured')
      // Return a mock response for testing (follows new classification flow)
      const mockResponse: AIResponse = {
        path: null,
        phase: 'classification',
        assistant_message: 'Welcome! Let\'s assess your work situation in the UK. Do you have any formal education or qualifications?',
        question: {
          id: 'edu',
          text: 'Do you have any formal education or qualifications?',
          type: 'single',
          options: [
            { value: 'no', label: 'No' },
            { value: 'yes', label: 'Yes' }
          ]
        },
        allow_free_text: true,
        state_updates: {
          asked_question_ids: ['edu']
        },
        done: false,
        result: null
      }
      return NextResponse.json(mockResponse)
    }

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'system',
        content: PATH_MODULES
      },
      {
        role: 'user',
        content: JSON.stringify({
          state: normalizedState,
          user_input: user_input
        })
      },
      {
        role: 'system',
        content: 'Return ONLY a single JSON object. No markdown, no code fences, no explanations. Return only the JSON object.'
      }
    ]

    // Call OpenAI with JSON mode (force enabled for reliability)
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.2, // Lower temperature for more consistent JSON
      max_tokens: 2000,
      response_format: { type: 'json_object' } // Force JSON mode
    })

    const rawContent = completion.choices[0]?.message?.content || ''
    
    // Log raw response in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[UK Career Assistant] Raw AI response:', rawContent)
    }
    
    if (!rawContent) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[UK Career Assistant] Empty response from AI, using fallback')
      }
      return NextResponse.json(getFallbackResponse(normalizedState))
    }

    // Attempt to extract and parse JSON
    let parsed: any = extractJSON(rawContent)
    
    if (!parsed) {
      // JSON extraction failed - log and use fallback
      if (process.env.NODE_ENV === 'development') {
        console.error('[UK Career Assistant] JSON extraction failed')
        console.error('[UK Career Assistant] Raw content:', rawContent)
      }
      return NextResponse.json(getFallbackResponse(normalizedState))
    }

    // Validate the parsed JSON schema
    if (!validateAIResponse(parsed)) {
      // Schema validation failed - log and use fallback
      if (process.env.NODE_ENV === 'development') {
        console.error('[UK Career Assistant] Schema validation failed')
        console.error('[UK Career Assistant] Parsed data:', JSON.stringify(parsed, null, 2))
        console.error('[UK Career Assistant] Raw content:', rawContent)
      }
      return NextResponse.json(getFallbackResponse(normalizedState))
    }

    // ============================================
    // NORMALIZE OPTIONS: Convert all option shapes to {value, label}
    // ============================================
    if (parsed.question?.options) {
      parsed.question.options = normalizeOptions(parsed.question.options)
    }

    // ============================================
    // ENSURE COMMITTED ANSWERS ARE IN STATE_UPDATES
    // ============================================
    // Answers were already committed at the top using current_question_id
    // Now ensure they're included in the response state_updates
    if (!parsed.state_updates.answers) {
      parsed.state_updates.answers = {}
    }
    // Merge committed answers into state_updates
    Object.assign(parsed.state_updates.answers, normalizedState.answers)
    
    // Also include locked and classification if they exist
    if (normalizedState.locked) {
      parsed.state_updates.locked = normalizedState.locked
    }
    if (normalizedState.classification) {
      parsed.state_updates.classification = normalizedState.classification
    }

    // ============================================
    // ANTI-LOOP GUARD: Server-side duplicate question prevention
    // ============================================
    if (parsed.question?.id) {
      const questionId = parsed.question.id
      const answers = normalizedState.answers || {}
      const lastQuestionId = normalizedState.last_question_id
      
      // Check 1: If question.id already exists in state.answers, it's a repeat - override it
      if (answers[questionId] !== undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[ANTI-LOOP] Question ${questionId} already answered, forcing next missing question`)
        }
        // Force next missing question
        const nextQuestion = getNextMissingQuestion(normalizedState)
        if (nextQuestion) {
          parsed.question = nextQuestion
          parsed.assistant_message = `Next: ${nextQuestion.text}`
          parsed.done = false
        } else {
          // No more questions - go to result
          parsed.done = true
          parsed.phase = 'RESULT'
          parsed.question = null
          if (!parsed.result) {
            parsed.result = generateSimpleResult(normalizedState)
          }
          parsed.assistant_message = 'Here are your recommendations:'
        }
      }
      // Check 2: If question.id matches last_question_id, it's a repeat - override it
      else if (lastQuestionId && questionId === lastQuestionId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[ANTI-LOOP] Question ${questionId} repeats last_question_id, forcing next missing question`)
        }
        // Force next missing question
        const nextQuestion = getNextMissingQuestion(normalizedState)
        if (nextQuestion) {
          parsed.question = nextQuestion
          parsed.assistant_message = `Next: ${nextQuestion.text}`
          parsed.done = false
        } else {
          // No more questions - go to result
          parsed.done = true
          parsed.phase = 'RESULT'
          parsed.question = null
          if (!parsed.result) {
            parsed.result = generateSimpleResult(normalizedState)
          }
          parsed.assistant_message = 'Here are your recommendations:'
        }
      }
    }

    // NEW: Progress validation - check if response violates progress rules
    const validationResult = isResponseInvalid(parsed, normalizedState)
    if (validationResult.invalid) {
        if (process.env.NODE_ENV === 'development') {
        console.warn(`[UK Career Assistant] Progress validation failed: ${validationResult.reason}`)
        }
        
      // Attempt ONE repair call with additional system instruction
        try {
          const repairMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'system',
              content: PATH_MODULES
            },
            {
              role: 'user',
              content: JSON.stringify({
                state: normalizedState,
              user_input: user_input
              })
            },
            {
              role: 'system',
            content: `CRITICAL REPAIR: Return the NEXT concrete question now. No filler. done=false MUST include question with id/text/options. Do not repeat last_question_id=${normalizedState.last_question_id || 'null'}. assistant_message must be 1 sentence and refer to the question. Return JSON only.`
            }
          ]
          
          const repairCompletion = await openai.chat.completions.create({
            model,
            messages: repairMessages,
          temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
          })
          
          const repairContent = repairCompletion.choices[0]?.message?.content || ''
          if (repairContent) {
            const repairParsed = extractJSON(repairContent)
            if (repairParsed && validateAIResponse(repairParsed)) {
            // Validate repair response
            const repairValidation = isResponseInvalid(repairParsed, normalizedState)
            if (!repairValidation.invalid) {
              parsed = repairParsed
            } else {
              // Repair still invalid - use deterministic fallback with pure functions
                if (process.env.NODE_ENV === 'development') {
                console.warn('[UK Career Assistant] Repair still invalid, using deterministic fallback')
                }
              const currentPhaseForRepair = getCurrentPhase(normalizedState)
              let fallbackQuestion: AIResponse['question'] | null = null
              if (currentPhaseForRepair === 'CLASSIFY') {
                fallbackQuestion = classifyIfNeeded(normalizedState)
              } else if (currentPhaseForRepair === 'PATH') {
                fallbackQuestion = maybeTriggerPreferenceGate(normalizedState) || getNextPathQuestion(normalizedState)
              }
              if (fallbackQuestion) {
                  parsed.question = fallbackQuestion
                parsed.assistant_message = `Next: ${fallbackQuestion.text}`
                parsed.done = false
              } else {
                // All questions answered - generate result
                if (normalizedState.path) {
                  parsed.done = true
                  parsed.phase = 'RESULT'
                  parsed.result = parsed.result || generateSimpleResult(normalizedState)
                  parsed.question = null
                  parsed.assistant_message = 'Here are your recommendations:'
                }
              }
                }
              } else {
            // Repair parsing failed - use deterministic fallback with pure functions
            const currentPhaseForRepair = getCurrentPhase(normalizedState)
            let fallbackQuestion: AIResponse['question'] | null = null
            if (currentPhaseForRepair === 'CLASSIFY') {
              fallbackQuestion = classifyIfNeeded(normalizedState)
            } else if (currentPhaseForRepair === 'PATH') {
              fallbackQuestion = maybeTriggerPreferenceGate(normalizedState) || getNextPathQuestion(normalizedState)
            }
            if (fallbackQuestion) {
              parsed.question = fallbackQuestion
              parsed.assistant_message = `Next: ${fallbackQuestion.text}`
              parsed.done = false
            }
          }
        } else {
          // Repair empty - use deterministic fallback with pure functions
          const currentPhaseForRepair = getCurrentPhase(normalizedState)
          let fallbackQuestion: AIResponse['question'] | null = null
          if (currentPhaseForRepair === 'CLASSIFY') {
            fallbackQuestion = classifyIfNeeded(normalizedState)
          } else if (currentPhaseForRepair === 'PATH') {
            fallbackQuestion = maybeTriggerPreferenceGate(normalizedState) || getNextPathQuestion(normalizedState)
          }
          if (fallbackQuestion) {
            parsed.question = fallbackQuestion
            parsed.assistant_message = `Next: ${fallbackQuestion.text}`
            parsed.done = false
          }
          }
        } catch (repairError) {
          // Repair failed - use deterministic fallback with pure functions
          if (process.env.NODE_ENV === 'development') {
            console.error('[UK Career Assistant] Repair attempt failed:', repairError)
          }
        const currentPhaseForRepair = getCurrentPhase(normalizedState)
        let fallbackQuestion: AIResponse['question'] | null = null
        if (currentPhaseForRepair === 'CLASSIFY') {
          fallbackQuestion = classifyIfNeeded(normalizedState)
        } else if (currentPhaseForRepair === 'PATH') {
          fallbackQuestion = maybeTriggerPreferenceGate(normalizedState) || getNextPathQuestion(normalizedState)
        }
          if (fallbackQuestion) {
            parsed.question = fallbackQuestion
          parsed.assistant_message = `Next: ${fallbackQuestion.text}`
          parsed.done = false
        }
      }
    }

    // ============================================
    // ONE-DIRECTIONAL FLOW: CLASSIFY -> PATH -> RESULT
    // ============================================
    // FORCE CLASSIFY DONE -> PATH TRANSITION (ONE TIME)
    if (isClassificationComplete(normalizedState) && !normalizedState.classification_done) {
      // Extract classification answers
      const classification = extractClassificationAnswers(normalizedState)
      
      // Compute path deterministically from classification
      const computedPath = computePathFromClassification(normalizedState)
      
      console.log('[UK Career Assistant] Classification complete, transitioning to PATH. Computed path:', computedPath)
      
      // Update state to mark classification as done and transition to PATH phase
      parsed.state_updates = {
        ...parsed.state_updates,
        classification_done: true,
        classification: classification,
        phase: 'PATH',
        path: computedPath
      }
      
      // Update normalizedState for subsequent checks
      normalizedState = {
        ...normalizedState,
        ...parsed.state_updates,
        classification_done: true,
        classification: classification,
        phase: 'PATH',
        path: computedPath
      }
      
      // Also update parsed.path if it's not set
      if (!parsed.path && computedPath) {
        parsed.path = computedPath
      }
    }
    
    // Get current phase (after potential transition)
    let currentPhase = getCurrentPhase(normalizedState)
    
    // ============================================
    // MAIN FLOW: ONE-DIRECTIONAL
    // ============================================
    
    // 1) If state.phase === "CLASSIFY"
    if (currentPhase === 'CLASSIFY') {
      const classifyQuestion = classifyIfNeeded(normalizedState)
      if (classifyQuestion) {
        // Return classification question
        parsed.question = classifyQuestion
        parsed.assistant_message = `Next: ${classifyQuestion.text}`
        parsed.done = false
        parsed.phase = 'CLASSIFY'
        parsed.result = null
      } else {
        // Classification complete - transition to PATH
        const classification = extractClassificationAnswers(normalizedState)
        const computedPath = computePathFromClassification(normalizedState)
        
        parsed.state_updates = {
          ...parsed.state_updates,
          classification_done: true,
          classification: classification,
          phase: 'PATH',
          path: computedPath
        }
        
        // Update normalizedState for PATH phase logic
        normalizedState = {
          ...normalizedState,
          ...parsed.state_updates,
          classification_done: true,
          classification: classification,
          phase: 'PATH',
          path: computedPath
        }
        
        // Continue to PATH phase logic (do NOT recurse, just continue processing)
        // Update currentPhase to PATH so PATH logic runs
        currentPhase = 'PATH'
      }
    }
    
    // 2) If state.phase === "PATH" (or just transitioned from CLASSIFY)
    if (currentPhase === 'PATH') {
      // a) Try maybeTriggerPreferenceGate
      const pgQuestion = maybeTriggerPreferenceGate(normalizedState)
      if (pgQuestion) {
        parsed.question = pgQuestion
        parsed.assistant_message = `Next: ${pgQuestion.text}`
        parsed.done = false
        parsed.phase = 'PATH'
        parsed.result = null
      }
      // b) Try getNextPathQuestion
      else {
        const pathQuestion = getNextPathQuestion(normalizedState)
        if (pathQuestion) {
          parsed.question = pathQuestion
          parsed.assistant_message = `Next: ${pathQuestion.text}`
          parsed.done = false
          parsed.phase = 'PATH'
          parsed.result = null
        }
        // c) Else: Check result gate before showing result
        else {
          // STAGE 2.1: RESULT GATE - Only show result if classificationComplete AND all required fields answered
          const allRequiredAnswered = areAllRequiredFieldsAnswered(normalizedState)
          if (allRequiredAnswered && isClassificationComplete(normalizedState)) {
            parsed.done = true
            parsed.phase = 'RESULT'
            parsed.question = null
            if (!parsed.result) {
              parsed.result = generateSimpleResult(normalizedState)
            }
            parsed.assistant_message = 'Here are your recommendations:'
          } else {
            // Result gate failed - continue questioning (should not happen if logic is correct)
            if (process.env.NODE_ENV === 'development') {
              console.warn('[UK Career Assistant] Result gate check failed - continuing questions')
            }
            parsed.done = false
            parsed.phase = 'PATH'
            parsed.result = null
            // Try to find any remaining question (should be null if logic is correct)
            const remainingQuestion = maybeTriggerPreferenceGate(normalizedState) || getNextPathQuestion(normalizedState)
            if (remainingQuestion) {
              parsed.question = remainingQuestion
              parsed.assistant_message = `Next: ${remainingQuestion.text}`
            }
          }
        }
      }
    }
    // 3) If state.phase === "RESULT"
    else if (currentPhase === 'RESULT') {
      // Return RESULT only
      parsed.done = true
      parsed.phase = 'RESULT'
      parsed.question = null
      if (!parsed.result) {
        parsed.result = generateSimpleResult(normalizedState)
      }
      parsed.assistant_message = 'Here are your recommendations:'
    }
    
    // Block any forbidden classification questions (safety check)
    if (!parsed.done && parsed.question?.id) {
      const questionId = parsed.question.id
      if (questionId === 'edu' || questionId === 'exp' || questionId === 'rel') {
        if (normalizedState.classification_done === true || currentPhase === 'PATH' || currentPhase === 'RESULT') {
          console.warn(`Blocked forbidden classification question: ${questionId}`)
          // Override with correct question based on phase
          if (currentPhase === 'PATH') {
            const pgQuestion = maybeTriggerPreferenceGate(normalizedState)
            if (pgQuestion) {
              parsed.question = pgQuestion
              parsed.assistant_message = `Next: ${pgQuestion.text}`
            } else {
              const pathQuestion = getNextPathQuestion(normalizedState)
              if (pathQuestion) {
                parsed.question = pathQuestion
                parsed.assistant_message = `Next: ${pathQuestion.text}`
              } else {
                // No more questions - go to RESULT
                parsed.done = true
                parsed.phase = 'RESULT'
                parsed.question = null
                if (!parsed.result) {
                  parsed.result = generateSimpleResult(normalizedState)
                }
                parsed.assistant_message = 'Here are your recommendations:'
              }
            }
          } else {
            // Should not happen, but handle gracefully
            parsed.question = null
            parsed.done = true
            parsed.phase = 'RESULT'
            if (!parsed.result) {
              parsed.result = generateSimpleResult(normalizedState)
            }
            parsed.assistant_message = 'Here are your recommendations:'
          }
        }
      }
    }

    // Store path in state if it was determined
    if (parsed.path && !normalizedState.path) {
      parsed.state_updates = {
        ...parsed.state_updates,
        path: parsed.path
      }
    }
    
    // ============================================
    // STAGE 2.1: HARD DE-DUPLICATION RULE
    // ============================================
    // Before rendering any question: Check if field exists in state.answers
    // If yes → SKIP rendering, do NOT render same field twice under any condition
    if (!parsed.done && parsed.question?.id) {
      const questionId = parsed.question.id
      const answers = normalizedState.answers || {}
      
      // HARD LOCK CHECK: If field exists in state.answers, it's LOCKED - block rendering
      if (answers[questionId] !== undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[UK Career Assistant] STAGE 2.1: Question "${questionId}" is LOCKED (state.answers["${questionId}"] = ${JSON.stringify(answers[questionId])}). Blocking render.`)
        }
        
        // Override with correct question based on phase using pure functions
        if (currentPhase === 'CLASSIFY') {
          const classifyQuestion = classifyIfNeeded(normalizedState)
          if (classifyQuestion) {
            parsed.question = classifyQuestion
            parsed.assistant_message = `Next: ${classifyQuestion.text}`
          } else {
            // Classification complete - transition to PATH
            const classification = extractClassificationAnswers(normalizedState)
            const computedPath = computePathFromClassification(normalizedState)
            parsed.state_updates = {
              ...parsed.state_updates,
              classification_done: true,
              classification: classification,
              phase: 'PATH',
              path: computedPath
            }
            normalizedState = {
              ...normalizedState,
              ...parsed.state_updates,
              classification_done: true,
              classification: classification,
              phase: 'PATH',
              path: computedPath
            }
            currentPhase = 'PATH'
            // Continue to PATH logic below
          }
        } else if (currentPhase === 'PATH') {
          const pgQuestion = maybeTriggerPreferenceGate(normalizedState)
          if (pgQuestion) {
            parsed.question = pgQuestion
            parsed.assistant_message = `Next: ${pgQuestion.text}`
          } else {
            const pathQuestion = getNextPathQuestion(normalizedState)
            if (pathQuestion) {
              parsed.question = pathQuestion
              parsed.assistant_message = `Next: ${pathQuestion.text}`
            } else {
              // No more questions - check result gate before showing result
              const allRequiredAnswered = areAllRequiredFieldsAnswered(normalizedState)
              if (allRequiredAnswered && isClassificationComplete(normalizedState)) {
                parsed.done = true
                parsed.phase = 'RESULT'
                parsed.question = null
                if (!parsed.result) {
                  parsed.result = generateSimpleResult(normalizedState)
                }
                parsed.assistant_message = 'Here are your recommendations:'
              } else {
                // Result gate failed - continue questioning (should not happen if logic is correct)
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[UK Career Assistant] Result gate check failed - continuing questions')
                }
                parsed.done = false
                parsed.phase = 'PATH'
              }
            }
          }
        }
      }
    }

    // COMPUTE CONFIDENCE SCORE: Always compute and add to response
    const updatedStateForConfidence = { ...normalizedState, ...parsed.state_updates }
    const computedConfidence = computeConfidence(updatedStateForConfidence)
    // Use AI-provided confidence_score if present and valid, otherwise use computed
    const confidenceScore = (parsed.confidence_score !== undefined && 
                              typeof parsed.confidence_score === 'number' && 
                              parsed.confidence_score >= 0.0 && 
                              parsed.confidence_score <= 1.0) 
      ? parsed.confidence_score 
      : computedConfidence
    parsed.confidence_score = confidenceScore

    // PREVENT PREMATURE RESULTS: Never return done=true unless confidence >= 0.8 AND result gate passes
    if (parsed.done === true) {
      // STAGE 2.1: RESULT GATE - Check both confidence AND required fields
      const allRequiredAnswered = areAllRequiredFieldsAnswered(updatedStateForConfidence)
      const classificationComplete = isClassificationComplete(updatedStateForConfidence)
      
      if (confidenceScore < 0.8 || !allRequiredAnswered || !classificationComplete) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[UK Career Assistant] Result gate failed: confidence=${confidenceScore.toFixed(2)}, allRequired=${allRequiredAnswered}, classificationComplete=${classificationComplete}`)
        }
        // Force done=false and return next question using pure functions
        parsed.done = false
        parsed.result = null
        
        // Use pure functions based on current phase
        if (currentPhase === 'PATH') {
          const pgQuestion = maybeTriggerPreferenceGate(updatedStateForConfidence)
          if (pgQuestion) {
            parsed.question = pgQuestion
            parsed.assistant_message = `Next: ${pgQuestion.text}`
          } else {
            const pathQuestion = getNextPathQuestion(updatedStateForConfidence)
            if (pathQuestion) {
              parsed.question = pathQuestion
              parsed.assistant_message = `Next: ${pathQuestion.text}`
            } else {
              // No more questions but result gate failed - should not happen
              if (process.env.NODE_ENV === 'development') {
                console.error('[UK Career Assistant] No more questions but result gate failed - this should not happen')
              }
              // Failsafe: still return RESULT but log error
              parsed.done = true
              parsed.phase = 'RESULT'
              parsed.question = null
              if (!parsed.result) {
                parsed.result = generateSimpleResult(updatedStateForConfidence)
              }
              parsed.assistant_message = 'Here are your recommendations:'
            }
          }
        } else if (currentPhase === 'CLASSIFY') {
          const classifyQuestion = classifyIfNeeded(updatedStateForConfidence)
          if (classifyQuestion) {
            parsed.question = classifyQuestion
            parsed.assistant_message = `Next: ${classifyQuestion.text}`
          } else {
            // Classification complete but result gate failed - transition to PATH
            const classification = extractClassificationAnswers(updatedStateForConfidence)
            const computedPath = computePathFromClassification(updatedStateForConfidence)
            parsed.state_updates = {
              ...parsed.state_updates,
              classification_done: true,
              classification: classification,
              phase: 'PATH',
              path: computedPath
            }
            parsed.phase = 'PATH'
            parsed.path = computedPath
            parsed.question = null
          }
        }
      } else {
        // Confidence is sufficient AND result gate passed - ensure result is complete and dedupe avoid lines
        if (parsed.result) {
          parsed.result = dedupeAvoidLines(parsed.result)
        }
      }
    }

    // STAGE 2.1: RESULT COMPLETION GUARANTEE with RESULT GATE
    // If all questions answered (including Preference Gate), force done=true with result
    // BUT only if: confidence >= 0.8 AND classificationComplete AND all required fields answered
    if (normalizedState.path && !parsed.done && currentPhase === 'PATH') {
      // Check if there are any more questions using pure functions
      const pgQuestion = maybeTriggerPreferenceGate(updatedStateForConfidence)
      const pathQuestion = getNextPathQuestion(updatedStateForConfidence)
      
      if (!pgQuestion && !pathQuestion) {
        // All questions answered - check result gate before completion
        const allRequiredAnswered = areAllRequiredFieldsAnswered(updatedStateForConfidence)
        const classificationComplete = isClassificationComplete(updatedStateForConfidence)
        
        if (confidenceScore >= 0.8 && allRequiredAnswered && classificationComplete) {
          // Result gate passed - force completion
          if (process.env.NODE_ENV === 'development') {
            console.log(`[UK Career Assistant] Result gate passed: confidence=${confidenceScore.toFixed(2)}, allRequired=${allRequiredAnswered}, classificationComplete=${classificationComplete}`)
          }
          parsed.done = true
          parsed.phase = 'RESULT'
          parsed.question = null
          // If AI didn't provide result, generate one
          if (!parsed.result || !parsed.result.work_now || !parsed.result.work_now.directions || parsed.result.work_now.directions.length === 0) {
            parsed.result = generateSimpleResult(updatedStateForConfidence)
          }
          // Dedupe avoid lines
          if (parsed.result) {
            parsed.result = dedupeAvoidLines(parsed.result)
          }
          parsed.assistant_message = 'Here are your recommendations:'
        } else {
          // Result gate failed - should not happen if logic is correct
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[UK Career Assistant] All questions answered but result gate failed: confidence=${confidenceScore.toFixed(2)}, allRequired=${allRequiredAnswered}, classificationComplete=${classificationComplete}`)
          }
        }
      }
    }

    // Update state_updates to include asked_question_ids tracking
    if (parsed.question?.id) {
      const questionId = parsed.question.id
      const currentAskedIds = normalizedState.asked_question_ids || []
      if (!currentAskedIds.includes(questionId)) {
        parsed.state_updates = {
          ...parsed.state_updates,
          asked_question_ids: [...currentAskedIds, questionId]
        }
      }
    }

    // PREFERENCE GATE: Extract preferences from answers and update state
    // Check both existing state and new state_updates for answers
    const existingAnswers = normalizedState.answers || {}
    const newAnswers = parsed.state_updates?.answers || {}
    const allAnswers = { ...existingAnswers, ...newAnswers }
    
    // Update classification object when classification questions are answered
    // This ensures state.classification is always up-to-date
    const existingClassification = normalizedState.classification || {}
    
    // Update classification if any classification question was answered
    if (allAnswers['edu'] !== undefined || 
        allAnswers['exp'] !== undefined || 
        allAnswers['rel'] !== undefined) {
      const updatedClassification = {
        ...existingClassification,
        edu: allAnswers['edu'] || existingClassification['edu'] || null,
        exp: allAnswers['exp'] || existingClassification['exp'] || null,
        rel: allAnswers['rel'] || existingClassification['rel'] || null
      }
      
      // Only update if classification changed
      if (JSON.stringify(updatedClassification) !== JSON.stringify(existingClassification)) {
        parsed.state_updates = {
          ...parsed.state_updates,
          classification: updatedClassification
        }
      }
    }
    
    const currentPreferences = normalizedState.preferences || {}
    const newPreferences: any = { ...currentPreferences }
    let preferencesUpdated = false

    // Extract Preference Gate answers (check if answer exists and preference not already set)
    if (allAnswers['work_style'] && !currentPreferences.work_style) {
      newPreferences.work_style = allAnswers['work_style']
      preferencesUpdated = true
    }
    if (allAnswers['customer_interaction'] && !currentPreferences.customer_interaction) {
      newPreferences.customer_interaction = allAnswers['customer_interaction']
      preferencesUpdated = true
    }
    if (allAnswers['driving_interest'] && !currentPreferences.driving_interest) {
      newPreferences.driving_interest = allAnswers['driving_interest']
      preferencesUpdated = true
    }

    // Update preferences in state_updates
    if (preferencesUpdated) {
      parsed.state_updates = {
        ...parsed.state_updates,
        preferences: newPreferences
      }
    }

    // Mark Preference Gate as done if all questions are answered
    const updatedState = { 
      ...normalizedState, 
      ...parsed.state_updates, 
      answers: allAnswers,
      preferences: newPreferences 
    }
    // Check if preference gate is complete using pure function
    const nextPGQuestion = maybeTriggerPreferenceGate(updatedState)
    if (!nextPGQuestion && (updatedState.path === 'PATH_1' || updatedState.path === 'PATH_2' || updatedState.path === 'PATH_3')) {
      // All preference gate questions answered
      parsed.state_updates = {
        ...parsed.state_updates,
        preference_gate_done: true
      }
    }

    // Final validation: ensure assistant_message is concise
    if (parsed.assistant_message && parsed.question) {
      const sentences = parsed.assistant_message.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
      if (sentences.length > 2) {
        // Trim to first sentence and add "Next:"
        const firstSentence = sentences[0].trim()
        parsed.assistant_message = `Next: ${parsed.question.text}`
      } else if (!parsed.assistant_message.toLowerCase().includes('next') && !parsed.assistant_message.toLowerCase().includes('question')) {
        // Ensure it references the question
        parsed.assistant_message = `Next: ${parsed.question.text}`
      }
    }

    // PREFERENCE GATE: Apply result refinement based on preferences
    if (parsed.done && parsed.result) {
      const finalState = { ...normalizedState, ...parsed.state_updates }
      parsed.result = refineResultWithPreferences(parsed.result, finalState)
      // Dedupe avoid lines
      parsed.result = dedupeAvoidLines(parsed.result)
    }

    // FALLBACK: If AI skipped Preference Gate and returned done=true early, insert PG1
    // This is now handled by the confidence check above, but keep as additional safety
    if (parsed.done && normalizedState.path && currentPhase === 'PATH') {
      const pgQuestion = maybeTriggerPreferenceGate(updatedStateForConfidence)
      if (pgQuestion) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[UK Career Assistant] AI skipped Preference Gate, inserting PG1')
        }
        parsed.question = pgQuestion
        parsed.assistant_message = `Next: ${pgQuestion.text}`
        parsed.done = false
        parsed.result = null
      }
    }
    
    // Ensure confidence_score is always present in response
    if (parsed.confidence_score === undefined) {
      parsed.confidence_score = confidenceScore
    }

    // ENSURE state_updates includes phase, classification_done, path, classification
    // These must be persisted between requests
    const finalState = { ...normalizedState, ...parsed.state_updates }
    parsed.state_updates = {
      ...parsed.state_updates,
      phase: finalState.phase || normalizedState.phase || 'CLASSIFY',
      classification_done: finalState.classification_done !== undefined ? finalState.classification_done : (normalizedState.classification_done || false),
      path: finalState.path || normalizedState.path || null,
      classification: finalState.classification || normalizedState.classification || {}
    }

    // ============================================
    // FILTER NULL VALUES: Remove null/undefined from state_updates
    // ============================================
    const filteredStateUpdates: Record<string, any> = {}
    for (const [key, value] of Object.entries(parsed.state_updates)) {
      if (value !== null && value !== undefined) {
        filteredStateUpdates[key] = value
      }
    }
    parsed.state_updates = filteredStateUpdates

    // ============================================
    // CRITICAL SERVER GUARD: Block forbidden questions BEFORE returning response
    // ============================================
    // This is the LAST LINE OF DEFENSE - blocks classification questions after classification_done
    // DO NOT PASS THIS RESPONSE TO CLIENT if it contains forbidden questions
    // Education must be read ONLY from state.classification.edu, NOT from asking "edu" question
    if (normalizedState.classification_done === true || currentPhase === 'PATH' || currentPhase === 'RESULT') {
      if (parsed.question?.id === 'edu' ||
          parsed.question?.id === 'exp' ||
          parsed.question?.id === 'rel') {
        
        // HARD OVERRIDE - Block immediately
        console.warn(`Blocked forbidden classification question: ${parsed.question.id}`)
        
        // Use pure functions to get valid question
        if (currentPhase === 'PATH') {
          const pgQuestion = maybeTriggerPreferenceGate(normalizedState)
          if (pgQuestion) {
            parsed.question = pgQuestion
            parsed.assistant_message = `Next: ${pgQuestion.text}`
            parsed.done = false
            parsed.phase = 'PATH'
            parsed.result = null
          } else {
            const pathQuestion = getNextPathQuestion(normalizedState)
            if (pathQuestion) {
              parsed.question = pathQuestion
              parsed.assistant_message = `Next: ${pathQuestion.text}`
              parsed.done = false
              parsed.phase = 'PATH'
              parsed.result = null
            } else {
              // FAILSAFE: No more PATH questions - return RESULT immediately
              // NEVER fall back to classification
              if (process.env.NODE_ENV === 'development') {
                console.warn('[UK Career Assistant] No more PATH questions available, returning RESULT')
              }
              parsed.done = true
              parsed.phase = 'RESULT'
              parsed.question = null
              if (!parsed.result) {
                parsed.result = generateSimpleResult(normalizedState)
              }
              parsed.assistant_message = 'Here are your recommendations:'
            }
          }
        } else {
          // Should not happen, but handle gracefully
          parsed.done = true
          parsed.phase = 'RESULT'
          parsed.question = null
          if (!parsed.result) {
            parsed.result = generateSimpleResult(normalizedState)
          }
          parsed.assistant_message = 'Here are your recommendations:'
        }
      }
    }

    // Success - return validated response
    return NextResponse.json(parsed)
  } catch (error: any) {
    // Always return fallback on error - never break the chat
    if (process.env.NODE_ENV === 'development') {
      console.error('[UK Career Assistant] API error:', error)
      console.error('[UK Career Assistant] Error details:', error.message || 'Unknown error')
    }
    return NextResponse.json(getFallbackResponse())
  }
}

