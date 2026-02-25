/**
 * UK Career Brain - Scoring Engine
 * 
 * Weighted scoring model that ranks career directions based on user profile.
 * Implements context-aware analysis with conflict detection.
 */

export interface CareerDirection {
  direction_id: string
  direction_title: string
  score: number
  reasons: string[]
  tags: string[]
  conflicts?: string[]
}

export interface ScoringWeights {
  // Education factors
  education_level: number
  education_field_match: number
  education_alignment: number
  
  // Experience factors
  experience_field_match: number
  experience_years: number
  experience_alignment: number
  
  // Goal factors
  goal_type_match: number
  priorities_match: number
  
  // Constraint factors (negative weights)
  stress_tolerance: number
  burnout_signals: number
  physical_ability: number
  customer_comfort: number
  transport_match: number
  training_openness: number
  
  // Change factors
  desire_for_change: number
  constraints_to_avoid: number
}

/**
 * Default scoring weights
 * Higher = more important in ranking
 */
const DEFAULT_WEIGHTS: ScoringWeights = {
  education_level: 0.8,
  education_field_match: 1.2,
  education_alignment: 1.0,
  experience_field_match: 1.5,
  experience_years: 0.5,
  experience_alignment: 1.0,
  goal_type_match: 1.3,
  priorities_match: 1.0,
  stress_tolerance: -1.2, // Negative = penalty
  burnout_signals: -1.5,
  physical_ability: -1.0,
  customer_comfort: -1.1,
  transport_match: 0.9,
  training_openness: 0.7,
  desire_for_change: 0.6,
  constraints_to_avoid: -1.4
}

/**
 * Direction characteristics mapping
 * Defines what each direction requires/prefers
 */
const DIRECTION_CHARACTERISTICS: Record<string, {
  requires_education?: string[]
  requires_experience?: string[]
  requires_physical?: boolean
  requires_customer_facing?: boolean
  requires_transport?: 'licence' | 'car' | 'van'
  requires_training?: boolean
  stress_level?: 'low' | 'medium' | 'high'
  flexible_hours?: boolean
  entry_level?: boolean
}> = {
  'warehouse-logistics': {
    requires_physical: true,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'medium',
    flexible_hours: true,
    entry_level: true
  },
  'cleaner': {
    requires_physical: true,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'low',
    flexible_hours: true,
    entry_level: true
  },
  'hospitality-front': {
    requires_physical: false,
    requires_customer_facing: true,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'high',
    flexible_hours: true,
    entry_level: true
  },
  'care-support': {
    requires_physical: true,
    requires_customer_facing: true,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'high',
    flexible_hours: false,
    entry_level: true
  },
  'office-admin': {
    requires_physical: false,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'low',
    flexible_hours: false,
    entry_level: true
  },
  'driving-transport': {
    requires_physical: false,
    requires_customer_facing: false,
    requires_transport: 'licence',
    requires_training: false,
    stress_level: 'medium',
    flexible_hours: true,
    entry_level: false
  },
  'security-facilities': {
    requires_physical: false,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: true,
    stress_level: 'medium',
    flexible_hours: true,
    entry_level: false
  },
  'construction-trades': {
    requires_physical: true,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: true,
    stress_level: 'medium',
    flexible_hours: false,
    entry_level: false
  },
  'digital-ai-beginner': {
    requires_physical: false,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'low',
    flexible_hours: true,
    entry_level: true
  },
  'teaching-support': {
    requires_physical: false,
    requires_customer_facing: true,
    requires_transport: undefined,
    requires_training: false,
    stress_level: 'medium',
    flexible_hours: false,
    entry_level: true
  },
  'maintenance-facilities': {
    requires_physical: true,
    requires_customer_facing: false,
    requires_transport: undefined,
    requires_training: true,
    stress_level: 'low',
    flexible_hours: false,
    entry_level: false
  }
}

/**
 * Score a single career direction based on user state
 */
