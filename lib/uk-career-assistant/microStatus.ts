/**
 * Micro Status Generator for UK Career Assistant
 * 
 * Generates truthful, UK Job Centre style status messages and keyword chips
 * to make the assistant feel alive and interactive without lying or hallucinating.
 */

export interface MicroStatus {
  line: string
  chips: string[]
}

/**
 * Get micro status based on current state, phase, and next question
 * 
 * @param state - Current AI state
 * @param phase - Current phase ('CLASSIFY' | 'PATH' | 'RESULT')
 * @param nextQuestionId - ID of the next question to be asked (null if moving to results)
 */
export function getMicroStatus(
  state: any,
  phase: 'CLASSIFY' | 'PATH' | 'RESULT' | 'classification' | 'assessment' | 'recommendation',
  nextQuestionId: string | null
): MicroStatus {
  // Normalize phase names
  const normalizedPhase = 
    phase === 'CLASSIFY' || phase === 'classification' ? 'CLASSIFY' :
    phase === 'PATH' || phase === 'assessment' ? 'PATH' :
    'RESULT'

  // CLASSIFY phase
  if (normalizedPhase === 'CLASSIFY') {
    return {
      line: "Got it — I'll ask a couple of quick basics to place you on the right path.",
      chips: ["Quick triage"]
    }
  }

  // RESULT phase - moving to results
  if (normalizedPhase === 'RESULT' || nextQuestionId === null) {
    return {
      line: "Summarising your situation and building your options…",
      chips: ["Work Now", "Improve Later"]
    }
  }

  // PATH phase - specific question-based statuses
  if (normalizedPhase === 'PATH') {
    // Communication & customer comfort questions
    if (nextQuestionId === 'language' || nextQuestionId === 'people_comfort') {
      return {
        line: "Checking communication & customer comfort…",
        chips: ["Customer-facing"]
      }
    }

    // Transport question
    if (nextQuestionId === 'transport') {
      return {
        line: "Checking travel options…",
        chips: ["Transport"]
      }
    }

    // Training openness question
    if (nextQuestionId === 'training_openness') {
      return {
        line: "Seeing if short licences could open better options…",
        chips: ["Improve later", "Licences"]
      }
    }

    // Physical ability question
    if (nextQuestionId === 'physical_ability') {
      return {
        line: "Checking physical requirements…",
        chips: ["Low physical strain"]
      }
    }

    // Goal gate question
    if (nextQuestionId === 'goal_gate') {
      return {
        line: "Understanding what you're looking for…",
        chips: []
      }
    }

    // Priorities question
    if (nextQuestionId === 'priorities') {
      return {
        line: "Identifying what matters most to you…",
        chips: []
      }
    }

    // Experience field question
    if (nextQuestionId === 'experience_field') {
      return {
        line: "Understanding your background…",
        chips: []
      }
    }

    // Education level/field questions
    if (nextQuestionId === 'education_level' || nextQuestionId === 'education_field') {
      return {
        line: "Reviewing your qualifications…",
        chips: []
      }
    }

    // Change reason question
    if (nextQuestionId === 'change_reason') {
      return {
        line: "Understanding why you're looking to change…",
        chips: []
      }
    }

    // Move away question
    if (nextQuestionId === 'move_away') {
      return {
        line: "Checking location flexibility…",
        chips: []
      }
    }

    // Strengths/transferable strengths questions
    if (nextQuestionId === 'strengths' || nextQuestionId === 'transferable_strengths') {
      return {
        line: "Identifying your strengths…",
        chips: []
      }
    }

    // Study status questions
    if (nextQuestionId === 'study_status' || nextQuestionId === 'work_during_study') {
      return {
        line: "Checking study situation…",
        chips: []
      }
    }

    // Current role type question
    if (nextQuestionId === 'current_role_type') {
      return {
        line: "Understanding your current role…",
        chips: []
      }
    }

    // Adjustment goal question
    if (nextQuestionId === 'adjustment_goal') {
      return {
        line: "Identifying what you want to adjust…",
        chips: []
      }
    }

    // Pressure source question
    if (nextQuestionId === 'pressure_source') {
      return {
        line: "Understanding current challenges…",
        chips: []
      }
    }

    // Change level question
    if (nextQuestionId === 'change_level') {
      return {
        line: "Assessing how much change you're open to…",
        chips: []
      }
    }

    // Trade type question
    if (nextQuestionId === 'trade_type') {
      return {
        line: "Identifying specific trade…",
        chips: []
      }
    }

    // Warehouse focus question
    if (nextQuestionId === 'warehouse_focus') {
      return {
        line: "Checking warehouse experience type…",
        chips: ["Night shifts"]
      }
    }

    // Default PATH phase message
    return {
      line: "Selecting next question…",
      chips: []
    }
  }

  // Fallback
  return {
    line: "Processing…",
    chips: []
  }
}