export function scoreDirection(
  directionId: string,
  state: any,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): CareerDirection {
  const answers = state?.answers || {}
  const characteristics = DIRECTION_CHARACTERISTICS[directionId] || {}
  
  let score = 0
  const reasons: string[] = []
  const tags: string[] = []
  const conflicts: string[] = []
  
  // Extract user profile
  const educationLevel = answers['education_level']
  const educationField = answers['education_field']
  const experienceField = answers['experience_field']
  const goalType = answers['goal_gate']
  const priorities = Array.isArray(answers['priorities']) ? answers['priorities'] : []
  const physicalAbility = answers['physical_ability']
  const peopleComfort = answers['people_comfort']
  const transport = answers['transport']
  const trainingOpenness = answers['training_openness']
  const changeReason = answers['change_reason']
  const moveAway = Array.isArray(answers['move_away']) ? answers['move_away'] : []
  const pressureSource = answers['pressure_source']
  
  // 1. Education level scoring
  if (educationLevel) {
    const levelScore = getEducationLevelScore(educationLevel)
    score += levelScore * weights.education_level
    if (levelScore > 0.5) {
      reasons.push(`Your ${educationLevel} qualification supports this direction`)
    }
  }
  
  // 2. Education field match
  if (educationField && characteristics.requires_education) {
    const fieldMatch = characteristics.requires_education.includes(educationField) ? 1.0 : 0.0
    score += fieldMatch * weights.education_field_match
    if (fieldMatch > 0) {
      reasons.push(`Your ${educationField} background aligns well`)
      tags.push('Education match')
    }
  }
  
  // 3. Experience field match
  if (experienceField && characteristics.requires_experience) {
    const expMatch = characteristics.requires_experience.includes(experienceField) ? 1.0 : 0.0
    score += expMatch * weights.experience_field_match
    if (expMatch > 0) {
      reasons.push(`Your ${experienceField} experience is directly relevant`)
      tags.push('Experience match')
    }
  }
  
  // 4. Goal type match
  if (goalType) {
    let goalMatch = 0
    if (goalType === 'side_income' && characteristics.flexible_hours) {
      goalMatch = 1.0
      reasons.push('Flexible shifts fit your side income goal')
      tags.push('Flexible')
    } else if (goalType === 'main_job' && !characteristics.flexible_hours) {
      goalMatch = 0.8
      reasons.push('Stable full-time work matches your goal')
    } else if (goalType === 'study_work' && characteristics.flexible_hours) {
      goalMatch = 1.0
      reasons.push('Flexible hours work well while studying')
      tags.push('Study-friendly')
    }
    score += goalMatch * weights.goal_type_match
  }
  
  // 5. Priorities match
  if (priorities.length > 0) {
    let priorityMatch = 0
    if (priorities.includes('stability') && !characteristics.flexible_hours) {
      priorityMatch += 0.3
      reasons.push('Offers the stability you need')
    }
    if (priorities.includes('less_stress') && characteristics.stress_level === 'low') {
      priorityMatch += 0.4
      reasons.push('Lower stress environment matches your priority')
    }
    if (priorities.includes('flexibility') && characteristics.flexible_hours) {
      priorityMatch += 0.3
      reasons.push('Flexible scheduling available')
    }
    if (priorities.includes('physical_ease') && !characteristics.requires_physical) {
      priorityMatch += 0.3
      reasons.push('Minimal physical demands')
    }
    score += priorityMatch * weights.priorities_match
  }
  
  // 6. Physical ability conflict check
  if (characteristics.requires_physical) {
    if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
      score += -1.5 * weights.physical_ability
      conflicts.push('Requires physical work, but you prefer non-physical')
    } else if (physicalAbility === 'light_physical') {
      score += -0.5 * weights.physical_ability
    } else {
      reasons.push('Physical work matches your ability level')
    }
  } else {
    if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'health_limitations') {
      reasons.push('Non-physical work suits your preferences')
    }
  }
  
  // 7. Customer comfort conflict check
  if (characteristics.requires_customer_facing) {
    if (peopleComfort === 'prefer_not') {
      score += -1.5 * weights.customer_comfort
      conflicts.push('Requires customer interaction, but you prefer not to')
    } else if (peopleComfort === 'comfortable') {
      score += 0.8 * weights.customer_comfort
      reasons.push('Customer-facing work matches your comfort level')
      tags.push('Customer-facing')
    }
  } else {
    if (peopleComfort === 'prefer_not') {
      reasons.push('Minimal customer interaction required')
    }
  }
  
  // 8. Transport conflict check
  if (characteristics.requires_transport) {
    if (transport === 'no_licence') {
      score += -2.0 * weights.transport_match
      conflicts.push('Requires driving licence, but you don\'t have one')
    } else if (transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car') {
      score += 1.0 * weights.transport_match
      reasons.push('Your transport situation supports this role')
      tags.push('Transport-ready')
    }
  }
  
  // 9. Training openness
  if (characteristics.requires_training) {
    if (trainingOpenness === 'no_work_soon') {
      score += -1.0 * weights.training_openness
      conflicts.push('Requires training, but you want to work immediately')
    } else if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
      score += 0.6 * weights.training_openness
      reasons.push('Short training unlocks better opportunities')
      tags.push('Training available')
    }
  } else {
    if (trainingOpenness === 'no_work_soon') {
      reasons.push('No training required - start immediately')
      tags.push('Fast entry')
    }
  }
  
  // 10. Stress/burnout conflict detection
  if (characteristics.stress_level === 'high') {
    if (changeReason === 'burnout_stress' || 
        moveAway.includes('high_stress') || 
        moveAway.includes('customer_pressure') ||
        pressureSource === 'customer_pressure') {
      score += -2.0 * weights.burnout_signals
      conflicts.push('High-stress role conflicts with your need to avoid stress')
    }
  }
  
  // 11. Long hours conflict
  if (moveAway.includes('long_hours') && !characteristics.flexible_hours) {
    score += -0.8 * weights.constraints_to_avoid
    conflicts.push('May involve long hours, which you want to avoid')
  }
  
  // 12. Entry level bonus
  if (characteristics.entry_level && (!educationLevel || !experienceField)) {
    score += 0.5
    reasons.push('Entry-level friendly - no prior experience required')
    tags.push('Entry-level')
  }
  
  return {
    direction_id: directionId,
    direction_title: getDirectionTitle(directionId),
    score: Math.max(0, score), // Ensure non-negative
    reasons: reasons.slice(0, 3), // Max 3 reasons
    tags: tags.slice(0, 4), // Max 4 tags
    conflicts: conflicts
  }
}

/**
 * Score all available directions and rank them
 */
export function scoreAllDirections(
  state: any,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): {
  workNow: CareerDirection[]
  improveLater: CareerDirection[]
  avoid: CareerDirection[]
} {
  const allDirectionIds = Object.keys(DIRECTION_CHARACTERISTICS)
  const scored = allDirectionIds.map(id => scoreDirection(id, state, weights))
  
  // Separate by score and conflicts
  const workNow: CareerDirection[] = []
  const improveLater: CareerDirection[] = []
  const avoid: CareerDirection[] = []
  
  const answers = state?.answers || {}
  const trainingOpenness = answers['training_openness']
  const goalType = answers['goal_gate']
  
  for (const direction of scored) {
    // High conflict = avoid (always)
    if (direction.conflicts && direction.conflicts.length >= 2) {
      avoid.push(direction)
      continue
    }
    
    // Single conflict + low score = avoid
    if (direction.conflicts && direction.conflicts.length === 1 && direction.score < 0.5) {
      avoid.push(direction)
      continue
    }
    
    // High score = work now (if no conflicts or conflicts are minor)
    if (direction.score >= 1.5) {
      workNow.push(direction)
      continue
    }
    
    // Medium score: decide based on training openness and goal type
    if (direction.score >= 0.5) {
      // If requires training and user says no, only put in improve later (or avoid if score too low)
      const requiresTraining = DIRECTION_CHARACTERISTICS[direction.direction_id]?.requires_training
      if (requiresTraining && trainingOpenness === 'no_work_soon') {
        // Can't be work now, but could be improve later if score is decent
        if (direction.score >= 1.0) {
          improveLater.push(direction)
        } else {
          avoid.push(direction)
        }
        continue
      }
      
      // If training openness allows, can be improve later
      if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
        improveLater.push(direction)
      } else if (direction.score >= 1.0) {
        // Still work now if score is decent and no training required
        workNow.push(direction)
      } else {
        // Low-medium score without training = avoid
        avoid.push(direction)
      }
    } else {
      // Low score = avoid
      avoid.push(direction)
    }
  }
  
  // Sort by score (descending)
  workNow.sort((a, b) => b.score - a.score)
  improveLater.sort((a, b) => b.score - a.score)
  
  // Limit results
  return {
    workNow: workNow.slice(0, 4), // Max 4 work now
    improveLater: improveLater.slice(0, 3), // Max 3 improve later
    avoid: avoid.slice(0, 4) // Max 4 avoid
  }
}

/**
 * Get education level score (0-1)
 */
function getEducationLevelScore(level: string): number {
  const scores: Record<string, number> = {
    'high_school': 0.3,
    'college_diploma': 0.5,
    'university_degree': 0.8,
    'postgraduate': 1.0
  }
  return scores[level] || 0.0
}

/**
 * Get human-readable direction title
 */
function getDirectionTitle(directionId: string): string {
  const titles: Record<string, string> = {
    'warehouse-logistics': 'Warehouse & Logistics',
    'cleaner': 'Cleaning',
    'hospitality-front': 'Hospitality (Front of House)',
    'care-support': 'Care & Support Work',
    'office-admin': 'Office & Admin Support',
    'driving-transport': 'Driving & Transport',
    'security-facilities': 'Security & Facilities',
    'construction-trades': 'Construction & Trades',
    'digital-ai-beginner': 'Digital & AI-Adjacent Roles',
    'teaching-support': 'Teaching Support',
    'maintenance-facilities': 'Maintenance & Facilities'
  }
  return titles[directionId] || directionId
}

